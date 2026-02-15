import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import Tool
from langchain_core.messages import SystemMessage
from langchain.agents import create_agent
import asyncio
from app.tools.search_tools import search_policy

# --- UPDATED IMPORTS ---
from app.tools.hr_tools import draft_policy_update, get_employee_details, apply_for_leave, get_upcoming_holidays, onboard_employee, prepare_sensitive_transaction, raise_hr_ticket, list_employees

load_dotenv()

ALL_KEYS = [
    os.getenv("GEMINI_KEY_1"),
    os.getenv("GEMINI_KEY_2"),
    os.getenv("GEMINI_KEY_3")
]
# Filter out any empty/None values just in case
VALID_KEYS = [key for key in ALL_KEYS if key]
current_key_idx = 0

def get_agent_executor():
    """Creates a fresh LangGraph agent using the currently active API key."""
    global current_key_idx
    active_key = VALID_KEYS[current_key_idx]
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=active_key, # Explicitly pass the active key
        temperature=0
    )
    
    tools = [
        Tool(name="Search_HR_Policy", func=search_policy, description="For PDF policy lookups."),
        get_employee_details, apply_for_leave, get_upcoming_holidays, 
        raise_hr_ticket, onboard_employee, prepare_sensitive_transaction, draft_policy_update, list_employees
    ]
    
    return create_agent(llm, tools)

def clean_response(response_content):
    if isinstance(response_content, list):
        return "".join([block.get("text", "") for block in response_content if "text" in block])
    return str(response_content)

async def get_agent_response(user_message: str, employee_id: str = "emp_001"):
    global current_key_idx
    
    system_instruction = (
        "You are an advanced Agentic HR Platform for team Innvoix. "
        f"The user currently chatting with you has the Employee ID: {employee_id}. "
        "Use your tools to orchestrate workflows: 'Search_HR_Policy', 'onboard_employee', "
        "'prepare_sensitive_transaction', 'draft_policy_update', 'get_employee_details', "
        "'apply_for_leave', 'get_upcoming_holidays', 'raise_hr_ticket', 'list_employees'.",
    )
    messages = [SystemMessage(content=system_instruction), ("user", user_message)]

    # --- 2. THE FALLBACK LOOP ---
    for attempt in range(len(VALID_KEYS)):
        try:
            agent_executor = get_agent_executor()
            
            # THE FIX: Use 'await' and 'ainvoke' to handle the MongoDB tools
            response = await agent_executor.ainvoke({"messages": messages})
            
            raw_content = response["messages"][-1].content
            return clean_response(raw_content)
        
        except Exception as e:
            error_msg = str(e).lower()
            # If the error is related to rate limits or quotas
            if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg:
                print(f"⚠️ API Key {current_key_idx + 1} exhausted. Rotating to next key...")
                # Move to the next key
                current_key_idx = (current_key_idx + 1) % len(VALID_KEYS)
            else:
                # If it's a different error (like a typo in your code), raise it normally
                return f"Error processing request: {str(e)}"
                
    return "❌ SYSTEM ERROR: All fallback API keys have exhausted their quotas!"

# --- INTERACTIVE TERMINAL TEST ---
async def run_interactive_chat():
    """We wrap the loop in an async function so we can use 'await'"""
    print("==================================================")
    print("🤖 Innovix HR Agentic AI is ONLINE!")
    print("Type 'exit' to quit the chat.")
    print("==================================================\n")
    
    # We will use 'emp_001' as our test user
    current_user_id = "emp_001"

    while True:
        user_text = input("You: ")
        
        if user_text.lower() in ['exit', 'quit']:
            print("Shutting down Agent...")
            break
            
        # THE FIX: We must 'await' the async function!
        answer = await get_agent_response(user_text, employee_id=current_user_id)
        
        print(f"\n🤖 Agent: {answer}\n")
        print("-" * 50)

if __name__ == "__main__":
    # THE FIX: Tell asyncio to run our async chat function
    asyncio.run(run_interactive_chat())