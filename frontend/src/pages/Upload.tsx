import { useCallback, useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { uploadDocument, listDocuments, deleteDocument } from '../services/api'
import type { DocumentInfo } from '../services/api'

const STATUS_STYLES: Record<string, string> = {
  processed: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  uploaded: 'bg-slate-100 text-slate-700',
  failed: 'bg-red-100 text-red-700',
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: 'PDF',
  csv: 'CSV',
  json: 'JSON',
  xlsx: 'XLS',
}

export default function Upload() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadDocs = useCallback(async () => {
    try {
      const docs = await listDocuments()
      setDocuments(docs)
    } catch {
      // Backend might not be running
    }
  }, [])

  useEffect(() => { loadDocs() }, [loadDocs])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    setMessage('')

    for (const file of Array.from(files)) {
      try {
        const res = await uploadDocument(file)
        setMessage(res.message)
        setDocuments((prev) => [...prev, res.document])
      } catch (err: any) {
        setError(err.message)
      }
    }
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-20 pb-12 px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload Documents</h1>
        <p className="text-slate-500 mb-6">
          Upload your financial documents (credit reports, bank statements, etc.) to give the AI coach more context about your finances.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white'
          }`}
        >
          <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-slate-600 mb-2">
            {uploading ? 'Processing...' : 'Drag & drop files here, or click to browse'}
          </p>
          <p className="text-xs text-slate-400 mb-4">Supports PDF, CSV, JSON, XLSX (max 10MB)</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer transition-colors text-sm">
            <input
              type="file"
              accept=".pdf,.csv,.json,.xlsx"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? 'Uploading...' : 'Choose Files'}
          </label>
        </div>

        {/* Messages */}
        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Document list */}
        {documents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Uploaded Documents</h2>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
                      {FILE_TYPE_ICONS[doc.file_type] || doc.file_type.toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{doc.filename}</div>
                      <div className="text-xs text-slate-400">
                        {doc.chunks > 0 ? `${doc.chunks} chunks indexed` : doc.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[doc.status] || ''}`}>
                      {doc.status}
                    </span>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
