import os
import certifi 
import shutil
import datetime
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId
import uvicorn

# --- LangChain & Pinecone Imports ---
from pinecone import Pinecone
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
import base64
from fastapi.responses import Response

# --- Agent Imports ---
from app.agents.employee_agent import get_agent_response

# Ensure policy data folder exists
os.makedirs("data/policies", exist_ok=True)

# ==========================================
# 1. DATABASE CONNECTION (Robust SSL Setup)
# ==========================================
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
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
# 2. APP SETUP & CORS
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
# 3. PYDANTIC MODELS (Merged)
# ==========================================
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class ChatRequest(BaseModel):
    message: str
    employee_id: str = "emp_001"

class ApprovalAction(BaseModel):
    status: str  # Frontend will send "APPROVED" or "REJECTED"

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

# --- HELPER FUNCTION ---
def format_mongo_doc(doc):
    """Converts MongoDB ObjectId to a string for JSON serialization."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ==========================================
# Root Endpoint
# ==========================================
@app.get("/")
def read_root():
    return {"status": "Active", "message": "Innvoix Backend is Connected and Running! 🚀"}

# ==========================================
# 4. AUTH & USER ENDPOINTS
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
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid User ID format")

@app.get("/api/employees")
async def get_all_employees():
    """Updated by Dharani: Returns only standard employees."""
    try:
        docs = await db["users"].find({"role": "employee"}).to_list(100)
        return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}
    except Exception:
        return {"status": "error", "data": []}

# ==========================================
# 5. AGENTIC CHAT ENDPOINT
# ==========================================
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"📩 Chat Received from {request.employee_id}: {request.message}")
        response = await get_agent_response(request.message, employee_id=request.employee_id)
        print(f"📤 Agent Reply: {response}")
        return {"response": response}
    except Exception as e:
        print(f"❌ Agent Error: {e}")
        # Dharani's fix: Returns a string to the frontend instead of crashing
        return {"response": f"Sorry, my AI brain encountered an error: {str(e)}"}

# ==========================================
# 6. TICKETS ENDPOINTS (Dharani's Updates)
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
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

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
# 7. HR DASHBOARD GET ENDPOINTS (Devaroopa's Data)
# ==========================================
@app.get("/api/leaves")
async def get_leave_requests():
    cursor = db.leave_requests.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

@app.get("/api/approvals")
async def get_pending_approvals():
    cursor = db.pending_approvals.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

@app.get("/api/policies/drafts")
async def get_policy_drafts():
    cursor = db.policy_drafts.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

# ==========================================
# 8. HR DASHBOARD PUT ENDPOINTS (Approvals)
# ==========================================
@app.put("/api/approvals/{trx_id}")
async def handle_approval(trx_id: str, action: ApprovalAction):
    print(f"🛡️ HR Action: Marking {trx_id} as {action.status}")
    if action.status == "APPROVED":
        result = await db.pending_approvals.delete_one({"trx_id": trx_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found.")
        return {"status": "success", "message": f"Transaction {trx_id} approved and removed from queue."}
    else:
        await db.pending_approvals.update_one({"trx_id": trx_id}, {"$set": {"status": "REJECTED"}})
        return {"status": "success", "message": f"Transaction {trx_id} rejected."}

@app.put("/api/leaves/{req_id}")
async def handle_leave_approval(req_id: str, action: ApprovalAction):
    print(f"🛡️ HR Action: Marking Leave {req_id} as {action.status}")
    if action.status == "APPROVED":
        result = await db.leave_requests.delete_one({"req_id": req_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Leave request not found.")
        return {"status": "success", "message": f"Leave {req_id} approved and cleared from dashboard."}
    else:
        await db.leave_requests.update_one({"req_id": req_id}, {"$set": {"status": "REJECTED"}})
        return {"status": "success", "message": f"Leave {req_id} rejected."}

# ==========================================
# 9. POLICY DOCUMENT MANAGEMENT (Pinecone)
# ==========================================
@app.post("/api/policies/upload")
async def upload_new_policy(file: UploadFile = File(...)):
    print(f"📥 Received new policy document: {file.filename}")
    file_path = f"data/policies/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        print("📄 Loading and splitting document...")
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(docs)
        
        print(f"🧠 Embedding {len(chunks)} chunks into Pinecone Cloud...")
        # Force it to use your specific key variable and correct model name
        google_key = os.getenv("GEMINI_KEY_1") or os.getenv("GOOGLE_API_KEY")
        embeddings = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-001",
            google_api_key=google_key
        )
        index_name = os.getenv("PINECONE_INDEX_NAME")
        
        PineconeVectorStore.from_documents(
            documents=chunks,
            embedding=embeddings,
            index_name=index_name
        )
        
        # --- NEW CODE: Convert PDF to Base64 to store in MongoDB ---
        with open(file_path, "rb") as pdf_file:
            encoded_string = base64.b64encode(pdf_file.read()).decode('utf-8')
            
        await db.active_policies.insert_one({
            "filename": file.filename,
            "status": "Active Vectorized",
            "file_data": encoded_string  # <-- The physical file is now in the DB!
        })
        
        return {"status": "success", "message": f"Policy '{file.filename}' successfully uploaded to Pinecone!"}

    except Exception as e:
        print(f"❌ Error vectorizing document: {str(e)}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.get("/api/policies/active")
async def get_active_policies():
    cursor = db.active_policies.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}

@app.delete("/api/policies/{policy_id}")
async def delete_policy(policy_id: str):
    print(f"🗑️ Deleting policy record: {policy_id}")
    
    policy_doc = await db.active_policies.find_one({"_id": ObjectId(policy_id)})
    if not policy_doc:
         raise HTTPException(status_code=404, detail="Policy not found in database.")
         
    filename = policy_doc["filename"]
    file_path = f"data/policies/{filename}"

    await db.active_policies.delete_one({"_id": ObjectId(policy_id)})
    
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"Removed physical file: {file_path}")

    try:
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))
        index.delete(filter={"source": file_path})
        print(f"☁️ Purged all chunks for {filename} from Pinecone.")
    except Exception as e:
        print(f"⚠️ Warning: Could not purge from Pinecone: {str(e)}")

    return {"status": "success", "message": f"Policy '{filename}' successfully deleted from the AI Knowledge Base."}

# ==========================================
# 10. POLICY PDF DOWNLOAD ENDPOINT
# ==========================================
@app.get("/api/policies/download/{policy_id}")
async def download_policy(policy_id: str):
    """Fetches the Base64 PDF string from MongoDB and serves it as a downloadable file."""
    print(f"📥 Fetching PDF download for policy: {policy_id}")
    
    policy_doc = await db.active_policies.find_one({"_id": ObjectId(policy_id)})
    
    if not policy_doc or "file_data" not in policy_doc:
         raise HTTPException(status_code=404, detail="PDF data not found in database.")
         
    # Decode the Base64 string back into raw PDF bytes
    pdf_bytes = base64.b64decode(policy_doc["file_data"])
    
    # Serve it to the frontend as a real file!
    return Response(
        content=pdf_bytes, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={policy_doc['filename']}"}
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)