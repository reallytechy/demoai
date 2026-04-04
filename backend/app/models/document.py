"""Document upload models."""

from pydantic import BaseModel


class DocumentInfo(BaseModel):
    id: str
    filename: str
    file_type: str
    status: str  # uploaded, processing, processed, failed
    chunks: int = 0


class UploadResponse(BaseModel):
    document: DocumentInfo
    message: str
