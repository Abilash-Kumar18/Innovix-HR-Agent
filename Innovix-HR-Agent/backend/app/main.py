import os
import certifi 
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId
import uvicorn
import datetime

# ==========================================
# 1. DATABASE CONNECTION
# ==========================================
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

print(f"🔌 Connecting to MongoDB...")

try:
    client = AsyncIOMotorClient(
        MONGO_URI, 
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        socketTimeoutMS=10000
    )
    db = client["innvoix_hr"]
    print("✅ Database Connection Successful")
except Exception as e:
    print(f"❌ Critical DB Error: {e}")

# ==========================================
# 2. APP SETUP
# ==========================================
app = FastAPI(title="Innvoix HR Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 3. MODELS
# ==========================================
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class ChatRequest(BaseModel):
    message: str
    employee_id: str = "emp_001"

class TicketCreate(BaseModel):
    employee_id: str
    employee_name: str
    type: str
    startDate: str
    days: str
    reason: str
    role: str = "employee"

class TicketUpdate(BaseModel):
    status: str

def format_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ==========================================
# 4. AUTH ENDPOINT (LOGIN ONLY)
# ==========================================
@app.post("/api/auth/login")
async def login(request: LoginRequest):
    try:
        user_record = await db["users"].find_one({
            "email": request.email, 
            "password": request.password
        })
    except Exception as e:
        print(f"❌ DB Login Error: {e}")
        raise HTTPException(status_code=500, detail="Database Connection Failed")
    
    if not user_record:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user_record.get("role") != request.role:
         raise HTTPException(status_code=403, detail=f"Access Denied: You are registered as '{user_record.get('role')}', not '{request.role}'")

    return {
        "message": "Login successful",
        "user_id": str(user_record["_id"]),
        "name": user_record.get("name"),
        "role": user_record.get("role")
    }

# ==========================================
# 5. USER DATA ENDPOINTS
# ==========================================
@app.get("/api/users/{user_id}")
async def get_user_profile(user_id: str):
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "role": user.get("role"),
            "department": user.get("department", "General"),
            "email": user.get("email"),
            "casual_leaves_left": user.get("casual_leaves_left", 0),
            "sick_leaves_left": user.get("sick_leaves_left", 0)
        }
        return {"status": "success", "data": user_data}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid User ID format")

@app.get("/api/employees")
async def get_all_employees():
    try:
        docs = await db["users"].find({"role": "employee"}).to_list(100)
        return {"status": "success", "data": [format_doc(doc) for doc in docs]}
    except Exception:
        return {"status": "error", "data": []}

# ==========================================
# 6. TICKET & LEAVE ENDPOINTS
# ==========================================
@app.post("/api/tickets")
async def create_new_ticket(ticket: TicketCreate):
    new_ticket = ticket.model_dump()
    new_ticket["status"] = "Pending"
    new_ticket["date"] = datetime.datetime.now().strftime("%m/%d/%Y")
    await db["tickets"].insert_one(new_ticket)
    return {"status": "success", "message": "Ticket created"}

@app.get("/api/tickets")
async def get_all_tickets():
    docs = await db["tickets"].find().sort("date", -1).to_list(100)
    return {"status": "success", "data": [format_doc(doc) for doc in docs]}

@app.put("/api/tickets/{ticket_id}")
async def update_ticket_status(ticket_id: str, status_update: TicketUpdate):
    try:
        await db["tickets"].update_one(
            {"_id": ObjectId(ticket_id)}, 
            {"$set": {"status": status_update.status}}
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to update ticket")

# ==========================================
# 7. AI AGENT ENDPOINT (UPDATED FIX)
# ==========================================
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # We updated the import to perfectly match your employee_agent.py function
    from app.agents.employee_agent import get_agent_response 
    try:
        response = await get_agent_response(request.message, request.employee_id)
        return {"response": response}
    except Exception as e:
        print(f"Agent Error: {e}")
        # Added error string so it prints exact details on frontend if it fails
        return {"response": f"Sorry, my AI brain encountered an error: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)