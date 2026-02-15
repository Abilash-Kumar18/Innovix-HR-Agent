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
            "You are a helpful and professional HR Assistant for team Innvoix. "
            f"The user currently chatting with you has the Employee ID: {employee_id}. "
            "You have multiple tools at your disposal. Decide which to use based on the user's request: "
            "  - 'Search_HR_Policy': For general rules and PDF policy lookups. "
            "  - 'get_employee_details': To check personal leave balances or profile data. "
            "  - 'apply_for_leave': To submit a leave request. "
            "  - 'get_upcoming_holidays': To check the company holiday calendar. "
            "  - 'raise_hr_ticket': To report issues, IT problems, or payroll grievances. "
            "Answer the user naturally and concisely based ONLY on the tool output."
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