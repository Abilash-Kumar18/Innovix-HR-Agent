import os
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

# Initialize Pinecone Client
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME")

def get_vector_store():
    """Connects to the cloud Pinecone Vector Database."""
    # Explicitly map your custom variable name to the Google API Key
    google_key = os.getenv("GEMINI_KEY_1") or os.getenv("GOOGLE_API_KEY")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=google_key
    )
    
    # Connect to the existing Pinecone index
    vector_store = PineconeVectorStore(
        index_name=index_name, 
        embedding=embeddings
    )
    return vector_store

@tool
def search_policy(query: str) -> str:
    """
    Searches the HR Policy for the given query using Pinecone.
    """
    try:
        print(f"🔎 Searching Pinecone for: '{query}'")
        db = get_vector_store()
        
        # k=3 means "Give me the top 3 best matches"
        docs = db.similarity_search(query, k=3)
        
        if not docs:
            return "No relevant policy found."
            
        context = "\n\n".join([doc.page_content for doc in docs])
        return context

    except Exception as e:
        print(f"❌ PINECONE SEARCH ERROR: {str(e)}")
        return f"Error searching policy: {str(e)}"