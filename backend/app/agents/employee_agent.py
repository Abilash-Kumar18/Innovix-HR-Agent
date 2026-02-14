import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import Tool
from langchain_core.messages import SystemMessage
from langchain.agents import create_agent
from app.tools.search_tools import search_policy

load_dotenv()

# 1. Setup the LLM (Use 1.5-flash for stability)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0
)

# 2. Define the Tools
tools = [
    Tool(
        name="Search_HR_Policy",
        func=search_policy,
        description="Useful for questions about leave, remote work, or company rules. Input should be a specific search phrase."
    )
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

def get_agent_response(user_message: str):
    """
    Entry point for the API.
    """
    try:
        # Define personality
        system_instruction = (
            "You are a helpful HR Assistant. "
            "Step 1: ALWAYS use the 'Search_HR_Policy' tool first. "
            "Step 2: Read the tool output. "
            "Step 3: Answer the user based ONLY on that output. "
            "If the tool returns no results, say 'I cannot find that in the policy.'"
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
    print("🤖 Bot Ready! Asking about Casual Leave...")
    answer = get_agent_response("How many casual leaves do I have?")
    print("\n--- FINAL RESPONSE ---\n")
    print(answer)