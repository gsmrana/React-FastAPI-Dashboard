import asyncio
from typing import Dict
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory

from app.core.users import current_active_user
from app.core.llm_cache import LlmProvider, llm_cache
from app.models.user import User
from app.schemas.chatbot import (
    ChatRequest, ChatResponse,
    HistoryResponse
)


router = APIRouter()
chat_sessions: Dict[str, InMemoryChatMessageHistory] = {}


def get_llm_instance(llm_id: int) -> LlmProvider:
    """Get LLM instance from cache by ID"""
    llm = llm_cache.get_llm_instance(llm_id)
    if llm is None:
        # Check if the LLM config exists but is inactive
        llm_config = llm_cache.get_llm_config(llm_id)
        if llm_config is None:
            raise HTTPException(404, f"LLM id {llm_id} not found")
        elif not llm_config.is_active:
            raise HTTPException(400, f"LLM '{llm_config.title}' (id={llm_id}) is not active")
        else:
            raise HTTPException(500, f"LLM '{llm_config.title}' (id={llm_id}) failed to initialize")
    return llm

def create_user_chat_session(user: User) -> str:
    username = user.email.split("@")[0]
    last_id = 0
    for session_id in chat_sessions:
        if session_id.startswith(username):
            last_id = max(last_id, int(session_id.split("_")[-1]))
    
    session_id = f"{username}_{last_id + 1:02d}"
    chat_sessions[session_id] = InMemoryChatMessageHistory()
    return session_id

def get_user_chat_sessions(user: User) -> list[str]:
    username = user.email.split("@")[0]
    user_sessions = [session_id for session_id in chat_sessions if session_id.startswith(username)]
    if not user_sessions:  # create a default session
        session_id = create_user_chat_session(user)
        user_sessions.append(session_id)
    return user_sessions

def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in chat_sessions:
        chat_sessions[session_id] = InMemoryChatMessageHistory()
    return chat_sessions[session_id]

def create_chain(request: ChatRequest):
    """Create a conversational chain with history"""
    llm = get_llm_instance(request.llm_id)
    prompt = ChatPromptTemplate.from_messages([
        ("system", request.system_prompt),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}")
    ])
    
    chain = prompt | llm   
    chain_with_history = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="history"
    )
    return chain_with_history

def generate_prompt(request: ChatRequest):
    return [
        SystemMessage(content=request.system_prompt),
        HumanMessage(content=request.message),
    ]

async def chat_stream_callback(llm: LlmProvider, prompt, config=None, event_stream=False):
    async for chunk in llm.astream(prompt, config):
        if chunk.content:
            if event_stream:
                yield f"data: {chunk.content}\n\n"
            else:
                yield chunk.content # plain fetch-stream
        await asyncio.sleep(0)  # allows other awaiting tasks to run

@router.post("/ask/simple", response_model=ChatResponse)
async def ask_simple(
    request: ChatRequest,
    user: User = Depends(current_active_user),
):
    llm = get_llm_instance(request.llm_id)
    prompt = generate_prompt(request)
    resp = llm.invoke(prompt)
    return ChatResponse(
        llm_id=request.llm_id, 
        response=resp.content,
    )

@router.post("/ask/stream")
async def ask_stream(
    request: ChatRequest,
    event_stream: bool = False,
    user: User = Depends(current_active_user),
):    
    llm = get_llm_instance(request.llm_id)
    prompt = generate_prompt(request)
    return StreamingResponse(
        chat_stream_callback(llm, prompt, event_stream=event_stream),
        media_type= "text/event-stream" if event_stream else "text/plain",
    )

@router.post("/chat/simple", response_model=ChatResponse)
async def chat_simple(
    request: ChatRequest,
    user: User = Depends(current_active_user),
):
    """
    Send a message and receive a response with preserved context
    
    - **message**: The user's message
    - **system_prompt**: Optional custom system prompt
    """
    if not request.session_id: 
        request.session_id = "default"
    chain = create_chain(request)
    response = chain.invoke(
        {"input": request.message},
        config={"configurable": {"session_id": request.session_id}}
    )
    history = get_session_history(request.session_id)
    message_count = len(history.messages)
    return ChatResponse(
        llm_id=request.llm_id,
        response=response.content,
        session_id=request.session_id,
        message_count=message_count
    )

@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    event_stream: bool = False,
    user: User = Depends(current_active_user),
):
    """
    Send a message and receive a streaming response with preserved context
    
    - **message**: The user's message
    - **session_id**: Unique identifier for the conversation session
    - **system_prompt**: Optional custom system prompt
    - **event_stream**: Optional streaming event type
    """
    request.session_id = request.session_id or "default"
    chain = create_chain(request)
    prompt = {"input": request.message}
    config = {"configurable": {"session_id": request.session_id}}
    return StreamingResponse(
        chat_stream_callback(chain, prompt, config, event_stream),
        media_type= "text/event-stream" if event_stream else "text/plain",
    )

@router.get("/chat/history/{session_id}", response_model=HistoryResponse)
async def get_chat_history(
    session_id: str,
    user: User = Depends(current_active_user),
):
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    history = get_session_history(session_id)
    
    messages = [
        {
            "type": msg.type,
            "content": msg.content
        }
        for msg in history.messages
    ]
    
    return HistoryResponse(
        session_id=session_id,
        messages=messages,
        message_count=len(messages)
    )

@router.get("/chat/sessions")
async def list_all_chat_sessions(
    user: User = Depends(current_active_user),
):
    sessions = [
        {
            "session_id": session_id,
            "message_count": len(history.messages)
        }
        for session_id, history in chat_sessions.items()
    ]
    
    return {
        "total_sessions": len(sessions),
        "sessions": sessions
    }

@router.get("/chat/sessions/me")
async def get_chat_sessions_me(
    user: User = Depends(current_active_user),
):
    sessions = [
        {
            "session_id": session_id,
            "message_count": len(chat_sessions[session_id].messages)
        }
        for session_id in get_user_chat_sessions(user)
    ]
    
    return {
        "total_sessions": len(sessions),
        "sessions": sessions
    }

@router.get("/chat/sessions/new")
async def create_chat_session_me(
    user: User = Depends(current_active_user),
):
    create_user_chat_session(user)
    sessions = [
        {
            "session_id": session_id,
            "message_count": len(chat_sessions[session_id].messages)
        }
        for session_id in get_user_chat_sessions(user)
    ]
    
    return {
        "total_sessions": len(sessions),
        "sessions": sessions
    }

@router.delete("/chat/sessions")
async def delete_all_chat_sessions(
    user: User = Depends(current_active_user),
):
    count = len(chat_sessions)
    chat_sessions.clear()
    return { 
        "deleted_sessions": count,
        "detail": "All chat sessions deleted",
    }

@router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    user: User = Depends(current_active_user),
):
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del chat_sessions[session_id]
    return { 
        "session_id": session_id, 
        "detail": "Chat session deleted" 
    }
