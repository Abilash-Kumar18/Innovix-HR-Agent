import os
import certifi 
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId
import uvicorn

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
        # Search for user matching email AND password
        user_record = await db["users"].find_one({
            "email": request.email, 
            "password": request.password
        })
    except Exception as e:
        print(f"❌ DB Login Error: {e}")
        raise HTTPException(status_code=500, detail="Database Connection Failed")
    
    if not user_record:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Strictly check if the user belongs to the portal they are trying to access
    if user_record.get("role") != request.role:
         raise HTTPException(status_code=403, detail=f"Access Denied: You are registered as '{user_record.get('role')}', not '{request.role}'")

    return {
        "message": "Login successful",
        "user_id": str(user_record["_id"]),
        "name": user_record.get("name"),
        "role": user_record.get("role")
    }

# ==========================================
# 5. DATA ENDPOINTS
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)