# WealthifyAI — Submission Document

## One-Line Pitch

A multi-agent AI financial advisor that ingests user documents (PDFs, CSVs, images), reasons across them with 5 specialized agents, and delivers personalized financial plans — combining LangGraph orchestration, RAG, vision, tool use, diffusion, and TTS in one app.

---

## Problem

People struggle to make sense of their financial documents — credit reports, bank statements, salary slips are complex, scattered, and intimidating. Generic financial advice doesn't account for individual circumstances.

## Solution

WealthifyAI lets users upload their financial documents (including photos), then uses a team of AI agents to:
- Analyze debt and identify urgent risks
- Create personalized budgets based on actual spending
- Optimize debt payoff with mathematical simulations
- Build savings plans tailored to real income and expenses
- Generate a unified financial plan from all uploaded data

---

## Architecture

```
                        FRONTEND (React + Vite + Tailwind)
                        ┌─────────────────────────────────┐
                        │  Upload  My Plan  AI Coach  Tips │
                        └──────────────┬──────────────────┘
                                       │ HTTPS + X-User-Id
                                       ▼
                        BACKEND (FastAPI + LangGraph)
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌─────────────┐    ┌──────────────────────────────────┐     │
│  │  Document    │    │  LangGraph Multi-Agent System    │     │
│  │  Pipeline    │    │                                  │     │
│  │             │    │  ┌────────────┐                  │     │
│  │  PDF ──┐    │    │  │Orchestrator│──► Route Decision│     │
│  │  CSV ──┤    │    │  └─────┬──────┘                  │     │
│  │  JSON ─┤ ──►│RAG │       │                          │     │
│  │  XLSX ─┤    │    │  ┌────┴────┐                     │     │
│  │  Image─┘    │    │  ▼    ▼   ▼    ▼                 │     │
│  │   ▼         │    │  Debt Budget Savings Payoff      │     │
│  │  Vision     │    │  Anlzr Advsr Strtgst Optmzr     │     │
│  │   ▼         │    │  │    │    │    │                │     │
│  │  Chunk      │    │  └────┴────┴────┘                │     │
│  │   ▼         │    │       │                          │     │
│  │  Embed      │    │  ┌────▼─────┐                    │     │
│  │   ▼         │    │  │  Tools   │                    │     │
│  │  Vector     │◄───│  │  DTI Calc│                    │     │
│  │  Store      │    │  │  Payoff  │                    │     │
│  │  (per user) │    │  │  Budget  │                    │     │
│  └─────────────┘    │  │  Savings │                    │     │
│                      │  └──────────┘                    │     │
│                      └──────────────────────────────────┘     │
│                                                               │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Tip Generator   │  │  LangSmith   │  │  OpenRouter  │   │
│  │  LLM → Text      │  │  Tracing     │  │  Multi-Model │   │
│  │  Diffusion → Img │  │  (all calls) │  │  Gateway     │   │
│  │  gTTS → Audio    │  └──────────────┘  └──────────────┘   │
│  └──────────────────┘                                        │
└───────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, TypeScript |
| Backend | FastAPI, Python 3.11+ |
| Agent Framework | LangGraph (StateGraph), LangChain |
| LLM Provider | OpenRouter (Google Gemini 2.0 Flash — configurable) |
| RAG | Document loaders + embeddings + in-memory vector store |
| Vision | Gemini Flash multimodal (image-to-text extraction) |
| Image Generation | Pollinations.ai (diffusion model) |
| Text-to-Speech | gTTS (Google Text-to-Speech) |
| Speech-to-Text | Browser Web Speech API |
| Observability | LangSmith tracing |
| User Isolation | Anonymous per-browser UUID via X-User-Id header |

---

## AI Feature Matrix

### Agent Orchestration & Reasoning

| Feature | How It Works | Try It |
|---------|-------------|--------|
| **Multi-Agent Orchestration** | LangGraph StateGraph routes queries through `load_context → route → specialist → respond` pipeline | /chat |
| **Intent Classification & Routing** | Orchestrator LLM classifies user intent, dynamically routes to 1 of 4 specialist agents | /chat |
| **LLM Tool Calling** | Specialist agents call calculator tools (DTI, payoff simulator, budget analyzer, savings projector) — LLM decides when and which tool to invoke | /chat |
| **Multi-Agent Collaboration** | All 4 specialists contribute sections to one unified financial plan — sequential agent pipeline with structured output | /plan |
| **Conversation Memory** | 20-message sliding window per session, agents see conversation history for contextual follow-ups | /chat |

### RAG & Document Intelligence

| Feature | How It Works | Try It |
|---------|-------------|--------|
| **Document Ingestion** | Upload PDF, CSV, JSON, XLSX — parsed, chunked, and embedded | /upload |
| **Multimodal Vision (Image RAG)** | Upload PNG/JPG of financial documents — Gemini Flash vision model extracts all text/data, feeds into RAG | /upload |
| **Semantic Search** | User questions embedded and matched against document chunks by cosine similarity, top-K injected into agent context | /chat |
| **Cross-Document Reasoning** | Financial plan correlates salary + bank statement + credit report data into unified analysis | /plan |
| **Per-Document Summary** | Each uploaded document gets auto-extracted highlights: type detection, credit score, banks found, value distribution | /upload (Summary tab) |

### Generative AI & Multimodal

| Feature | How It Works | Try It |
|---------|-------------|--------|
| **Text Generation** | LLM generates financial tips, agent responses, plan sections with prompt engineering | /chat, /plan, /admin |
| **Structured JSON Output** | Plan agents return strict JSON schema (snapshot, actions, budget, payoff, savings) — parsed into structured UI | /plan |
| **Text-to-Image (Diffusion)** | LLM generates image description → Pollinations.ai diffusion model renders featured image | /admin?mode=write |
| **Text-to-Speech** | Blog text → gTTS → MP3 podcast audio, playable in-browser | /admin?mode=write |
| **Speech-to-Text** | Browser Web Speech API captures voice → transcribes to text for topic input | /admin?mode=write |

### Infrastructure & Operations

| Feature | How It Works | Try It |
|---------|-------------|--------|
| **LangSmith Tracing** | Every LLM call, tool execution, agent routing step auto-traced | /health |
| **Configurable LLM Provider** | Swap between OpenRouter models (Gemini, Llama, Claude, GPT) via .env — zero code changes | .env |
| **User Data Isolation** | Anonymous per-browser UUID in localStorage, sent as X-User-Id header, all data scoped per user | Automatic |
| **Friendly Error Handling** | Raw API errors (429, 401, timeout) converted to human-readable messages | /chat |
| **API Health Dashboard** | Real-time endpoint monitoring with response times + integration status | /health |

---

## What Makes This Stand Out

### 1. True Multi-Agent System (not just prompt chaining)
- LangGraph StateGraph with conditional routing — not a single LLM call
- Orchestrator makes routing decisions, specialists use domain-specific tools
- Financial plan runs all 4 agents and merges structured output

### 2. Multimodal RAG Pipeline
- Upload a PHOTO of a bank statement → vision model extracts text → RAG embeds it → agents reason over it
- Same pipeline handles PDFs, CSVs, XLSX, JSON, and images
- Per-user vector store isolation

### 3. Full Generative Stack
- Text generation (LLM) + Image generation (diffusion) + Audio generation (TTS) + Voice input (STT)
- All in one app, triggered from a single user action (write a tip)

### 4. Production-Ready Patterns
- All config in `.env` — swap LLM provider, model, vector store without code changes
- Per-user data isolation without auth overhead
- LangSmith observability built-in
- Friendly error handling for every failure mode

### 5. 30+ AI Features in One App
- Visit /showcase to see every feature with "Try it" links
- Not a demo of one technique — demonstrates how multiple AI capabilities work together

---

## Metrics

| Metric | Value |
|--------|-------|
| AI agents | 5 (orchestrator + 4 specialists) |
| LLM tools | 4 (DTI calc, payoff sim, budget analyzer, savings projector) |
| Document formats | 8 (PDF, CSV, JSON, XLSX, PNG, JPG, JPEG, WebP) |
| AI features | 30+ (see /showcase) |
| API endpoints | 15 |
| Frontend pages | 8 |
| Lines of Python (backend) | ~1,500 |
| Lines of TypeScript (frontend) | ~2,500 |
| External API dependencies | 1 (OpenRouter — everything goes through it) |
| Cost per query | ~$0.001 (Gemini Flash via OpenRouter) |

---

## Links

| Resource | URL |
|----------|-----|
| Live Demo | [deployment URL] |
| GitHub Repo | https://github.com/reallytechy/demoai |
| AI Showcase (interactive) | [deployment URL]/showcase |
| API Health | [deployment URL]/health |

---

## Team

