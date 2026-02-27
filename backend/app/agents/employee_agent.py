import os
import asyncio
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from langchain.agents import create_agent
from datetime import datetime, timedelta

# --- UPDATED IMPORTS ---
from app.tools.search_tools import search_policy
from app.tools.hr_tools import (
    db, draft_policy_update, get_employee_details, apply_for_leave, 
    get_upcoming_holidays, onboard_employee, prepare_sensitive_transaction, 
    raise_hr_ticket, list_employees, offboard_employee, check_google_calendar_for_leaves
)

load_dotenv()

ALL_KEYS = [
    os.getenv("GEMINI_KEY_1"),
    os.getenv("GEMINI_KEY_2"),
    os.getenv("GEMINI_KEY_3")
]
VALID_KEYS = [key for key in ALL_KEYS if key]
current_key_idx = 0

# 🛠️ FIX 1: Allow this function to accept a dynamically filtered list of tools!
def get_agent_executor(tools_to_bind):
    """Creates a fresh LangGraph agent using the currently active API key and specific tools."""
    global current_key_idx
    active_key = VALID_KEYS[current_key_idx]
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=active_key, 
        temperature=0
    )
    
    return create_agent(llm, tools_to_bind)

def clean_response(response_content):
    if isinstance(response_content, list):
        return "".join([block.get("text", "") for block in response_content if "text" in block])
    return str(response_content)

async def get_agent_response(user_message: str, employee_id: str = "emp_001"):
    global current_key_idx 
    
        
    # --- 1. IDENTITY & ACCESS LOOKUP ---
    user_record = await db.employees.find_one({"employee_id": employee_id.lower()})
    
    if user_record:
        user_name = user_record.get("name", "Unknown")
        user_department = user_record.get("department", "Employee")
        is_hr_admin = user_department.lower() == "hr" or user_department.lower() == "human resources"
        role_title = "HR Administrator" if is_hr_admin else f"{user_department} Employee"
    else:
        user_name = "Guest"
        role_title = "Unverified User"
        is_hr_admin = False

    # 🛡️ FIX 2: Hardcoded Python-Level Security
    # Standard tools everyone gets
    safe_tools = [search_policy, get_employee_details, apply_for_leave, get_upcoming_holidays, raise_hr_ticket, check_google_calendar_for_leaves]
    
    # Give HR the keys to the castle
    if is_hr_admin:
        safe_tools.extend([onboard_employee, offboard_employee, prepare_sensitive_transaction, draft_policy_update, list_employees])

    system_instruction = (
        f"You are the Innvoix HR Agentic AI. "
        f"Chatting with {user_name} (ID: {employee_id}). Role: {role_title}. "
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
        "6. LEAVE PLANNING: If the user asks to plan a vacation or check holidays, use the check_google_calendar_for_leaves tool. Extract the month they mention and convert it to a number (e.g., March = 3). Use the dates returned to suggest strategic days off for a long weekend.\n"
        "\n--- DATA PRIVACY & ESCALATION RULES ---\n"
        "7. DATA MASKING: If you retrieve an employee's personal details (like Bank Account) from the database, "
        "you MUST dynamically mask the data in your final response (e.g., output *****6789).\n"
        "8. TICKET ESCALATION: When an employee asks to speak to HR or raises a complex issue, "
        "you must analyze the chat history and use the 'raise_hr_ticket' tool. Pass a detailed, bulleted summary "
        "of their exact problem into the 'issue_summary' parameter so human HR staff can respond quickly."
        "\n--- LEAVE APPLICATION WORKFLOW ---\n"
        "9. WHEN APPLYING FOR LEAVE, YOU MUST FOLLOW THESE EXACT STEPS IN ORDER:\n"
        "   - First: Use the 'check_google_calendar_for_leaves' tool to check their balance and suggest long weekends.\n"
        "   - Second: You MUST ask the employee for the specific REASON for their leave.\n"
        "   - Third: Only after the employee provides the dates AND the reason, use the 'apply_for_leave' tool to submit it."
    )
    
    session_record = await db.chat_sessions.find_one({"employee_id": employee_id})
    
    if session_record:
        db_history = session_record.get("history", [])
        formatted_memory = [(msg["role"], msg["content"]) for msg in db_history]
    else:
        db_history = []
        formatted_memory = []

    formatted_memory.append(("user", user_message))
    messages = [SystemMessage(content=system_instruction)] + formatted_memory

    for attempt in range(len(VALID_KEYS)):
        try:
            # We now pass ONLY the securely filtered tools to the executor
            agent_executor = get_agent_executor(safe_tools) 
            response = await agent_executor.ainvoke({"messages": messages})
            ai_reply = response["messages"][-1].content
            clean_reply = clean_response(ai_reply)
            
            db_history.append({"role": "user", "content": user_message})
            db_history.append({"role": "assistant", "content": clean_reply})
            
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

async def run_interactive_chat():
    print("==================================================")
    print("🤖 Innovix HR Agentic AI is ONLINE!")
    print("Type 'exit' to quit the chat.")
    print("==================================================\n")
    
    current_user_id = "emp_001"

    while True:
        user_text = input("You: ")
        
        if user_text.lower() in ['exit', 'quit']:
            print("Shutting down Agent...")
            break
            
        answer = await get_agent_response(user_text, employee_id=current_user_id)
        
        print(f"\n🤖 Agent: {answer}\n")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(run_interactive_chat())