import os
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

# Initialize Pinecone Client
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME")

def get_vector_store():
    """Connects to the cloud Pinecone Vector Database."""
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    
    # Connect to the existing Pinecone index
    vector_store = PineconeVectorStore(
        index_name=index_name, 
        embedding=embeddings
    )
    return vector_store

def search_policy(query: str):
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
        return f"Error searching policy: {str(e)}"