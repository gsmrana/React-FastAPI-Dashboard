import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import config
from app.core.logger import get_logger
from app.core.users import current_active_user
from app.db.database import get_db
from app.models.tables import User
from app.schemas.chatbot import ChatRequest, ChatResponse


router = APIRouter()
logger = get_logger(__name__)

openai_llm = ChatOpenAI(
    base_url=config.OPENAI_ENDPOINT,
    api_key=config.OPENAI_API_KEY,
    model=config.OPENAI_LLM_MODEL,
)

antropic_llm = ChatAnthropic(
    base_url=config.ANTHROPIC_ENDPOINT,
    api_key=config.OPENAI_API_KEY,
    model_name=config.ANTHROPIC_LLM_MODEL,
)

def get_prompt(human_query: str):
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


@router.post("/chat-simple", response_model=ChatResponse)
async def chat_simple(
    req: ChatRequest,
    user: User = Depends(current_active_user),
):
    resp = openai_llm.invoke(get_prompt(req.content))
    return ChatResponse(content=resp.content)

@router.post("/chat-stream")
async def chat_stream_plain(
    req: ChatRequest,
    user: User = Depends(current_active_user),
):    
    return StreamingResponse(
        chat_stream_callback(get_prompt(req.content)),
        media_type="text/plain",
    )

@router.post("/chat-event-stream")
async def chat_stream_sse(
    req: ChatRequest,
    user: User = Depends(current_active_user),
):
    return StreamingResponse(
        chat_stream_callback(get_prompt(req.content), True),
        media_type="text/event-stream",
    )
