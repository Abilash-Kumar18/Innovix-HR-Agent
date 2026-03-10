import os
import asyncio
from dotenv import load_dotenv
import langchain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from langchain.agents import create_agent
from datetime import datetime, timedelta
langchain.debug = True

# --- UPDATED IMPORTS ---
from app.tools.search_tools import search_policy
from app.tools.hr_tools import (
    db, draft_policy_update, get_employee_details, apply_for_leave, 
    get_upcoming_holidays, onboard_employee, prepare_sensitive_transaction, 
    raise_hr_ticket, list_employees, offboard_employee, check_google_calendar_for_leaves,invite_new_hire, complete_onboarding_profile, send_leave_email_to_hr,send_standard_email, draft_policy_update
)

load_dotenv()

ALL_KEYS = [
    os.getenv("GEMINI_KEY_1"),
    os.getenv("GEMINI_KEY_2"),
    os.getenv("GEMINI_KEY_3"),
    os.getenv("GEMINI_KEY_4"),
    os.getenv("GEMINI_KEY_5")
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

async def get_agent_response(user_message: str, employee_id: str = "emp_106"):
    global current_key_idx 
    if not user_message or not user_message.strip():
        return "Please type a valid message."
        
   # --- 1. IDENTITY & ACCESS LOOKUP ---
    from bson import ObjectId
    from bson.errors import InvalidId
    
    # Check the Auth (users) collection first
    try:
        user_record = await db.users.find_one({"_id": ObjectId(employee_id)})
    except InvalidId:
        user_record = await db.users.find_one({"employee_id": employee_id.lower()})
        
    # NEW FIX: If not in 'users', check the main 'employees' collection!
    if not user_record:
        user_record = await db.employees.find_one({"employee_id": employee_id.lower()})
    
    if user_record:
        user_name = user_record.get("name", "Unknown")
        user_department = user_record.get("department", "Employee")
        onboarding_status = user_record.get("onboarding_status", "Completed")
        
        # CRITICAL: Grab their real 'emp_xxx' ID to tell the LLM, so tools work!
        real_emp_id = user_record.get("employee_id", employee_id) 
        
        dep_lower = user_department.lower()
        is_hr_admin = "hr" in dep_lower or "human resources" in dep_lower
        role_title = "HR Administrator" if is_hr_admin else f"{user_department} Employee"
    else:
        user_name = "Guest"
        role_title = "Unverified User"
        is_hr_admin = False
        onboarding_status = "Unknown"
        real_emp_id = employee_id


    # 🛡️ FIX 2: Hardcoded Python-Level Security
    # Standard tools everyone gets
    safe_tools = [search_policy, get_employee_details, apply_for_leave, get_upcoming_holidays, raise_hr_ticket, check_google_calendar_for_leaves,complete_onboarding_profile]
    
    # Give HR the keys to the castle
    if is_hr_admin:
        safe_tools.extend([onboard_employee, offboard_employee, prepare_sensitive_transaction, draft_policy_update, list_employees, invite_new_hire])
    
    system_instruction = (
        f"You are the Innvoix HR Agentic AI. "
        f"Chatting with {user_name}. Role: {role_title}. "
        f"\n[System Auth ID: {employee_id} | Official HR ID: {real_emp_id}]\n" # <--- Tells the LLM both IDs
        "\n\n--- SECURITY & ACCESS CONTROL RULES ---\n"
        "1. Standard Employees can ONLY ask about policies, check leave balances, apply for leave, and raise tickets.\n"
        "2. ONLY HR Administrators have the security clearance to use: 'onboard_employee', 'offboard_employee', 'prepare_sensitive_transaction', 'draft_policy_update', 'invite_new_hire', and 'list_employees'.\n"
        "3. If a Standard Employee asks you to perform an HR-only action, you MUST completely refuse.\n"
       "\n--- WORKFLOW ORCHESTRATION RULES ---\n"
        f"\n--- ONBOARDING STATUS: {onboarding_status.upper()} ---\n"
        "INVITING VS ONBOARDING: If HR asks to 'invite' a new hire, you MUST ask HR for the Name, Email, Role, and Department. Do NOT ask for a password (the system auto-generates it). Once they provide those 4 details, immediately call the 'invite_new_hire' tool using those values.\n"        "If the user's status is PENDING: You MUST immediately greet them and tell them they need to complete their onboarding profile. "
        "You MUST ask them to provide ALL of the following details: \n"
        "1. Phone Number\n"
        "2. Home Address\n"
        "3. Bank Account Number\n"
        "4. Emergency Contact\n"
        "Also, politely remind them to use the chat attachment button to upload a copy of their Government ID. "
        f"Do NOT use the 'complete_onboarding_profile' tool until they have provided all 4 text details in the chat. When calling it, pass the System Auth ID ({employee_id}) into the employee_id argument.\n"
        "4. ONBOARDING: If an HR Admin asks to onboard someone fully, you must collect their bank and emergency info before calling onboard_employee.\n"
        "5. OFFBOARDING: When offboarding, ensure you ask for the specific offboard date if it wasn't provided.\n"
        "6. LEAVE PLANNING: If the user asks to plan a vacation or check holidays, use the check_google_calendar_for_leaves tool. Extract the month they mention and convert it to a number (e.g., March = 3). Use the dates returned to suggest strategic days off for a long weekend.\n"
        "\n--- DATA PRIVACY & ESCALATION RULES ---\n"
        "7. DATA MASKING: If you retrieve an employee's personal details (like Bank Account) from the database, "
        "you MUST dynamically mask the data in your final response (e.g., output *****6789).\n"
        "8. TICKET ESCALATION: When an employee asks to speak to HR or raises a complex issue, "
        "you must analyze the chat history and use the 'raise_hr_ticket' tool. Pass a detailed, bulleted summary "
        "of their exact problem into the 'issue_summary' parameter so human HR staff can respond quickly.\n"
        "\n--- LEAVE APPLICATION WORKFLOW ---\n"
        "9. WHEN APPLYING FOR LEAVE, YOU MUST FOLLOW THESE EXACT STEPS IN ORDER:\n"
        "   - First: Use the 'check_google_calendar_for_leaves' tool to check their balance and suggest long weekends.\n"
        "   - Second: You MUST ask the employee for the specific REASON for their leave.\n"
        "   - Third: Only after the employee provides the dates AND the reason, use the 'apply_for_leave' tool to submit it."
    )
    
    session_record = await db.chat_sessions.find_one({"employee_id": employee_id})
    
    if session_record:
        db_history = session_record.get("history", [])
        formatted_memory = [(msg["role"], msg["content"]) for msg in db_history if msg.get("content", "").strip()]
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
    
    current_user_id = "emp_106"

    while True:
        user_text = input("You: ")
        
        if user_text.lower() in ['exit', 'quit', 'bye']:
            print("Shutting down Agent...")
            break
            
        answer = await get_agent_response(user_text, employee_id=current_user_id)
        
        print(f"\n🤖 Agent: {answer}\n")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(run_interactive_chat())