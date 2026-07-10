## **FounderPrep** 

**Indian Startup Compliance & Setup Platform** Complete Project Document  |  v1.0  |  2026 

_Built with Next.js  •  Supabase  •  Groq  •  HuggingFace  •  RAG_ 

## **1. Executive Summary** 

FounderPrep is an AI-powered compliance and setup platform built specifically for Indian startup founders. The platform uses a Retrieval-Augmented Generation (RAG) system to give every founder a personalized, real-time compliance roadmap — from day one of ideation to a fully legal and operational startup. 

The core problem FounderPrep solves is the knowledge gap that exists between having a startup idea and knowing what legal, regulatory, and operational steps must be taken to build it properly. Most first-time founders in India have no idea what documents they need, in what order to get them, what the deadlines are, or what happens if they miss them. 

|**Field**|**Details**|
|---|---|
|**Project Name**|FounderPrep — Indian Startup Compliance & Setup Platform|
|**Target Market**|First-time startup founders in India|
|**Tech Stack**|Next.js, Supabase, Groq API, HuggingFace, RAG Pipeline|
|**Core Technology**|Retrieval-Augmented Generation (RAG) with pgvector|
|**Deployment**|Vercel (frontend) + Supabase (backend)|
|**Business Model**|Freemium — Free checklist, Paid AI assistant + Expert connect|



## **2. Problem Statement** 

Every year, over 1 lakh startups are registered in India. The majority of first-time founders face the same set of painful, avoidable problems: 

- They do not know which registrations and certifications are legally required for their specific business type and domain. 

- They do not know the correct order in which to obtain these documents. 

- They are unaware of filing deadlines and the financial penalties for missing them. 

- They do not know how to apply — which portal, which documents to submit, how long it takes. 

- They spend thousands of rupees on consultants for information that should be freely accessible. 

- Their documents expire or lapse because there is no centralized tracking system. 

- They have no guidance on setting up basic business infrastructure beyond documents — accounting, HR, legal, tech. 

The result: Founders waste months in confusion, face legal risks, miss tax benefits, and lose credibility with investors — all because of a solvable information problem. 

## **3. Solution — What FounderPrep Does** 

FounderPrep acts as an intelligent compliance co-pilot. When a founder registers and enters their startup profile, the platform immediately generates a complete, personalized action plan — powered by RAG — that tells them exactly what to do, how to do it, and when. 

## **How RAG Powers FounderPrep** 

RAG (Retrieval-Augmented Generation) is the core intelligence engine behind every recommendation FounderPrep makes. Here is how it works: 

1. Founder submits their profile — business type, domain, state, team size, funding stage. 

2. System automatically forms a compliance query from the profile. 

3. RAG retrieves the most relevant sections from a vector database of MCA circulars, GST rules, DPIIT guidelines, labour laws, and domain-specific regulations. 

4. Groq LLM reads the retrieved context and generates a precise, personalized checklist with deadlines, steps, and penalty information. 

5. The checklist updates dynamically as the founder marks items complete or as new regulations are published. 

RAG is not used as a chatbot here — it is used as a real-time document intelligence engine that powers every feature of the platform. 

## **4. Features** 

## **4.1 Founder Onboarding** 

A guided multi-step form that collects the founder's startup profile. This profile is the input to every RAG query in the system. 

- Step 1: Business type — Private Limited, LLP, OPC, Sole Proprietorship, Section 8 

- Step 2: Domain — EdTech, HealthTech, FinTech, AgriTech, Retail, Manufacturing, SaaS, and more 

- Step 3: State — compliance requirements vary by state in India 

- Step 4: Team size, funding stage, and revenue status 

- Output: Instant personalized compliance roadmap generated via RAG 

## **4.2 RAG-Powered Compliance Checklist (Core Feature)** 

The heart of FounderPrep. A dynamically generated checklist that tells every founder exactly which certifications and filings they need based on their unique profile. 

|**Category**|**Certification**|**Who Needs It**|**Priority**|
|---|---|---|---|
|**Core**|GSTIN|All businesses with turnover > 20L|Mandatory|
|**Core**|PAN & TAN|All registered companies|Mandatory|
|**Core**|ROC Filing|Pvt Ltd, LLP, OPC|Mandatory|
|**Startup**|DPIIT Recognition|Startups seeking tax benefits|High|
|**Startup**|Startup India|All recognized startups|High|
|**Startup**|80IAC Tax<br>Exemption|DPIIT-recognized startups|High|
|**MSME**|Udyam Registration|Businesses under MSME criteria|Recommended|
|**Labour**|PF Registration|Companies with 20+ employees|Mandatory|
|**Labour**|ESI Registration|Companies with 10+ employees|Mandatory|
|**Domain**|FSSAI License|Food & beverage businesses|Mandatory|
|**IP**|Trademark|Brand-building startups|Recommended|
|**Finance**|NBFC License|FinTech lending platforms|Mandatory|



Each checklist item includes: what it is, why the founder needs it, step-by-step application instructions, deadline, penalty for non-compliance, and current status tracking. 

## **4.3 AI Compliance Assistant** 

A natural language interface where founders can ask any compliance question and receive a grounded, cited answer retrieved from actual regulation documents. 

- Powered by RAG + Groq LLM — answers cite which regulation they come from 

- Handles questions like: Do I need FSSAI if I am a SaaS platform for restaurants? 

- Handles questions like: What is the penalty if I miss GST filing this month? 

- Handles questions like: What is the difference between DPIIT and Startup India? 

- Gracefully says I do not have enough information rather than hallucinating 

## **4.4 Deadline Calendar & Smart Alerts** 

An automated system that tracks every compliance deadline and notifies founders before they miss it. 

- Auto-populates filing deadlines based on the founder's compliance checklist 

- Color-coded calendar: Red for overdue, Yellow for this week, Green for upcoming 

- Dashboard widget: You have 3 filings due this month 

- Email alerts at 7 days before, 1 day before, and on the deadline day 

- Supabase Edge Function runs daily to check and trigger alerts 

## **4.5 Document Vault** 

A secure, organized storage system for all startup documents with expiry tracking. 

- Upload and store all certificates in one place (GSTIN, DPIIT, Udyam, etc.) 

- Expiry date tracking with alerts 30 days before expiry 

- Document tagged by type for easy retrieval 

- Share vault access with CA, lawyer, or co-founder 

- Backed by Supabase Storage 

## **4.6 Startup Infra Setup Roadmap** 

Beyond documents, FounderPrep guides founders on setting up the complete operational infrastructure of their startup. 

- Tech Infra: Cloud provider selection, payment gateway, email setup, domain and hosting 

- Legal Infra: Founder agreements, IP assignment, ESOP basics, NDA templates 

- Finance Infra: Business bank account setup, accounting software, CA selection 

- HR Infra: Offer letter templates, PF setup, payroll basics, leave policy 

- Each recommendation is RAG-powered based on the startup's domain and size 

## **4.7 Expert Connect** 

A marketplace layer connecting founders with verified professionals for hands-on compliance help. 

- Connect with verified CAs, lawyers, trademark agents, and company secretaries 

- Book consultations directly from the platform 

- Get this done for me option — professional handles the filing end-to-end 

- Transparent pricing, verified credentials, and founder reviews 

## **5. Tech Stack** 

## **5.1 Full Stack Overview** 

|**Layer**|**Technology & Reason**|
|---|---|
|**Frontend**|Next.js 14 (App Router) — Full-stack React framework with server<br>components|
|**Database**|Supabase (PostgreSQL) — Managed DB with built-in Auth, Storage,<br>and Edge Functions|
|**Vector Store**|Supabase pgvector — Store and search document embeddings within<br>existing DB|
|**Embeddings**|HuggingFace Inference API — Free, production-ready embedding<br>models|
|**LLM**|Groq API (Free Tier) — Ultra-fast inference, Llama 3.2 model, no local<br>GPU needed|
|**Email Alerts**|Resend — Developer-friendly transactional email API|
|**File Storage**|Supabase Storage — Document vault file uploads|
|**Deployment**|Vercel (frontend) + Supabase (backend) — Zero config deployment|



## **5.2 RAG Pipeline Stack** 

|**Stage**|**Tool Used**|
|---|---|
|**Document Ingestion**|pdf-parse (Node.js) — Extract text from compliance PDF documents|
|**Chunking**|LangChain — Split documents into semantic chunks with overlap|
|**Embedding Model**|HuggingFace — sentence-transformers/all-MiniLM-L6-v2 (384<br>dimensions)|
|**Vector Database**|Supabase pgvector — Store embeddings, cosine similarity search|
|**Retrieval**|Supabase match_documents RPC — Top-K semantic search|
|**LLM Generation**|Groq API — Llama 3.2 generates answer from retrieved context|
|**Orchestration**|Custom pipeline in lib/rag/ — embed.js, ingest.js, retrieve.js|



## **5.3 Why This Stack** 

- 100% free to build and run in development — no credit card required 

- Groq free tier handles thousands of requests per day — enough for an MVP launch 

- Supabase pgvector eliminates the need for a separate vector database like Pinecone 

- HuggingFace Inference API is free and production-ready for embeddings 

- Next.js handles both frontend and backend in one codebase — one deployment 

- The entire stack is swap-friendly — switching to Claude API or OpenAI later is just 2 lines of code 

## **6. System Architecture** 

## **6.1 Folder Structure** 

|**Path**|**Purpose**|
|---|---|
|**app/**/page.js**|Frontend pages visible to users in the browser|
|**app/api/**/route.js**|Backend API routes — server-side only|
|**components/**|Reusable React UI components (buttons, cards, forms)|
|**lib/supabase/**|Supabase client setup for browser and server|
|**lib/rag/embed.js**|HuggingFace embedding calls|
|**lib/rag/ingest.js**|Document chunking and vector DB population|
|**lib/rag/retrieve.js**|Semantic search — query to top-K chunks|
|**lib/groq/client.js**|Groq LLM API calls and prompt construction|
|**data/compliance-docs/**|Raw compliance PDFs and text files (knowledge base)|
|**.env.local**|All API keys and secrets — never exposed to browser|



## **6.2 Request Flow** 

The following describes how a compliance checklist is generated for a founder: 

6. Founder completes onboarding form — business type, domain, state, team size. 

7. Frontend sends POST request to /api/compliance/generate. 

8. API route reads the profile and constructs a compliance query string. 

9. Query is sent to lib/rag/embed.js which calls HuggingFace to generate the query embedding. 

10. lib/rag/retrieve.js runs a cosine similarity search against Supabase pgvector and returns top-5 chunks. 

11. API route sends the chunks + query to lib/groq/client.js as context. 

12. Groq LLM generates a structured JSON checklist grounded only in the retrieved context. 

13. API returns the checklist to the frontend, which renders it as an interactive UI. 

14. Founder's checklist status is saved to Supabase user_compliance table. 

## **7. Database Schema** 

|**Table**|**Purpose & Key Fields**|
|---|---|
|**users**|Founder profile — id, email, name, business_type, domain, state, team_size,<br>funding_stage, created_at|
|**compliance_items**|Master list of all certifications — id, name, category, description,<br>how_to_apply, mandatory, domain_specific|
|**user_compliance**|Per-founder checklist — id, user_id, compliance_item_id, status, deadline,<br>completed_at|
|**deadlines**|Filing dates — id, compliance_item_id, due_date, recurrence,<br>penalty_description|
|**documents**|Vault uploads — id, user_id, file_name, file_url, doc_type, expiry_date,<br>uploaded_at|
|**embeddings**|RAG vector store — id, content, embedding (vector 384), metadata,<br>chunk_index|
|**notifications**|Alert history — id, user_id, type, message, sent_at, compliance_item_id|



## **8. Build Milestones** 

|**#**|**Milestone**|**Deliverable**|**Timeline**|
|---|---|---|---|
|**M1**|**Project Foundation**|Next.js app running, all packages<br>installed, env setup, Supabase<br>connected|Day 1|
|**M2**|**Authentication**|Founders can register, login,<br>logout with Supabase Auth,<br>protected routes|Day 2-3|
|**M3**|**Database Schema**|All tables created in Supabase,<br>pgvector enabled, RLS policies<br>set|Day 4|
|**M4**|**RAG Knowledge Base**|Compliance docs ingested,<br>HuggingFace embeddings stored<br>in pgvector, test query working|Day 5-7|
|**M5**|**Founder Onboarding**|Multi-step onboarding form, profile<br>saved to Supabase, redirect to<br>dashboard|Day 8-9|
|**M6**|**Compliance Checklist**|RAG generates personalized<br>checklist, status tracking, filter by<br>category|Day 10-13|
|**M7**|**AI Assistant**|Natural language Q&A, RAG<br>retrieval, Groq generation, cited<br>answers|Day 14-16|
|**M8**|**Deadline Alerts**|Calendar UI, color-coded<br>deadlines, email alerts via<br>Resend, Edge Functions|Day 17-19|
|**M9**|**Document Vault**|File upload, Supabase Storage,<br>expiry tracking, share access|Day 20-21|
|**M10**|**Dashboard & Polish**|Compliance score widget, mobile<br>responsive, loading states, error<br>handling|Day 22-24|
|**M11**|**Deploy & Launch**|Vercel deployment, production<br>Supabase, custom domain,<br>LinkedIn launch post|Day 25|



## **9. Milestone Detail Checklist** 

## **Milestone 1 — Project Foundation** 

- Next.js 14 project created with App Router, Tailwind CSS, ESLint 

- Complete folder structure created: app/, components/, lib/, data/ 

- All npm packages installed: supabase, groq-sdk, huggingface/inference, langchain, pdfparse, resend, date-fns 

- Supabase project created and keys added to .env.local 

- Groq account created and API key added to .env.local 

- HuggingFace account created and API key added to .env.local 

- npm run dev works without errors at localhost:3000 

## **Milestone 2 — Authentication** 

- Supabase Auth enabled with email/password provider 

- Register page with name, email, password, confirm password 

- Login page with email and password 

- Protected route middleware — redirect unauthenticated users to login 

- Session persistence across page refreshes 

- Logout button clears session and redirects to login 

- User record created in users table on registration 

## **Milestone 3 — Database Schema** 

- pgvector extension enabled via Supabase SQL editor 

- All 7 tables created: users, compliance_items, user_compliance, deadlines, documents, embeddings, notifications 

- Row Level Security (RLS) enabled — users can only access their own data 

- Test insert and fetch works from Next.js API route 

- match_documents SQL function created for vector similarity search 

## **Milestone 4 — RAG Knowledge Base** 

- Compliance documents collected and saved in data/compliance-docs/ 

- Documents include: DPIIT guide, GST rules, MCA requirements, Startup India, MSME, PF/ESI, domain-specific licenses 

- lib/rag/ingest.js built — reads files, chunks with overlap, calls HuggingFace for embeddings 

- Embeddings stored in Supabase embeddings table with metadata 

- lib/rag/retrieve.js built — embeds query, runs similarity search, returns top-5 chunks 

- POST /api/ingest route created — can be triggered to re-ingest documents 

- Test: query returns relevant chunks with correct content 

## **Milestone 5 — Founder Onboarding** 

- Multi-step form with step indicator (Step 1 of 4) 

- Step 1: Business type selector (Pvt Ltd, LLP, OPC, Sole Proprietor, Section 8) 

- Step 2: Domain selector with 15+ options 

- Step 3: State selector for all Indian states 

- Step 4: Team size, funding stage, annual revenue range 

- Form state preserved across steps — no data lost on back navigation 

- Profile saved to users table in Supabase on completion 

- Redirect to dashboard after onboarding with success message 

## **Milestone 6 — Compliance Checklist** 

- POST /api/compliance/generate builds query from profile, retrieves chunks, calls Groq 

- Groq returns structured JSON: array of compliance items with all required fields 

- Checklist saved to user_compliance table with initial status Not Started 

- Each card shows: name, category, why needed, how to apply, deadline, penalty 

- Status toggle: Not Started, In Progress, Done — updates saved to Supabase 

- Filter bar: All, Mandatory, Optional, Overdue, Completed 

- Progress indicator: X of Y items completed 

## **Milestone 7 — AI Assistant** 

- Chat UI with message history, input box, send button 

- POST /api/rag/query — embed question, retrieve chunks, call Groq, return answer 

- System prompt instructs LLM to answer only from provided context 

- Answer includes which regulation or document it is sourced from 

- I don't have enough information response when context is insufficient 

- Example questions shown on empty state to guide founders 

- Chat history stored in React state for the session 

## **Milestone 8 — Deadline Calendar & Alerts** 

- Deadlines table populated for all standard compliance items 

- Calendar view showing monthly filing deadlines 

- Color coding: Red overdue, Yellow due within 7 days, Green upcoming 

- Dashboard widget showing count of filings due this month 

- Resend email integration — transactional alert emails 

- Supabase Edge Function (check-deadlines) runs on daily cron schedule 

- Alerts sent at: 7 days before, 1 day before, day of deadline 

- • Notification record saved to notifications table on each send 

## **Milestone 9 — Document Vault** 

- Supabase Storage bucket created with access policies 

- Drag-and-drop upload UI with file type validation 

- Documents tagged on upload: certificate type, issue date, expiry date 

- Grid view of all uploaded documents with preview and download 

- Expiry alert: email sent 30 days before any document expires 

- Share vault: generate shareable link for CA or co-founder access 

## **Milestone 10 — Dashboard & Polish** 

- Compliance score widget: percentage of mandatory items completed 

- Upcoming deadlines widget: next 5 filings with days remaining 

- Quick action buttons: Upload Document, Ask AI, View Checklist 

- Mobile responsive design using Tailwind CSS breakpoints 

- Loading skeletons on all data-fetching components 

- Toast notifications for all user actions (saved, uploaded, marked done) 

- Error boundaries and graceful error states on all pages 

- Empty states for new users with onboarding prompts 

## **Milestone 11 — Deploy & Launch** 

- GitHub repository created and all code pushed 

- Vercel account connected to GitHub repository 

- All environment variables configured in Vercel dashboard 

- Production Supabase project configured with production data 

- All user flows tested end-to-end on production URL 

- LinkedIn launch post published with live demo link 

## **10. Project Timeline** 

|**Phase**|**Milestones**|**Days**|**Focus Area**|
|---|---|---|---|
|**Phase 1 —**<br>**Foundation**|M1, M2, M3|Day 1-4|Setup, Auth, Database|
|**Phase 2 — RAG Core**|M4, M5, M6|Day 5-13|RAG Pipeline, Onboarding,<br>Checklist|
|**Phase 3 — Smart**<br>**Features**|M7, M8|Day 14-19|AI Assistant, Alerts|
|**Phase 4 — Polish &**<br>**Launch**|M9, M10, M11|Day 20-25|Vault, Dashboard, Deploy|



## **11. Business Potential** 

FounderPrep addresses a real, large, and currently underserved market in India. 

|**Metric**|**Data Point**|
|---|---|
|**New startups registered in India per**<br>**year**|Over 1,00,000|
|**Startups with first-time founders (no**<br>**prior legal knowledge)**|Estimated 70-80%|
|**Average money spent on compliance**<br>**consultants in Year 1**|Rs. 30,000 - Rs. 1,00,000|
|**Existing AI-powered compliance tools**<br>**for Indian startups**|None at this scale|
|**Government push for startup**<br>**ecosystem (DPIIT, Startup India)**|Active and growing|



## **Revenue Model** 

- Free Tier: Compliance checklist generation, basic deadline reminders, document vault (limited storage) 

- Pro Tier (Rs. 499/month): AI Assistant unlimited queries, full document vault, expert connect access 

- Expert Connect: 10-20% commission on every CA or lawyer booking made through the platform 

- White Label: Sell to incubators, accelerators, and co-working spaces as a startup support tool 

## **Why This Stands Out in a Portfolio** 

- Solves a real Indian market problem — not a generic todo app or weather app 

- Demonstrates end-to-end RAG system built from scratch — rare for a student portfolio 

- Full-stack production deployment with Next.js, Supabase, Groq, and HuggingFace 

- LinkedIn-worthy launch — targets startup founders who are active on the platform 

- Can be pitched as a real product at hackathons, to incubators, or to angel investors 

## **12. What You Will Learn Building This** 

|**Skill Area**|**What You Learn**|
|---|---|
|**RAG System**|Chunking, embedding, vector search, prompt augmentation — end to<br>end from scratch|
|**Next.js 14**|App Router, server components, API routes, middleware, SSR vs CSR|
|**Supabase**|PostgreSQL, pgvector, Auth, Storage, Edge Functions, RLS policies|
|**Groq API**|LLM API calls, prompt engineering, structured JSON output, system<br>prompts|
|**HuggingFace**|Inference API, embedding models, semantic similarity|
|**Product Thinking**|Solving a real problem, user flows, feature prioritization|
|**Deployment**|Vercel deployment, environment management, production debugging|
|**Email Automation**|Transactional emails, cron-based triggers, notification systems|



## **13. Risks & Mitigations** 

|**Risk**|**Impact**|**Mitigation**|**Priority**|
|---|---|---|---|
|**Groq free tier rate**<br>**limits**|API calls<br>blocked during<br>high usage|Cache responses, implement<br>request queuing|Medium|
|**Compliance data**<br>**going stale**|Wrong<br>information<br>given to<br>founders|Version compliance docs, add last-<br>updated date to all content|High|
|**HuggingFace API**<br>**downtime**|Embeddings fail,<br>RAG breaks|Cache embeddings after first<br>ingestion, fallback to local model|Low|
|**Supabase**<br>**pgvector**<br>**performance**|Slow search at<br>scale|Add IVFFlat index on embeddings<br>column|Low|
|**Legal accuracy**<br>**liability**|Platform gives<br>wrong<br>compliance<br>advice|Add disclaimer — FounderPrep is a<br>guide, not a legal advisor|High|



## **14. Future Roadmap** 

## **Version 2.0** 

- Funding Readiness Module: Tell founders what investors check before writing a cheque 

- Investor Data Room: Organize and share documents with investors in one click 

- Multi-language support: Hindi, Tamil, Telugu for regional founders 

- WhatsApp alerts: Deadline reminders via WhatsApp Business API 

## **Version 3.0** 

- Direct government portal integration: Auto-fill applications on MCA21, GST portal 

- CA marketplace expansion: 1000+ verified professionals across India 

- Compliance API: Other platforms can use FounderPrep's compliance intelligence as a service 

- Mobile app: React Native app for on-the-go compliance tracking 

## **Summary** 

FounderPrep is not just a learning project — it is a real product solving a real problem that affects every startup founder in India. By building it, you will master RAG architecture, production-grade Next.js and Supabase development, LLM integration, and full-stack deployment — all in one complete, demo-ready project. 

The platform is designed to grow from a student portfolio project into a fundable product. Every feature is built on a scalable, swap-friendly tech stack that can handle real users from day one of launch. 

## _**FounderPrep — Built by a founder, for every founder.**_ 

Next.js  •  Supabase  •  Groq  •  HuggingFace  •  RAG 

