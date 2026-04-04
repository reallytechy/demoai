"""
Embedding model configuration — reads from settings, returns a LangChain Embeddings instance.
"""

from functools import lru_cache

from langchain_openai import OpenAIEmbeddings

from app.settings import get_settings


@lru_cache
def get_embeddings() -> OpenAIEmbeddings:
    """Return the configured embedding model."""
    settings = get_settings()
    return OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
    )
