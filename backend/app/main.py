from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import your agent and the databases!
from app.agents.employee_agent import get_agent_response
from app.tools.hr_tools import MOCK_DB, LEAVE_REQUESTS, HR_TICKETS, PENDING_APPROVALS, POLICY_DRAFTS

# 1. Initialize the App
app = FastAPI(title="Innvoix HR Agent API")

# 2. Add CORS (Allows the Vercel Frontend to talk to the Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the Data Format for Chat
class ChatRequest(BaseModel):
    message: str
    employee_id: str = "emp_001" 

# ==========================================
# 🤖 AGENTIC CHAT ENDPOINT
# ==========================================
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"📩 Chat Received from {request.employee_id}: {request.message}")
        response = get_agent_response(request.message, employee_id=request.employee_id)
        print(f"📤 Agent Reply: {response}")
        return {"response": response}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 📊 DASHBOARD ENDPOINTS (For Dharani's UI)
# ==========================================
@app.get("/api/employees")
def get_all_employees():
    """Returns the list of all employees for the HR Dashboard."""
    return {"status": "success", "data": MOCK_DB}

@app.get("/api/tickets")
def get_all_tickets():
    """Returns all open IT/HR tickets."""
    return {"status": "success", "data": HR_TICKETS}

@app.get("/api/leaves")
def get_leave_requests():
    """Returns all pending leave requests."""
    return {"status": "success", "data": LEAVE_REQUESTS}

@app.get("/api/approvals")
def get_pending_approvals():
    """Returns sensitive transactions waiting for Human-in-the-Loop approval."""
    return {"status": "success", "data": PENDING_APPROVALS}

@app.get("/api/policies/drafts")
def get_policy_drafts():
    """Returns newly drafted policies by the AI."""
    return {"status": "success", "data": POLICY_DRAFTS}


# 5. Root Endpoint (Health Check)
@app.get("/")
def read_root():
    return {"status": "Active", "message": "Innvoix Backend is 100% Complete & Ready 🚀"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)