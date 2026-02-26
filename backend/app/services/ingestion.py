import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv

load_dotenv()

DATA_FOLDER = "data/policies"

def ingest_docs():
    """
    Reads PDFs from data/policies, chunks them, 
    and saves them to the Pinecone Cloud Vector Database.
    """
    
    if not os.getenv("GEMINI_KEY_1") and not os.getenv("GEMINI_KEY_2") and not os.getenv("GEMINI_KEY_3"):
        print("❌ Error: GEMINI_KEY_1, GEMINI_KEY_2, or GEMINI_KEY_3 is missing in .env")
        return
        
    if not os.getenv("PINECONE_API_KEY") or not os.getenv("PINECONE_INDEX_NAME"):
        print("❌ Error: PINECONE_API_KEY or PINECONE_INDEX_NAME is missing in .env")
        return

    print("📄 Loading Policies...")
    documents = []
    
    # Ensure the folder exists to prevent crashes
    if not os.path.exists(DATA_FOLDER):
        os.makedirs(DATA_FOLDER)
        print(f"📁 Created '{DATA_FOLDER}' folder. Please place your PDFs there and run again.")
        return
    
    for file in os.listdir(DATA_FOLDER):
        if file.endswith(".pdf"):
            pdf_path = os.path.join(DATA_FOLDER, file)
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            documents.extend(docs)
            print(f"   - Loaded: {file}")

    if not documents:
        print("⚠️ No PDFs found in data/policies/")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    print(f"✂️ Split into {len(chunks)} chunks.")
    
    try:
        print(f"🧠 Embedding {len(chunks)} chunks into Pinecone...")
        embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
        index_name = os.getenv("PINECONE_INDEX_NAME")
        
        # This automatically embeds and uploads the chunks to your Pinecone cloud
        PineconeVectorStore.from_documents(
            documents=chunks,
            embedding=embeddings,
            index_name=index_name
        )
        print("✅ Ingestion Complete! Pinecone Knowledge Base Updated.")
        
    except Exception as e:
        print(f"❌ Error during Pinecone ingestion: {e}")

if __name__ == "__main__":
    ingest_docs()