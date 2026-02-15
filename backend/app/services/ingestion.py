import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv


load_dotenv()


DATA_FOLDER = "data/policies"
VECTOR_STORE_PATH = "data/vector_store"

def ingest_docs():
    """
    Reads PDFs from data/policies, chunks them, 
    and saves them to ChromaDB.
    """
    
    if not os.getenv("GOOGLE_API_KEY"):
        print("❌ Error: GOOGLE_API_KEY is missing in .env")
        return

    print("📄 Loading Policies...")
    documents = []
    
    
    for file in os.listdir(DATA_FOLDER):
        if file.endswith(".pdf"):
            pdf_path = os.path.join(DATA_FOLDER, file)
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            documents.extend(docs)
            print(f"   - Loaded: {file}")

    if not documents:
        print("⚠️ No PDFs found in backend/data/policies/")
        return

   
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    print(f"✂️ Split into {len(chunks)} chunks.")

    print("🧠 Creating Embeddings (This uses your Google API)...")
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    
    vector_db = Chroma.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        persist_directory=VECTOR_STORE_PATH
    )
    vector_db.persist()
    print("✅ Ingestion Complete! Knowledge Base Updated.")

if __name__ == "__main__":
    ingest_docs()