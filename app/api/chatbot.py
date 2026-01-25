import asyncio
from typing import List
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import config
from app.core.logger import get_logger
from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.models.user import User
from app.schemas.chatbot import LLM_Info, ChatRequest, ChatResponse


router = APIRouter()
logger = get_logger(__name__)

available_llms = [
    LLM_Info(
        provider="OpenAI", 
        model_name=config.openai_llm_model,
        temperature=config.openai_llm_temperature,
    ),
    LLM_Info(
        provider="Anthropic", 
        model_name=config.anthropic_llm_model,
        temperature=config.anthropic_llm_temperature,
    ),
]

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

def generate_prompt(human_query: str):
    return [
        SystemMessage(content="You are a helpful and concise AI assistant."),
        HumanMessage(content=human_query),
    ]

async def chat_stream_callback(prompt, event_stream=False):
    async for chunk in antropic_llm.astream(prompt):
        if chunk.content:
            if event_stream:
                yield f"data: {chunk.content}\n\n"
            else:
                yield chunk.content # plain fetch-stream
        await asyncio.sleep(0)  # allows other awaiting tasks to run

@router.get("/llms", response_model=List[LLM_Info])
async def llm_list(
    user: User = Depends(current_active_user),
):
    return available_llms

@router.post("/chat/simple", response_model=ChatResponse)
async def chat_simple(
    chatRequest: ChatRequest,
    user: User = Depends(current_active_user),
):
    resp = openai_llm.invoke(generate_prompt(chatRequest.prompt))
    return ChatResponse(content=resp.content, llm_info=available_llms[0])

@router.post("/chat/stream")
async def chat_plain_stream(
    chatRequest: ChatRequest,
    user: User = Depends(current_active_user),
):    
    return StreamingResponse(
        chat_stream_callback(generate_prompt(chatRequest.prompt)),
        media_type="text/plain",
    )

@router.post("/chat/event-stream")
async def chat_event_stream(
    chatRequest: ChatRequest,
    user: User = Depends(current_active_user),
):
    return StreamingResponse(
        chat_stream_callback(generate_prompt(chatRequest.prompt), True),
        media_type="text/event-stream",
    )
