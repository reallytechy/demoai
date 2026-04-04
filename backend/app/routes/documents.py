"""
Document upload and processing endpoints.
Uploads are processed into RAG chunks and stored in the vector store.
"""

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from app.models.document import DocumentInfo, UploadResponse
from app.rag.loader import load_from_bytes
from app.rag.vectorstore import add_documents, clear_user_store
from app.settings import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

# In-memory document registry (demo mode)
_documents: dict[str, list[DocumentInfo]] = {}

# Demo user id
_DEMO_USER = "demo-user"


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile):
    """Upload a financial document (PDF, CSV, JSON, XLSX) for RAG processing."""
    settings = get_settings()

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lstrip(".").lower()
    if ext not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=400,
            detail=f"File type .{ext} not supported. Allowed: {settings.allowed_file_types}",
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Max: {settings.max_upload_size_mb}MB",
        )

    doc_id = str(uuid.uuid4())
    doc_info = DocumentInfo(
        id=doc_id,
        filename=file.filename,
        file_type=ext,
        status="processing",
    )

    try:
        docs = load_from_bytes(content, file.filename)
        chunks_added = add_documents(_DEMO_USER, docs)
        doc_info.status = "processed"
        doc_info.chunks = chunks_added
        logger.info(f"Processed {file.filename}: {chunks_added} chunks")
    except Exception as e:
        logger.exception(f"Failed to process {file.filename}")
        doc_info.status = "failed"
        return UploadResponse(
            document=doc_info,
            message=f"Failed to process file: {e}",
        )

    _documents.setdefault(_DEMO_USER, []).append(doc_info)

    return UploadResponse(
        document=doc_info,
        message=f"Processed {file.filename} into {doc_info.chunks} searchable chunks.",
    )


@router.get("", response_model=list[DocumentInfo])
async def list_documents():
    """List all uploaded documents."""
    return _documents.get(_DEMO_USER, [])


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document."""
    user_docs = _documents.get(_DEMO_USER, [])
    _documents[_DEMO_USER] = [d for d in user_docs if d.id != doc_id]
    return {"status": "deleted", "id": doc_id}


@router.delete("")
async def clear_all_documents():
    """Clear all documents and vector store for the demo user."""
    _documents.pop(_DEMO_USER, None)
    clear_user_store(_DEMO_USER)
    return {"status": "cleared"}
