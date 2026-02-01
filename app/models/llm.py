from sqlalchemy import Column, Boolean, Integer, String, Float
from app.db.async_db import DbBase
from app.models.audit_mixin import AuditMixin


class Llm(DbBase, AuditMixin):
    __tablename__ = "llms"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider = Column(Integer, nullable=False) # i.e OpenAI, Anthropic, Azure
    category = Column(Integer, nullable=False) # i.e LLM, Embeddings
    is_active = Column(Boolean, default=False, nullable=False)
    
    title = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    api_endpoint = Column(String, nullable=False)
    api_key = Column(String, nullable=False)
    temperature = Column(Float, nullable=False)
    notes = Column(String, default="", nullable=False)

    is_starred = Column(Boolean, default=False, nullable=False)
    tags = Column(String, default="", nullable=False)  # Comma-separated tags
