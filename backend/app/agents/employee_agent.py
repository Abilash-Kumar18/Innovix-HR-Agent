import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import Tool
from langchain_core.messages import SystemMessage
from langchain.agents import create_agent
from app.tools.search_tools import search_policy

# --- UPDATED IMPORTS ---
from app.tools.hr_tools import get_employee_details, apply_for_leave, get_upcoming_holidays, raise_hr_ticket

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0
)

# --- ADD ALL 5 TOOLS TO THE ARSENAL ---
tools = [
    Tool(
        name="Search_HR_Policy",
        func=search_policy,
        description="Useful for questions about leave, remote work, or company rules. Input should be a specific search phrase."
    ),
    get_employee_details,
    apply_for_leave,
    get_upcoming_holidays,  # New Tool
    raise_hr_ticket         # New Tool
]

agent_executor = create_agent(llm, tools)

def clean_response(response_content):
    if isinstance(response_content, list):
        return "".join([block.get("text", "") for block in response_content if "text" in block])
    return str(response_content)

def get_agent_response(user_message: str, employee_id: str = "emp_001"):
    try:
        # --- EXPANDED SYSTEM INSTRUCTIONS ---
        system_instruction = (
    "You are an advanced Agentic HR Platform for team Innvoix. "
    f"The user currently chatting with you has the Employee ID: {employee_id}. "
    "Use your tools to orchestrate workflows: "
    "  - 'Search_HR_Policy': For reading existing PDF policies. "
    "  - 'onboard_employee': To execute the multi-step new hire workflow. "
    "  - 'prepare_sensitive_transaction': ALWAYS use this for salary changes or firing someone. Never execute these directly. "
    "  - 'draft_policy_update': To help HR write new policies. "
    "  - 'get_employee_details', 'apply_for_leave', 'get_upcoming_holidays', 'raise_hr_ticket'. "
    "If the user is an Employee, they cannot onboard or change salaries. Politely decline if they try."
)

        messages = [
            SystemMessage(content=system_instruction),
            ("user", user_message)
        ]
        
        response = agent_executor.invoke({"messages": messages})
        raw_content = response["messages"][-1].content
        return clean_response(raw_content)

    except Exception as e:
        return f"Error processing request: {str(e)}"

# --- TEST THE NEW TOOLS ---
if __name__ == "__main__":
    print("🤖 Agent Testing New Tools...\n")
    
    print("Test 1: Holidays")
    print(get_agent_response("When is our next holiday?", employee_id="emp_001") + "\n")
    
    print("Test 2: Ticketing")
    print(get_agent_response("My laptop screen is flickering, can you help?", employee_id="emp_001") + "\n")