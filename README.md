# WealthifyAI — AI Financial Coach Agent

A personalized multi-agent AI financial advisor that ingests user documents (credit reports, bank statements, salary slips, images), builds a financial profile, and delivers actionable advice — powered by LangChain, LangGraph, OpenRouter, and RAG.

## Tech Stack

- **Backend:** FastAPI + LangChain + LangGraph (Python)
- **Frontend:** React 18 + Vite + Tailwind CSS (TypeScript)
- **AI:** OpenRouter (Google Gemini Flash, configurable), LangGraph multi-agent orchestration
- **RAG:** Document ingestion (PDF, CSV, JSON, XLSX, PNG, JPG) + vector store
- **Vision:** Gemini Flash multimodal (image-to-text extraction)
- **TTS:** Google Text-to-Speech (gTTS) for podcast generation
- **Image Gen:** Pollinations.ai diffusion model
- **Observability:** LangSmith tracing
- **Auth:** Anonymous user isolation (per-browser), Supabase ready

## Agents

| Agent | Role |
|-------|------|
| **Orchestrator** | Routes user queries to the right specialist |
| **Debt Analyzer** | Analyzes debt portfolio, risk flags, credit utilization |
| **Savings Strategist** | Personalized savings plans, emergency fund advice |
| **Budget Advisor** | Budget recommendations, 50/30/20 benchmark analysis |
| **Payoff Optimizer** | Avalanche vs snowball payoff strategies with projections |

## AI Features

| Feature | Technology | Where to Try |
|---------|-----------|-------------|
| Multi-Agent Orchestration | LangGraph StateGraph | /chat |
| LLM Tool Calling | LangChain tool binding | /chat |
| RAG (document retrieval) | Embeddings + vector store | /upload then /chat |
| Vision (image-to-text) | Gemini Flash multimodal | /upload (PNG/JPG) |
| Text-to-Image (diffusion) | Pollinations.ai | /admin?mode=write |
| Text-to-Speech | gTTS | /admin?mode=write |
| Speech-to-Text | Web Speech API | /admin?mode=write |
| Structured JSON Output | LLM + prompt engineering | /plan |
| Multi-Agent Collaboration | 4 agents build 1 plan | /plan |
| Conversation Memory | 20-message sliding window | /chat |
| LangSmith Tracing | LangChain auto-trace | /health |
| User Data Isolation | X-User-Id header | Automatic per browser |

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenRouter API key (https://openrouter.ai — free tier available)

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Edit `backend/.env` — set your OpenRouter key:

```
OPENROUTER_API_KEY=sk-or-your-key
```

Start the server:

```bash
source venv/bin/activate
uvicorn app.main:app --port 8001 --reload
```

Verify: http://localhost:8001/health

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

### Restart (one-liner)

```bash
kill $(lsof -ti:8001) $(lsof -ti:5173) 2>/dev/null; cd backend && source venv/bin/activate && uvicorn app.main:app --port 8001 --reload &; cd ../frontend && npm run dev &
```

---

## Testing Guide

### Frontend URLs

| URL | Page | Description |
|-----|------|-------------|
| http://localhost:5173/ | Landing | Home page with quick links |
| http://localhost:5173/upload | Upload | Upload documents + Financial Summary tab |
| http://localhost:5173/plan | My Plan | AI-generated personalized financial plan |
| http://localhost:5173/chat | AI Coach | Multi-agent chat with specialist routing |
| http://localhost:5173/admin | Tips | List of AI-generated tips |
| http://localhost:5173/admin?mode=write | Write a Tip | Voice/text input, generates tip + image + podcast |
| http://localhost:5173/showcase | AI Showcase | All AI features listed with "Try it" links |
| http://localhost:5173/health | API Health | Backend status, integrations, endpoint checks |

### Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check + config status |
| POST | /api/chat | Send message to AI coach |
| POST | /api/chat/stream | SSE streaming chat |
| GET | /api/chat/sessions/{id}/history | Chat history |
| DELETE | /api/chat/sessions/{id} | Clear session |
| POST | /api/documents/upload | Upload document (multipart) |
| GET | /api/documents | List uploaded documents |
| GET | /api/documents/summary | Financial summary per document |
| DELETE | /api/documents/{id} | Delete a document |
| POST | /api/plan/generate | Generate personalized financial plan |
| GET | /api/plan | Get latest plan |
| POST | /api/blog/generate | Generate a tip (text + image + audio) |
| GET | /api/blog | List all tips |
| GET | /api/blog/{id} | Get single tip |
| DELETE | /api/blog/{id} | Delete a tip |

All endpoints (except /api/blog) are scoped per user via `X-User-Id` header.

---

## How to Test Each Feature

### Feature 1: Upload Documents + Financial Summary

**URL:** http://localhost:5173/upload

**Steps:**
1. Download sample files from the blue info box (Salary Slip, Credit Report, Bank Statement)
2. Upload each file via drag-and-drop or "Choose Files"
3. Click "Financial Summary" tab
4. Each document shows: type badge, credit score (if detected), banks found, key data, value distribution

**What it demonstrates:** Document ingestion, RAG chunking, Vision (for PNG/JPG), data extraction

### Feature 2: My Plan (Multi-Agent Financial Plan)

**URL:** http://localhost:5173/plan

**Prerequisites:** Upload at least 1 document first.

**Steps:**
1. Click "Generate Plan" (takes 30-60 seconds)
2. Plan shows 5 sections:
   - Financial Snapshot (income, expenses, score, debt)
   - Urgent Actions (from Debt Analyzer agent)
   - Budget Plan 50/30/20 (from Budget Advisor agent)
   - Debt Payoff Plan (from Payoff Optimizer agent)
   - Savings Goals (from Savings Strategist agent)

**What it demonstrates:** Multi-agent collaboration, structured JSON output, cross-document reasoning, tool calling

### Feature 3: AI Coach Chat

**URL:** http://localhost:5173/chat

**Prerequisites:** Upload documents first for best results.

**Steps:**
1. Click any suggested question or type your own
2. Agent badge shows which specialist responded
3. Messages accumulate below — scroll up to pick another agent
4. Follow-up questions maintain conversation context (memory)

**Test messages:**
- "Analyze my debt" → Debt Analyzer (red badge)
- "Create a savings plan" → Savings Strategist (green badge)
- "What budget changes should I make?" → Budget Advisor (purple badge)
- "Compare avalanche vs snowball" → Payoff Optimizer (orange badge)
- "What is my credit score?" → Debt Analyzer (references uploaded data)

**What it demonstrates:** LangGraph routing, RAG retrieval, tool calling, session memory, LangSmith tracing

### Feature 4: Write a Tip (Voice + AI Generation)

**URL:** http://localhost:5173/admin?mode=write

**Steps:**
1. Click the microphone button and speak a topic (Chrome/Edge), or type in the text box
2. Click "Generate" or pick a quick topic preset
3. AI generates: blog text (~100 words), featured image (diffusion), podcast audio (TTS)
4. Click "View full tip" to see detail page with audio player

**What it demonstrates:** Speech-to-text (STT), text generation, image diffusion, text-to-speech (TTS)

### Feature 5: Image Upload (Vision/Multimodal)

**URL:** http://localhost:5173/upload

**Steps:**
1. Upload a PNG/JPG photo of a bank statement, salary slip, or receipt
2. Vision model (Gemini Flash) extracts all text and data from the image
3. Extracted data becomes searchable in AI Coach chat
4. Ask: "What does my salary slip show?" — agent answers from the image

**What it demonstrates:** Multimodal input, vision model, image-to-text, multimodal RAG

### Feature 6: AI Showcase

**URL:** http://localhost:5173/showcase

**What it shows:** 8 categories, 30+ features, each with description and "Try it" link. Tech stack pills: LangGraph, LangChain, LangSmith, OpenRouter, RAG, Embeddings, Tool Use, Vision, Diffusion, TTS, STT, Multimodal, Structured Output, Multi-Agent Pipeline.

### Feature 7: API Health Check

**URL:** http://localhost:5173/health

**What it shows:**
- Backend online/offline status with version
- Integration status: OpenRouter, OpenAI, LangSmith, Supabase
- LLM provider and model name
- Endpoint health table with response times

### Feature 8: User Data Isolation

**What it does:** Each browser gets a unique anonymous ID (stored in localStorage). Documents, chat, and plans are isolated per user. Tips are shared.

**How to test:**
1. Upload a document in Chrome → see it in Upload page
2. Open Safari (or incognito) → Upload page is empty
3. Chat in Chrome references Chrome's uploaded documents
4. Chat in Safari says "no documents uploaded"

---

## Automated Backend Test

```bash
curl -s http://localhost:8001/health | python3 -m json.tool
curl -s http://localhost:8001/api/documents -H "X-User-Id: test" | python3 -m json.tool
curl -s http://localhost:8001/api/plan -H "X-User-Id: test" | python3 -m json.tool
curl -s http://localhost:8001/api/blog | python3 -m json.tool
curl -s -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test" \
  -d '{"message":"hello","session_id":"test"}' | python3 -m json.tool
```

---

## Configuration

All config lives in `backend/.env`. Key settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | openrouter | `openrouter` or `openai` |
| `OPENROUTER_API_KEY` | — | Required for all AI features |
| `OPENROUTER_MODEL` | google/gemini-2.0-flash-001 | LLM model (supports vision) |
| `CORS_ALLOWED_ORIGINS` | http://localhost:5173 | Frontend origin |
| `LANGCHAIN_TRACING_V2` | false | Enable LangSmith tracing |
| `LANGCHAIN_API_KEY` | — | LangSmith API key |
| `AGENT_TEMPERATURE` | 0.1 | LLM creativity for agents |
| `MAX_UPLOAD_SIZE_MB` | 10 | Max document upload size |
| `ALLOWED_FILE_TYPES` | pdf,csv,json,xlsx,png,jpg,jpeg,webp | Accepted formats |

**Cheap OpenRouter models:**

| Model | Cost | Notes |
|-------|------|-------|
| `google/gemini-2.0-flash-001` | ~$0.10/M | Default — fast, supports vision |
| `meta-llama/llama-4-scout:free` | Free | Good for testing |
| `deepseek/deepseek-chat-v3-0324` | ~$0.14/M | Strong reasoning |
| `anthropic/claude-3.5-haiku` | ~$0.80/M | High quality |

---

## Project Structure

```
demoai/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app + CORS + static mounts
│   │   ├── settings.py            # All config from .env
│   │   ├── agents/                # LangGraph multi-agent system
│   │   │   ├── orchestrator.py    # StateGraph (route -> specialist -> tools)
│   │   │   ├── prompts.py         # System prompts per agent
│   │   │   ├── tools.py           # Financial calculator tools
│   │   │   └── state.py           # Shared agent state schema
│   │   ├── rag/                   # Document processing pipeline
│   │   │   ├── loader.py          # PDF/CSV/JSON/XLSX/Image loaders + Vision
│   │   │   ├── embeddings.py      # OpenRouter/OpenAI embedding config
│   │   │   └── vectorstore.py     # In-memory vector store per user
│   │   ├── services/              # Business logic
│   │   │   ├── blog_service.py    # Tip generation (text + image + TTS)
│   │   │   └── financial_plan.py  # Multi-agent plan generation
│   │   ├── routes/                # API endpoints
│   │   │   ├── chat.py            # Chat + SSE streaming (per user)
│   │   │   ├── documents.py       # Upload + summary (per user)
│   │   │   ├── plan.py            # Financial plan (per user)
│   │   │   └── blog.py            # Tips (shared)
│   │   ├── models/                # Pydantic schemas
│   │   └── data/
│   │       ├── samples/           # Demo files (salary, credit, bank)
│   │       └── blogs/             # Generated tip assets
│   ├── .env                       # Local config (git-ignored)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx        # Home page
│   │   │   ├── Upload.tsx         # Upload + Financial Summary tabs
│   │   │   ├── Plan.tsx           # My Plan (multi-agent)
│   │   │   ├── Chat.tsx           # AI Coach chat
│   │   │   ├── Admin.tsx          # Tips list / Write a Tip
│   │   │   ├── BlogDetail.tsx     # Single tip view
│   │   │   ├── Showcase.tsx       # AI feature showcase
│   │   │   └── Health.tsx         # API health check
│   │   ├── components/Navbar.tsx   # Navigation
│   │   └── services/api.ts        # API client with user ID
│   └── package.json
├── PLAN.md                        # Architecture plan
└── README.md                      # This file
```
