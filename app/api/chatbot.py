from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from openai import AzureOpenAI

from app.core.config import config
from app.core.logger import get_logger
from app.core.users import current_active_user
from app.db.database import get_db
from app.models.tables import User
from app.schemas.chatbot import (
    ChatRequest, 
    ChatResponse
)

router = APIRouter()
logger = get_logger(__name__)

llm = AzureOpenAI(
    azure_endpoint=config.AZUREAI_ENDPOINT_URL,
    api_key=config.AZUREAI_ENDPOINT_KEY,
    api_version=config.AZUREAI_API_VERSION,
)

@router.post("/chat-simple", response_model=ChatResponse)
async def chat_simple(
    chat_request: ChatRequest,
    user: User = Depends(current_active_user),
):
    try: 
        response = llm.chat.completions.create(
            model=config.AZUREAI_DEPLOYMENT,
            messages=[
                { "role": "system", "content": "You are a helpful assistant." },
                { "role": "user", "content": chat_request.content }
            ],
            max_completion_tokens=16384,
            temperature=1.0,
            top_p=1.0
        )    
        content = "No response!"
        if response.choices:
            content = response.choices[0].message.content
        return ChatResponse(content=content)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in chat-simple response: {str(e)}"
        )

def chat_stream_callback(prompt: str):
    response = llm.chat.completions.create(
        model=config.AZUREAI_DEPLOYMENT,
        messages=[
            { "role": "system", "content": "You are a helpful assistant." },
            { "role": "user", "content": prompt }
        ],
        max_completion_tokens=16384,
        temperature=1.0,
        top_p=1.0,
        stream=True
    )         
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            yield content   # plain fetch-stream  

@router.post("/chat-stream")
async def chat_stream(
    chat_request: ChatRequest,
    user: User = Depends(current_active_user),
):    
    try:
        return StreamingResponse(
            chat_stream_callback(chat_request.content),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in chat-stream response: {str(e)}"
        )

