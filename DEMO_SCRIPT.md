# WealthifyAI — Demo Script

> 5-minute walkthrough for live presentation or video recording.  
> Each step has talking points and what to show on screen.

---

## Setup (before demo)

1. Backend running: `cd backend && source venv/bin/activate && uvicorn app.main:app --port 8001 --reload`
2. Frontend running: `cd frontend && npm run dev`
3. Open browser to http://localhost:5173 (or deployed URL)
4. Clear any previous uploads (fresh state is best)

---

## Step 1: Landing Page (30 seconds)

**Show:** Home page at `/`

**Say:**
> "WealthifyAI is a multi-agent AI financial advisor. Users upload their financial documents, and our AI agents analyze them to deliver personalized advice."

**Point to:**
- Quick link cards (Upload, AI Coach, My Plan, Tips, Showcase)
- "How it works" steps (Upload → AI Analyzes → Get Advice)

**Click:** "Upload Docs" card

---

## Step 2: Upload Documents (60 seconds)

**Show:** Upload page at `/upload`

**Say:**
> "Users can upload credit reports, bank statements, salary slips — even photos of documents. Our system supports PDFs, CSVs, spreadsheets, and images."

**Do:**
1. Click "Download" on all 3 sample files (Salary Slip PNG, Credit Report PDF, Bank Statement CSV)
2. Drag all 3 into the drop zone
3. Wait for processing (show "processed" badges)

**Say:**
> "Each document is parsed and chunked. The salary slip is a PNG image — our Gemini Flash vision model extracts all text from the photo. PDFs and CSVs are parsed with specialized loaders. Everything goes into a per-user vector store for RAG retrieval."

**Click:** "Financial Summary" tab

**Say:**
> "Each document gets an auto-generated summary — document type detection, key data extraction, credit score identification, and bank detection. All without any user input."

---

## Step 3: Generate Financial Plan (60 seconds)

**Click:** "My Plan" in navbar

**Show:** Plan page at `/plan`

**Say:**
> "Now here's where it gets interesting. We run ALL four specialist agents on the uploaded data to generate a unified financial plan."

**Click:** "Generate Plan" button

**Say while loading:**
> "This runs four LLM calls — the Debt Analyzer assesses risk, the Budget Advisor creates a 50/30/20 budget, the Payoff Optimizer compares strategies, and the Savings Strategist builds a phased savings plan. Each agent returns structured JSON, which we merge into this dashboard."

**Point to each section as it loads:**
1. Financial Snapshot — "Income, expenses, credit score, debt — all extracted from uploaded documents"
2. Urgent Actions — "Prioritized by risk level — which debts need attention first"
3. Budget Plan — "50/30/20 breakdown with specific areas to cut spending"
4. Debt Payoff — "Avalanche strategy with month-by-month payoff order"
5. Savings Goals — "Phased approach — emergency fund first, then longer-term goals"

---

## Step 4: AI Coach Chat (60 seconds)

**Click:** "AI Coach" in navbar

**Show:** Chat page at `/chat`

**Say:**
> "Users can also have a conversation with our AI agents. The orchestrator routes each question to the right specialist."

**Click:** "Analyze my debt" suggested question

**Say while waiting:**
> "This goes through the LangGraph pipeline — load context from RAG, orchestrator classifies intent, routes to the Debt Analyzer, which uses the financial calculator tools to compute DTI ratio."

**Point to:**
- Red "Debt Analyzer" badge on the response
- Specific numbers from uploaded documents referenced in the answer

**Click:** "What budget changes should I make?"

**Say:**
> "Different question, different agent — now the Budget Advisor responds with the purple badge. Each agent has its own system prompt, tools, and expertise."

**Point to:**
- Purple "Budget Advisor" badge
- The hero section stays at top — user can pick another agent anytime

---

## Step 5: Write a Tip (45 seconds)

**Click:** "Admin" button (edit icon) in navbar

**Show:** Admin page at `/admin?mode=write`

**Say:**
> "This demonstrates our generative AI pipeline — text, image, and audio generation from a single input."

**Click:** "Savings Tips" quick topic button

**Say while loading:**
> "Three things happen: the LLM writes a short tip under 100 words, then it generates an image description which goes to a diffusion model, and finally the text is converted to a podcast via text-to-speech."

**Point to result:**
- Generated tip text
- AI-generated featured image
- Audio player — click play for 2-3 seconds

**Say:**
> "Users can also speak their topic using the microphone button — that's speech-to-text via the Web Speech API. So we have the full multimodal loop: voice in, text + image + audio out."

---

## Step 6: AI Showcase (30 seconds)

**Click:** "Showcase" in navbar

**Show:** Showcase page at `/showcase`

**Say:**
> "Finally, our showcase page documents every AI feature in the app — 8 categories, over 30 features. Each one has a 'Try it' link so reviewers can test them live."

**Scroll through:**
- Tech stack pills at top (LangGraph, LangChain, RAG, Vision, Diffusion, etc.)
- Agent Orchestration section
- RAG section
- Multimodal I/O section

---

## Step 7: Health Check (15 seconds)

**Click:** "API Health" in navbar

**Show:** Health page at `/health`

**Say:**
> "Our health dashboard shows real-time integration status — OpenRouter connected, LangSmith tracing enabled, all endpoints responding."

---

## Closing (15 seconds)

**Say:**
> "WealthifyAI demonstrates how LangGraph, LangChain, RAG, vision models, tool calling, diffusion, and TTS can work together in a production-ready application. All powered by a single OpenRouter API key, fully configurable via environment variables, with per-user data isolation. Thank you."

---

## Key Talking Points (if asked)

**Q: How is this different from just calling ChatGPT?**
> "Five specialized agents with domain-specific tools, conditional routing via LangGraph, RAG over user documents, and structured output — not a single prompt."

**Q: Why OpenRouter instead of direct OpenAI?**
> "One API key gives access to 100+ models. We can swap from Gemini to Claude to Llama by changing one env variable. Cost is ~50x cheaper than GPT-4o."

**Q: How does the image upload work?**
> "It's multimodal RAG — the image is sent to Gemini Flash's vision mode, which extracts all text. That text is chunked, embedded, and stored in the vector store. When you chat, those chunks are retrieved just like PDF or CSV data."

**Q: Is the data secure?**
> "Each browser gets a unique anonymous ID stored in localStorage. All documents, chat, and plans are scoped to that ID. In production, you'd wire up Supabase auth — the settings are already configured."

**Q: How does the financial plan work?**
> "We run all four specialist agents sequentially — each gets the full RAG context and returns structured JSON for their section. The backend merges them into one plan. It's multi-agent collaboration, not just routing."
