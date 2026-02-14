from typing import Dict, Optional, Union
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import get_logger
from app.db.async_db import AsyncSessionLocal
from app.models.llm_config import LlmConfig


logger = get_logger(__name__)
type LlmProvider = Union[ChatOpenAI, ChatAnthropic]

# Provider constants (should match database values)
class LlmProviderType:
    OPENAI = 0
    ANTHROPIC = 1
    AZURE = 2


class LlmCache:
    _instance: Optional['LlmCache'] = None
    _initialized: bool = False
    
    def __new__(cls) -> 'LlmCache':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if LlmCache._initialized:
            return
        
        self._llm_configs: Dict[int, LlmConfig] = {}  # id -> LlmConfig from db
        self._llm_instances: Dict[int, LlmProvider] = {}  # id -> LangChain instance
        LlmCache._initialized = True
    
    @property
    def is_loaded(self) -> bool:
        return len(self._llm_configs) > 0
    
    def get_llm_configs(self) -> Dict[int, LlmConfig]:
        return self._llm_configs
    
    def get_active_llm_configs(self) -> Dict[int, LlmConfig]:
        return {
            id: config for id, config in self._llm_configs.items() 
            if config.is_active and config.deleted_at is None
        }
    
    def get_llm_config(self, llm_id: int) -> Optional[LlmConfig]:
        return self._llm_configs.get(llm_id)
    
    def get_llm_instance(self, llm_id: int) -> Optional[LlmProvider]:
        return self._llm_instances.get(llm_id)
    
    def _create_llm_instance(self, config: LlmConfig) -> Optional[LlmProvider]:
        try:
            if config.provider == LlmProviderType.OPENAI:
                return ChatOpenAI(
                    base_url=config.api_endpoint if config.api_endpoint else None,
                    api_key=config.api_key,
                    model=config.model_name,
                    temperature=config.temperature,
                )
            elif config.provider == LlmProviderType.ANTHROPIC:
                return ChatAnthropic(
                    base_url=config.api_endpoint if config.api_endpoint else None,
                    api_key=config.api_key,
                    model_name=config.model_name,
                    temperature=config.temperature,
                )
            logger.warning(f"Unsupported LLM provider: {config.provider} for model {config.title}")
        except Exception as e:
            logger.error(f"Failed to create LLM instance for {config.title}: {e}")
        return None
    
    async def load(self, db: Optional[AsyncSession] = None) -> int:
        close_session = False
        if db is None:
            db = AsyncSessionLocal()
            close_session = True
        
        try:
            # Clear existing cache
            self._llm_configs.clear()
            self._llm_instances.clear()
            
            # Query all active LLMs configs from database
            query = select(LlmConfig).where(LlmConfig.deleted_at == None)
            query = query.where((LlmConfig.is_active == True) & (LlmConfig.category == 0))
            result = await db.execute(query)
            llm_configs = result.scalars().all()
            
            # Populate cache
            for llm_config in llm_configs:
                self._llm_configs[llm_config.id] = llm_config
                instance = self._create_llm_instance(llm_config)
                if instance:
                    self._llm_instances[llm_config.id] = instance
            logger.info(f"LLM config cache loaded count: {len(self._llm_configs)}")
            return len(self._llm_configs)
            
        except Exception as e:
            logger.error(f"Failed to load LLM config cache: {e}")
            raise
        finally:
            if close_session:
                await db.close()
    
    async def refresh(self) -> int:
        return await self.load()
    
    def invalidate(self, llm_id: Optional[int] = None):
        if llm_id is not None:
            self._llm_configs.pop(llm_id, None)
            self._llm_instances.pop(llm_id, None)
            logger.info(f"Invalidated LLM config cache for id={llm_id}")
        else:
            self._llm_configs.clear()
            self._llm_instances.clear()
            logger.info("Invalidated entire LLM config cache")


# Global instance
llm_cache = LlmCache()


async def init_llm_cache():
    """Initialize the LLM cache at application startup"""
    await llm_cache.load()


def get_llm_cache() -> LlmCache:
    """Dependency to get the LLM cache instance"""
    return llm_cache
