from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.services.database import get_database, close_mongo_connection

# --- Lifecycle Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Logic
    print("🚀 HR Agent Server Starting...")
    await get_database()
    yield
    # Shutdown Logic
    print("🛑 HR Agent Server Stopping...")
    await close_mongo_connection()

# --- App Initialization ---
app = FastAPI(
    title="Innvoix HR Agent API",
    version="1.0",
    lifespan=lifespan
)

# --- Routes ---
@app.get("/")
async def root():
    """Simple check to see if server is alive."""
    return {"status": "Active", "system": "Innvoix Agentic Platform"}

@app.get("/health")
async def health_check():
    """
    Verifies Database Connectivity. 
    Frontend will call this to check system status.
    """
    try:
        db = await get_database()
        if db is None:
             return {"status": "Error", "detail": "Database not initialized"}

        # List collections to prove read-access
        collections = await db.list_collection_names()
        return {
            "status": "Healthy",
            "database": "Connected",
            "collections": collections
        }
    except Exception as e:
        return {"status": "Unhealthy", "error": str(e)}

# --- Run Config (For Debugging) ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)