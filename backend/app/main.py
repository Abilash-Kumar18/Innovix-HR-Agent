from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi import File, UploadFile, HTTPException
import shutil
import os
from bson import ObjectId
from pinecone import Pinecone
# LangChain & Pinecone Imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, SparseValues, Vector

# Ensure your data folder exists
os.makedirs("data/policies", exist_ok=True)
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
# Root Endpoint
# ==========================================
@app.get("/")
def read_root():
    return {"status": "Active", "message": "Innvoix Backend is Connected to MongoDB 🚀"}

# ==========================================
# 🔒 PUT ENDPOINTS (Approvals & Removals)
# ==========================================

@app.put("/api/approvals/{trx_id}")
async def handle_approval(trx_id: str, action: ApprovalAction):
    """Handles sensitive transactions like Salary Hikes."""
    print(f"🛡️ HR Action: Marking {trx_id} as {action.status}")
    
    if action.status == "APPROVED":
        # 1. Remove it from the pending queue permanently
        result = await db.pending_approvals.delete_one({"trx_id": trx_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found.")
            
        return {"status": "success", "message": f"Transaction {trx_id} approved and removed from queue."}
    else:
        # If rejected, just update the status so HR has a record of the rejection
        await db.pending_approvals.update_one({"trx_id": trx_id}, {"$set": {"status": "REJECTED"}})
        return {"status": "success", "message": f"Transaction {trx_id} rejected."}


@app.put("/api/leaves/{req_id}")
async def handle_leave_approval(req_id: str, action: ApprovalAction):
    """New Endpoint: Handles Leave Requests."""
    print(f"🛡️ HR Action: Marking Leave {req_id} as {action.status}")
    
    if action.status == "APPROVED":
        # 1. Remove it from the leave requests queue permanently
        result = await db.leave_requests.delete_one({"req_id": req_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Leave request not found.")
            
        return {"status": "success", "message": f"Leave {req_id} approved and cleared from dashboard."}
    else:
        # Hackathon Tip: If HR rejects a leave, you would normally run an update_one() 
        # on the employees collection here to refund their leave balance!
        await db.leave_requests.update_one({"req_id": req_id}, {"$set": {"status": "REJECTED"}})
        return {"status": "success", "message": f"Leave {req_id} rejected."}

# ==========================================
# 📄 POLICY DOCUMENT MANAGEMENT (Pinecone Cloud)
# ==========================================

@app.post("/api/policies/upload")
async def upload_new_policy(file: UploadFile = File(...)):
    """Receives a PDF, saves it locally, and embeds it into Pinecone."""
    print(f"📥 Received new policy document: {file.filename}")
    
    file_path = f"data/policies/{file.filename}"
    
    # 1. Save the file locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 2. Add to Pinecone Vector Database
        print("📄 Loading and splitting document...")
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(docs)
        
        print(f"🧠 Embedding {len(chunks)} chunks into Pinecone Cloud...")
        embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
        index_name = os.getenv("PINECONE_INDEX_NAME")
        
        PineconeVectorStore.from_documents(
            documents=chunks,
            embedding=embeddings,
            index_name=index_name
        )
        
        # 3. Log the active policy in MongoDB so the UI can list it
        await db.active_policies.insert_one({
            "filename": file.filename,
            "status": "Active Vectorized"
        })
        
        return {"status": "success", "message": f"Policy '{file.filename}' successfully uploaded to Pinecone!"}

    except Exception as e:
        print(f"❌ Error vectorizing document: {str(e)}")
        # If it fails, remove the broken file
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")


@app.get("/api/policies/active")
async def get_active_policies():
    """Returns a list of all active PDF policies for the HR dashboard."""
    cursor = db.active_policies.find()
    docs = await cursor.to_list(length=100)
    return {"status": "success", "data": [format_mongo_doc(doc) for doc in docs]}


@app.delete("/api/policies/{policy_id}")
async def delete_policy(policy_id: str):
    """Removes a policy from MongoDB, local disk, and Pinecone."""
    print(f"🗑️ Deleting policy record: {policy_id}")
    
    # 1. Find the document in MongoDB to get the filename
    policy_doc = await db.active_policies.find_one({"_id": ObjectId(policy_id)})
    if not policy_doc:
         raise HTTPException(status_code=404, detail="Policy not found in database.")
         
    filename = policy_doc["filename"]
    file_path = f"data/policies/{filename}"

    # 2. Delete from MongoDB
    await db.active_policies.delete_one({"_id": ObjectId(policy_id)})
    
    # 3. Delete from Local Disk
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"Removed physical file: {file_path}")

    # 4. Delete from Pinecone Cloud via Metadata Filtering!
    try:
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))
        
        # This tells Pinecone to instantly wipe any data that came from this PDF
        index.delete(filter={"source": file_path})
        print(f"☁️ Purged all chunks for {filename} from Pinecone.")
            
    except Exception as e:
        print(f"⚠️ Warning: Could not purge from Pinecone: {str(e)}")

    return {"status": "success", "message": f"Policy '{filename}' successfully deleted from the AI Knowledge Base."}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)