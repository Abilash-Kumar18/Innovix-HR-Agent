from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app.agents.employee_agent import get_agent_response
import uvicorn
import os

# 1. Initialize the App
app = FastAPI(title="Innvoix HR Agent API")

# 2. Add CORS (Allows Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the Data Format
class ChatRequest(BaseModel):
    message: str

# 4. Define the Chat Endpoint
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"📩 Received: {request.message}")
        
        # Call the Agent
        response = get_agent_response(request.message)
        
        print(f"📤 Sending: {response}")
        return {"response": response}
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 5. Root Endpoint (Just to check if server is running)
@app.get("/")
def read_root():
    return {"status": "Active", "message": "Innvoix HR Agent is Ready 🤖"}

# Run Server (Only if run directly)
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)