import os
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

VECTOR_STORE_PATH = "data/vector_store"

def get_vector_store():
    """Re-opens the existing Vector Database."""
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    
    # We load the DB we just created
    vector_db = Chroma(
        persist_directory=VECTOR_STORE_PATH, 
        embedding_function=embeddings
    )
    return vector_db

def search_policy(query: str):
    """
    Searches the HR Policy for the given query.
    Returns the top 3 most relevant paragraphs.
    """
    try:
        print(f"🔎 Searching Policy for: '{query}'")
        db = get_vector_store()
        
        # Perform Similarity Search
        # k=3 means "Give me the top 3 best matches"
        docs = db.similarity_search(query, k=3)
        
        if not docs:
            return "No relevant policy found."
            
        # Combine the content of the 3 docs into one string
        context = "\n\n".join([doc.page_content for doc in docs])
        return context

    except Exception as e:
        return f"Error searching policy: {str(e)}"

# Simple test to see if it works
if __name__ == "__main__":
    result = search_policy("How many casual leaves do I get?")
    print("\n--- RESULT ---\n")
    print(result)