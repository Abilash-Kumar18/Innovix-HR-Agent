import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import Tool
from langchain_core.messages import SystemMessage
from langchain.agents import create_agent
import asyncio
from app.tools.search_tools import search_policy

# --- UPDATED IMPORTS ---
from app.tools.hr_tools import db,draft_policy_update, get_employee_details, apply_for_leave, get_upcoming_holidays, onboard_employee, prepare_sensitive_transaction, raise_hr_ticket, list_employees, offboard_employee

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
        raise_hr_ticket, onboard_employee, prepare_sensitive_transaction, draft_policy_update, list_employees, offboard_employee
    ]
    
    return create_agent(llm, tools)

def clean_response(response_content):
    if isinstance(response_content, list):
        return "".join([block.get("text", "") for block in response_content if "text" in block])
    return str(response_content)
chat_memory = []
async def get_agent_response(user_message: str, employee_id: str = "emp_001"):
    # 1. THE FIX: This must be the very first line inside the function!
    global current_key_idx, chat_message
    
    # 2. THEN do your Identity & Access Lookup
    user_record = await db.employees.find_one({"employee_id": employee_id.lower()})
    
    if user_record:
        user_name = user_record.get("name", "Unknown")
        user_department = user_record.get("department", "Employee")
        
        # Define the security clearance
        is_hr_admin = user_department.lower() == "hr" or user_department.lower() == "human resources"
        role_title = "HR Administrator" if is_hr_admin else f"{user_department} Employee"
    else:
        user_name = "Guest"
        role_title = "Unverified User"
        is_hr_admin = False

    # --- 2. THE DYNAMIC SECURITY PROMPT ---
    # --- 2. THE DYNAMIC SECURITY PROMPT ---
    # --- 2. THE DYNAMIC SECURITY PROMPT ---
    system_instruction = (
        f"You are the Innvoix HR Agentic AI. "
        f"Chatting with {user_name} (ID: {employee_id}). Role: {role_title}. "
        f"Their official role/department is: {role_title}. "
        "\n\n--- SECURITY & ACCESS CONTROL RULES ---\n"
        "1. Standard Employees can ONLY ask about policies, check their own leave balance, apply for leave, and raise tickets.\n"
        "2. ONLY HR Administrators have the security clearance to use these tools: 'onboard_employee', 'offboard_employee', "
        "'prepare_sensitive_transaction', 'draft_policy_update', 'add_company_holiday', and 'list_employees'.\n"
        "3. If a Standard Employee asks you to perform an HR-only action, you MUST completely refuse, "
        "address them by name, and tell them they do not have the required security clearance.\n"
        "\n--- WORKFLOW ORCHESTRATION RULES ---\n"
        "4. ONBOARDING: If an HR Admin asks to onboard someone, you MUST NOT call the tool immediately. "
        "You must first converse with them to collect the new hire's Bank Account Number and Emergency Contact Number. "
        "Only call the onboard tool once you have all the data.\n"
        "5. OFFBOARDING: When offboarding, ensure you ask for the specific offboard date if it wasn't provided.\n"
        "\n--- DATA PRIVACY & ESCALATION RULES ---\n"
        "6. DATA MASKING: If you retrieve an employee's personal details (like Bank Account) from the database, "
        "you MUST dynamically mask the data in your final response (e.g., output *****6789).\n"
        "7. TICKET ESCALATION: When an employee asks to speak to HR or raises a complex issue, "
        "you must analyze the chat history and use the 'raise_hr_ticket' tool. Pass a detailed, bulleted summary "
        "of their exact problem into the 'issue_summary' parameter so human HR staff can respond quickly."
    )
    session_record = await db.chat_sessions.find_one({"employee_id": employee_id})
    
    if session_record:
        # Extract the history array from the database
        db_history = session_record.get("history", [])
        # Convert it to the tuple format LangGraph expects: [("user", "hi"), ("assistant", "hello")]
        formatted_memory = [(msg["role"], msg["content"]) for msg in db_history]
    else:
        db_history = []
        formatted_memory = []

    # Add the current message to the execution payload
    formatted_memory.append(("user", user_message))
    messages = [SystemMessage(content=system_instruction)] + formatted_memory

    # --- 5. EXECUTION & DATABASE SAVING ---
    for attempt in range(len(VALID_KEYS)):
        try:
            agent_executor = get_agent_executor(safe_tools) 
            response = await agent_executor.ainvoke({"messages": messages})
            ai_reply = response["messages"][-1].content
            clean_reply = clean_response(ai_reply)
            
            # 💾 THE PERSISTENCE UPGRADE: Save the new exchange back to MongoDB!
            db_history.append({"role": "user", "content": user_message})
            db_history.append({"role": "assistant", "content": clean_reply})
            
            # Upsert means: Update if exists, Create if it doesn't
            await db.chat_sessions.update_one(
                {"employee_id": employee_id},
                {"$set": {"history": db_history}},
                upsert=True
            )
            
            return clean_reply

        except Exception as e:
            error_msg = str(e).lower()
            if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg:
                print(f"⚠️ API Key {current_key_idx + 1} exhausted. Rotating to next key...")
                current_key_idx = (current_key_idx + 1) % len(VALID_KEYS)
            else:
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