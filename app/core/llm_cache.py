"""
LLM Cache Service - Caches LLM model configurations from database

This module provides a caching layer for LLM models 
to avoid database reads on every chatbot API call.
The cache can be refreshed when models are 
created or updated in the database.
"""
from typing import Dict, Optional, Union
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

from app.core.logger import get_logger
from app.db.async_db import AsyncSessionLocal
from app.models.llm import Llm


logger = get_logger(__name__)
type LlmProvider = Union[ChatOpenAI, ChatAnthropic]

# Provider constants (should match database values)
class LlmProviderType:
    OPENAI = 0
    ANTHROPIC = 1
    AZURE = 2


class LlmCache:
    """
    Singleton cache for LLM model instances.
    
    Loads LLM configurations from database and creates corresponding
    LangChain model instances. The cache is stored in memory to avoid
    database reads on every API call.
    """
    
    _instance: Optional["LlmCache"] = None
    _initialized: bool = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._llm_configs: Dict[int, Llm] = {}  # id -> Llm model from db
            self._llm_instances: Dict[int, LlmProvider] = {}  # id -> LangChain instance
            LlmCache._initialized = True
    
    @property
    def is_loaded(self) -> bool:
        """Check if cache has been loaded with data"""
        return len(self._llm_configs) > 0
    
    def get_llm_configs(self) -> Dict[int, Llm]:
        """Get all cached LLM configurations"""
        return self._llm_configs
    
    def get_active_llm_configs(self) -> Dict[int, Llm]:
        """Get only active (non-deleted) LLM configurations"""
        return {
            id: config for id, config in self._llm_configs.items() 
            if config.is_active and config.deleted_at is None
        }
    
    def get_llm_config(self, llm_id: int) -> Optional[Llm]:
        """Get a specific LLM configuration by ID"""
        return self._llm_configs.get(llm_id)
    
    def get_llm_instance(self, llm_id: int) -> Optional[LlmProvider]:
        """Get a LangChain LLM instance by ID"""
        return self._llm_instances.get(llm_id)
    
    def _create_llm_instance(self, config: Llm) -> Optional[LlmProvider]:
        """Create a LangChain LLM instance from database configuration"""
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
        """
        Load all LLM configurations from database and create instances.
        
        Args:
            db: Optional database session. If not provided, creates a new session.
            
        Returns:
            Number of LLM models loaded
        """
        close_session = False
        if db is None:
            db = AsyncSessionLocal()
            close_session = True
        
        try:
            # Clear existing cache
            self._llm_configs.clear()
            self._llm_instances.clear()
            
            # Query all active LLMs from database
            query = select(Llm).where(Llm.deleted_at == None)
            result = await db.execute(query)
            llms = result.scalars().all()
            
            # Populate cache
            for llm in llms:
                self._llm_configs[llm.id] = llm
                
                # Only create instances for active models
                if llm.is_active:
                    instance = self._create_llm_instance(llm)
                    if instance:
                        self._llm_instances[llm.id] = instance
                        logger.info(f"Loaded LLM cache: {llm.title} (id={llm.id}, provider={llm.provider})")
            
            logger.info(f"LLM cache loaded: {len(self._llm_configs)} configs, {len(self._llm_instances)} active instances")
            return len(self._llm_configs)
            
        except Exception as e:
            logger.error(f"Failed to load LLM cache: {e}")
            raise
        finally:
            if close_session:
                await db.close()
    
    async def refresh(self) -> int:
        """Refresh the cache by reloading from database"""
        logger.info("Refreshing LLM cache...")
        return await self.load()
    
    def invalidate(self, llm_id: Optional[int] = None):
        """
        Invalidate cache entries.
        
        Args:
            llm_id: If provided, invalidates only that specific model.
                   If None, invalidates entire cache.
        """
        if llm_id is not None:
            self._llm_configs.pop(llm_id, None)
            self._llm_instances.pop(llm_id, None)
            logger.info(f"Invalidated LLM cache for id={llm_id}")
        else:
            self._llm_configs.clear()
            self._llm_instances.clear()
            logger.info("Invalidated entire LLM cache")


# Global cache instance
llm_cache = LlmCache()


async def init_llm_cache():
    """Initialize the LLM cache at application startup"""
    await llm_cache.load()


def get_llm_cache() -> LlmCache:
    """Dependency to get the LLM cache instance"""
    return llm_cache
