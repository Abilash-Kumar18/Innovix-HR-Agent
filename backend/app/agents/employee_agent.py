import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import Tool
from langchain_core.messages import SystemMessage
from langchain.agents import create_agent
from app.tools.search_tools import search_policy

# --- NEW IMPORTS FOR AGENTIC TOOLS ---
from app.tools.hr_tools import get_employee_details, apply_for_leave

load_dotenv()

# 1. Setup the LLM (Kept your exact model)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0
)

# 2. Define the Tools (Now with 3 tools!)
tools = [
    Tool(
        name="Search_HR_Policy",
        func=search_policy,
        description="Useful for questions about leave, remote work, or company rules. Input should be a specific search phrase."
    ),
    get_employee_details,
    apply_for_leave
]

# 3. Create the Agent
agent_executor = create_agent(llm, tools)

def clean_response(response_content):
    """
    Sometimes the AI returns a list of blocks like [{'text': '...'}].
    This helper cleans it into a simple string.
    """
    if isinstance(response_content, list):
        # Join all text parts together
        return "".join([block.get("text", "") for block in response_content if "text" in block])
    return str(response_content)

# --- ADDED employee_id PARAMETER ---
def get_agent_response(user_message: str, employee_id: str = "emp_001"):
    """
    Entry point for the API.
    """
    try:
        # --- UPDATED PERSONALITY TO USE ALL TOOLS ---
        system_instruction = (
            "You are a helpful HR Assistant for team Innvoix. "
            f"The user currently chatting with you has the Employee ID: {employee_id}. "
            "Step 1: Decide which tool to use based on the user's request. "
            "  - Use 'Search_HR_Policy' for general rules. "
            "  - Use 'get_employee_details' to check their leave balance or profile. "
            "  - Use 'apply_for_leave' to submit a leave request for them. "
            "Step 2: Read the tool output. "
            "Step 3: Answer the user based ONLY on that output. "
            "If the tool returns no results, say 'I cannot find that information.'"
        )

        messages = [
            SystemMessage(content=system_instruction),
            ("user", user_message)
        ]
        
        # Run the agent
        response = agent_executor.invoke({"messages": messages})
        
        # Extract and clean the answer
        raw_content = response["messages"][-1].content
        final_answer = clean_response(raw_content)
        
        return final_answer

    except Exception as e:
        return f"Error processing request: {str(e)}"

# --- Test ---
if __name__ == "__main__":
    print("🤖 Bot Ready! Testing Agentic Actions...\n")
    
    print("Test 1: Asking for balance...")
    answer1 = get_agent_response("How many casual leaves do I have left?", employee_id="emp_001")
    print(f"Response: {answer1}\n")
    
    print("Test 2: Applying for leave...")
    answer2 = get_agent_response("I want to apply for 2 days of casual leave.", employee_id="emp_001")
    print(f"Response: {answer2}\n")