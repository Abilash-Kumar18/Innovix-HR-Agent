
```markdown
# 🚀 Innvoix HR Agentic AI

**Built for TN Impact Hackathon (Problem Statement: TNI26075)**

An intelligent, autonomous "Agentic AI" platform designed to eliminate repetitive HR administrative tasks. Innvoix goes beyond simple chatbots by acting as an orchestration layer—it understands complex HR policies, converses with employees naturally, makes compliance decisions, and autonomously triggers cross-system workflows (HRIS, IT ticketing, LMS, and Payroll) within strict, Role-Based Guardrails.

---

## ✨ Core Capabilities

* **🧠 Agentic Workflow Orchestration:** The AI uses a LangGraph tool-calling architecture to autonomously execute multi-step workflows. (e.g., Onboarding automatically creates an HRIS record, triggers a background check, assigns LMS modules, schedules orientation, and emails IT).
* **📚 RAG-Powered Policy Engine:** Uses Google's `gemini-embedding-001` and Pinecone Vector DB to ingest company PDFs. The AI is mathematically forced to cross-reference official policy documents before approving or denying employee requests.
* **🔐 Role-Based Access Control (RBAC):** Strict Python-level security. Standard employees can only access self-service tools, while HR Admins unlock powerful tools like mass-email policy drafting, onboarding, and offboarding.
* **🛡️ Human-in-the-Loop Guardrails:** Sensitive actions (like salary modifications or terminations) cannot be executed autonomously. The AI drafts the transaction and locks it in a MongoDB queue for human HR approval.
* **🔄 State-Aware Conversations:** The AI tracks user state in real-time. If a new hire logs in with a "Pending" status, the AI shifts into an onboarding guide, refusing other requests until it collects necessary compliance data (Bank Account, Emergency Contact, ID Uploads).

---

## 🏗️ Architecture Stack

* **Backend Framework:** FastAPI (Python)
* **AI & LLM:** Google Gemini 2.5 Flash, Google Generative AI Embeddings
* **Agentic Framework:** LangChain & LangGraph
* **Primary Database:** MongoDB (Motor Asyncio) 
* **Vector Database:** Pinecone (3072-dimension indexing)
* **External Integrations:** Google Calendar API (Holiday/Leave tracking), SMTP (Real-world automated emails)
* **Frontend UI:** React.js, Tailwind CSS

---

## 🛠️ Step-by-Step Installation Guide

### 1. Clone the Repository
```bash
git clone [https://github.com/YourUsername/Innvoix-HR-Agent.git](https://github.com/YourUsername/Innvoix-HR-Agent.git)
cd Innvoix-HR-Agent/backend

```

### 2. Set Up the Python Virtual Environment

```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt

```

### 3. Environment Variables (`.env`)

Create a `.env` file in the `backend` directory and add the following keys. **Do not commit this file to GitHub.**

```ini
# MongoDB Connection
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/

# Google Gemini API Keys (Supports rotating keys for rate limits)
GEMINI_KEY_1=your_google_ai_studio_key

# Pinecone Vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name # Must be configured for 3072 dimensions

# Automated Email Engine (Gmail App Password)
SENDER_EMAIL=your_hr_bot_email@gmail.com
SENDER_PASSWORD=your_16_digit_app_password

# Google Calendar Integration
GOOGLE_CALENDAR_ID=your_company_calendar_id@group.calendar.google.com

```

### 4. Google Credentials

Place your `google_credentials.json` (Service Account Key) inside the `backend/data/` folder to enable Google Calendar live-fetching.

### 5. Start the Backend Server

```bash
python main.py

```

*The API will be live at `http://localhost:8000`. You can view the interactive Swagger documentation at `http://localhost:8000/docs`.*

---

## 💡 Key Workflows & Demo Prompts

### 1. State-Aware Onboarding (The "New Hire" Flow)

The system tracks employee onboarding status.

* **HR Action:** HR Admin uses the AI to generate an invite: *"Invite Kamalesh to the portal. Email is kamalesh@gmail.com, password is 1234."*
* **Employee Action:** Kamalesh logs in. The AI recognizes his `Pending` status and intercepts the chat, politely demanding his Bank Account, Phone, Address, and Emergency Contact.
* **Orchestration:** Once provided, the AI marks him as `Completed`, updates the HRIS, grants his leave balance, and alerts HR via email.

### 2. RAG-Enforced Leave Compliance

The AI does not blindly approve leaves; it reads the rules and checks the calendar.

* **Prompt:** *"I want to apply for 2 days of casual leave next week for a family trip."*
* **Execution:** 1. Checks Google Calendar for overlapping holidays.
2. Searches Pinecone Vector DB for the exact Leave Policy rules.
3. Deducts the balance in MongoDB.
4. Generates an HR Approval Ticket with a precise policy citation.
5. Sends a real SMTP email to the HR manager.

### 3. Automated Change Management

Drafting policies and instantly propagating them to the affected teams.

* **Prompt (HR Only):** *"Draft a new policy update titled '2026 Code Review Protocol'. The new rule is that all engineers require two approvals. Please notify the Technical department."*
* **Execution:** Saves the draft to MongoDB and queries the database to physically email every user in the "Technical" department with the new guidelines.

---

## ☁️ Deployment Notes (Render)

This application is designed to be fully cloud-resilient. Because PaaS providers like Render utilize Ephemeral File Systems (wiping local files on restart), our architecture utilizes **Base64 Encoding** to store uploaded PDF Policy documents directly inside MongoDB. This guarantees that the source-of-truth HR documents and their vector embeddings survive all server restarts.

---

*Built with ❤️ by the Innvoix Team for TN Impact 2026.*

```

***

This README tells a complete, compelling story about *why* your software is impressive, not just what it does. 

Since your backend is locked and loaded, what is the game plan for the React frontend? Do you need the Axios integration code to connect the React Chat UI to your `/chat` endpoint, or the file upload component for the HR dashboard?

```
