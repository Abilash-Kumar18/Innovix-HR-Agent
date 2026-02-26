import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# 1. Load the secrets from .env
load_dotenv()

# 2. Fetch the URI
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "hr_agent_db")

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def get_database():
    """
    Initializes the MongoDB connection. 
    This is called once when the server starts.
    """
    if db.client is None:
        if not MONGO_URI:
            print("❌ ERROR: MONGO_URI is missing in .env file.")
            return None
        
        print("🔌 Connecting to MongoDB Atlas...")
        try:
            # Create the async client
            db.client = AsyncIOMotorClient(MONGO_URI)
            
            # Ping the server to verify connection
            await db.client.admin.command('ping')
            print("✅ Successfully connected to MongoDB Atlas!")
            
        except Exception as e:
            print(f"❌ Connection Failed: {e}")
            raise e

    return db.client[DB_NAME]

async def close_mongo_connection():
    """Closes the connection when server stops."""
    if db.client:
        db.client.close()
        print("🔌 MongoDB connection closed.")