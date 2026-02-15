from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import your agent and the active MongoDB connection!
from app.agents.employee_agent import get_agent_response
from app.tools.hr_tools import db 

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

# 3. Define the Data Formats
class ChatRequest(BaseModel):
    message: str
    employee_id: str = "emp_001" 

class ApprovalAction(BaseModel):
    status: str  # Frontend will send "APPROVED" or "REJECTED"

# --- HELPER FUNCTION ---
# MongoDB uses a special 'ObjectId'. FastAPI needs this converted to a string.
def format_mongo_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc


# ==========================================
# 🤖 AGENTIC CHAT ENDPOINT
# ==========================================
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"📩 Chat Received from {request.employee_id}: {request.message}")
        response = await get_agent_response(request.message, employee_id=request.employee_id)
        print(f"📤 Agent Reply: {response}")
        return {"response": response}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 📊 GET ENDPOINTS (For React Dashboard Data)
# ==========================================
@app.get("/api/employees")
async def get_all_employees():
    """Returns the list of all employees directly from MongoDB."""
    cursor = db.employees.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

@app.get("/api/tickets")
async def get_all_tickets():
    """Returns all open IT/HR tickets."""
    cursor = db.hr_tickets.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

@app.get("/api/leaves")
async def get_leave_requests():
    """Returns all pending leave requests."""
    cursor = db.leave_requests.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

@app.get("/api/approvals")
async def get_pending_approvals():
    """Returns sensitive transactions waiting for Human-in-the-Loop approval."""
    cursor = db.pending_approvals.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

@app.get("/api/policies/drafts")
async def get_policy_drafts():
    """Returns newly drafted policies by the AI."""
    cursor = db.policy_drafts.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}


# ==========================================
# 🔒 PUT ENDPOINTS (Human-in-the-Loop Actions)
# ==========================================
@app.put("/api/approvals/{trx_id}")
async def handle_approval(trx_id: str, action: ApprovalAction):
    """
    When HR clicks 'Approve' or 'Reject' on the frontend, this updates the database.
    """
    print(f"🛡️ HR Action: Marking {trx_id} as {action.status}")
    
    result = await db.pending_approvals.update_one(
        {"trx_id": trx_id},
        {"$set": {"status": action.status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found or already updated.")
        
    return {"status": "success", "message": f"Transaction {trx_id} successfully marked as {action.status}"}


# ==========================================
# Root Endpoint
# ==========================================
@app.get("/")
def read_root():
    return {"status": "Active", "message": "Innvoix Backend is Connected to MongoDB 🚀"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)