import asyncio
from typing import Dict
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory

from app.core.config import config
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.models.user import User
from app.schemas.chatbot import (
    ChatRequest, ChatResponse,
    HistoryResponse
)


router = APIRouter()
chat_histories: Dict[str, InMemoryChatMessageHistory] = {}

openai_llm = ChatOpenAI(
    base_url=config.openai_api_endpoint,
    api_key=config.openai_api_key,
    model=config.openai_llm_model,
    temperature=config.openai_llm_temperature,
)

antropic_llm = ChatAnthropic(
    base_url=config.anthropic_api_endpoint,
    api_key=config.anthropic_api_key,
    model_name=config.anthropic_llm_model,
    temperature=config.anthropic_llm_temperature,
)

llms = [
    openai_llm, 
    antropic_llm,
]

def get_llm(llm_id: int):
    if llm_id >= len(llms):
        raise HTTPException(404, f"LLM id {llm_id} not found")
    return llms[llm_id]

def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    """Get or create chat history for a session"""
    if session_id not in chat_histories:
        chat_histories[session_id] = InMemoryChatMessageHistory()
    return chat_histories[session_id]

def create_chain(request: ChatRequest):
    """Create a conversational chain with history"""
    llm = get_llm(request.llm_id)
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

async def chat_stream_callback(llm, prompt, config=None, event_stream=False):
    async for chunk in llm.astream(prompt, config):
        if chunk.content:
            if event_stream:
                yield f"data: {chunk.content}\n\n"
            else:
                yield chunk.content # plain fetch-stream
        await asyncio.sleep(0)  # allows other awaiting tasks to run

@router.post("/chat/simple", response_model=ChatResponse)
async def chat_simple(
    request: ChatRequest,
    user: User = Depends(current_active_user),
):
    llm = get_llm(request.llm_id)
    prompt = generate_prompt(request)
    resp = llm.invoke(prompt)
    return ChatResponse(
        llm_id=request.llm_id, 
        response=resp.content,
    )

@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    event_stream: bool = False,
    user: User = Depends(current_active_user),
):    
    llm = get_llm(request.llm_id)
    prompt = generate_prompt(request)
    return StreamingResponse(
        chat_stream_callback(llm, prompt, event_stream=event_stream),
        media_type= "text/event-stream" if event_stream else "text/plain",
    )

@router.post("/chatbot/simple", response_model=ChatResponse)
async def chatbot_simple(
    request: ChatRequest,
    user: User = Depends(current_active_user),
):
    """
    Send a message and receive a response with preserved context
    
    - **message**: The user's message
    - **session_id**: Unique identifier for the conversation session
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

@router.post("/chatbot/stream")
async def chatbot_stream(
    request: ChatRequest,
    event_stream: bool = False,
    user: User = Depends(current_active_user),
):
    """
    Send a message and receive a streaming response with preserved context
    
    - **message**: The user's message
    - **session_id**: Unique identifier for the conversation session
    - **system_prompt**: Optional custom system prompt
    """
    if not request.session_id: 
        request.session_id = "default"
    chain = create_chain(request)
    prompt = {"input": request.message}
    config = {"configurable": {"session_id": request.session_id}}
    return StreamingResponse(
        chat_stream_callback(chain, prompt, config, event_stream),
        media_type= "text/event-stream" if event_stream else "text/plain",
    )

@router.get("/chatbot/history/{session_id}", response_model=HistoryResponse)
async def get_history(
    session_id: str,
    user: User = Depends(current_active_user),
):
    """
    Retrieve chat history for a specific session
    
    - **session_id**: The session identifier
    """
    if session_id not in chat_histories:
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

@router.delete("/chatbot/history/{session_id}")
async def clear_history(
    session_id: str,
    user: User = Depends(current_active_user),
):
    """
    Clear chat history for a specific session
    
    - **session_id**: The session identifier
    """
    if session_id not in chat_histories:
        raise HTTPException(status_code=404, detail="Session not found")
    
    chat_histories[session_id].clear()
    
    return HistoryResponse(
        session_id=session_id,
        messages=[],
        message_count=0,
    )

@router.get("/chatbot/sessions")
async def list_sessions(
    user: User = Depends(current_active_user),
):
    """List all active chat sessions"""
    sessions = [
        {
            "session_id": session_id,
            "message_count": len(history.messages)
        }
        for session_id, history in chat_histories.items()
    ]
    
    return {
        "total_sessions": len(sessions),
        "sessions": sessions
    }

@router.delete("/chatbot/sessions")
async def clear_all_sessions(
    user: User = Depends(current_active_user),
):
    """Clear all chat sessions"""
    count = len(chat_histories)
    chat_histories.clear()
    
    return {
        "message": "All sessions cleared",
        "sessions_cleared": count
    }
