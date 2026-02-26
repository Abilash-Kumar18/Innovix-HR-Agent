import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# 2. Get Mongo URI
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("❌ Error: MONGO_URI is missing in .env file")

# 3. Create the Async Client
# We use AsyncIOMotorClient because FastAPI is async (avoids blocking)
client = AsyncIOMotorClient(MONGO_URI)

# 4. Define the Database Name
# This creates a database named 'innvoix_hr' in your cluster
db = client["innvoix_hr"]

print("✅ Connected to MongoDB Atlas (Async)")