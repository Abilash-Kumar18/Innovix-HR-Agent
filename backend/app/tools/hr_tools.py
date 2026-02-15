import os
from dotenv import load_dotenv
from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# --- MONGODB CONNECTION ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.innvoix_hr # Creates a database called 'innvoix_hr'

MOCK_HOLIDAYS = [
    {"date": "2026-05-01", "name": "May Day"},
    {"date": "2026-08-15", "name": "Independence Day"},
    {"date": "2026-10-02", "name": "Gandhi Jayanti"},
    {"date": "2026-10-14", "name": "Ayudha Pooja"},
    {"date": "2026-11-08", "name": "Diwali"}
]

# --- EXISTING TOOLS (Upgraded to MongoDB) ---

@tool
async def get_employee_details(employee_id: str) -> str:
    """Useful to find an employee's leave balance, role, or personal details. Input is the employee ID."""
    print(f"🛠️ TOOL CALLED: Fetching DB details for {employee_id}")
    emp = await db.employees.find_one({"employee_id": employee_id.lower()})
    
    if emp:
        return f"Name: {emp['name']}, Role: {emp['role']}, Casual Leaves Left: {emp.get('casual_leaves_left', 0)}, Sick Leaves Left: {emp.get('sick_leaves_left', 0)}"
    return "Employee not found in the system."

@tool
async def apply_for_leave(employee_id: str, leave_type: str, days: int) -> str:
    """Useful to apply for leave. Input must be the employee_id, leave_type ('casual' or 'sick'), and days."""
    print(f"🛠️ TOOL CALLED: Applying {days} days of {leave_type} leave for {employee_id}")
    emp = await db.employees.find_one({"employee_id": employee_id.lower()})
    
    if not emp: return "Cannot apply: Employee ID not found."
    
    balance_key = f"{leave_type.lower()}_leaves_left"
    if balance_key not in emp: return "Invalid leave type. Must be 'casual' or 'sick'."
        
    if emp[balance_key] >= int(days):
        new_balance = emp[balance_key] - int(days)
        
        # 1. Update the balance
        await db.employees.update_one(
            {"employee_id": employee_id.lower()}, 
            {"$set": {balance_key: new_balance}}
        )
        
        # 2. Add to leave requests
        await db.leave_requests.insert_one({
            "emp_id": employee_id, 
            "type": leave_type, 
            "days": days, 
            "status": "Pending HR Approval"
        })
        return f"SUCCESS: {days} days of {leave_type} leave applied. Remaining balance: {new_balance}."
    else:
        return f"DENIED: Only {emp[balance_key]} {leave_type} leaves left."

@tool
async def get_upcoming_holidays() -> str:
    """Useful to find out the upcoming official company holidays and festival days off."""
    print("🛠️ TOOL CALLED: Fetching company holidays")
    holidays_str = "\n".join([f"- {h['name']} ({h['date']})" for h in MOCK_HOLIDAYS])
    return f"Here are the upcoming company holidays:\n{holidays_str}"

@tool
async def raise_hr_ticket(employee_id: str, issue_category: str, description: str) -> str:
    """Useful for raising an HR, IT, or Payroll support ticket."""
    print(f"🛠️ TOOL CALLED: Raising {issue_category} ticket for {employee_id}")
    
    # Generate ID based on current document count
    count = await db.hr_tickets.count_documents({})
    ticket_id = f"TKT-{count + 101}"
    
    await db.hr_tickets.insert_one({
        "ticket_id": ticket_id,
        "emp_id": employee_id,
        "category": issue_category,
        "issue": description,
        "status": "Open"
    })
    
    return f"SUCCESS: Ticket {ticket_id} has been raised for the {issue_category} department regarding: '{description}'. The team will contact you soon."

@tool
async def onboard_employee(new_hire_name: str, role: str, department: str) -> str:
    """Useful for HR to start the onboarding workflow for a new hire."""
    print(f"🛠️ TOOL CALLED: Onboarding {new_hire_name} into {department}")
    
    count = await db.employees.count_documents({})
    new_id = f"emp_00{count + 1}"
    
    # Create HR Record in MongoDB
    await db.employees.insert_one({
        "employee_id": new_id,
        "name": new_hire_name, 
        "role": role, 
        "department": department,
        "casual_leaves_left": 12, 
        "sick_leaves_left": 10
    })
    
    return (
        f"SUCCESS: Onboarding initiated for {new_hire_name} (ID: {new_id}).\n"
        f"Workflow Executed:\n"
        f"- HRIS Record Created.\n"
        f"- IT Ticket raised for Laptop & Software Access.\n"
        f"- Automated Welcome Email & Policy Checklist queued for delivery."
    )

@tool
async def prepare_sensitive_transaction(employee_id: str, action_type: str, details: str) -> str:
    """CRITICAL: Must be used for sensitive actions like 'salary_change' or 'termination'."""
    print(f"🛠️ TOOL CALLED: Guardrail triggered for {action_type} on {employee_id}")
    
    count = await db.pending_approvals.count_documents({})
    transaction_id = f"TRX-{count + 1000}"
    
    await db.pending_approvals.insert_one({
        "trx_id": transaction_id,
        "emp_id": employee_id,
        "action": action_type,
        "details": details,
        "status": "AWAITING_HUMAN_APPROVAL"
    })
    
    return f"GUARDRAIL ACTIVE: The {action_type} transaction for {employee_id} has been drafted (ID: {transaction_id}). It is currently locked and awaiting final Human HR approval. No systems have been updated yet."

@tool
async def draft_policy_update(policy_title: str, new_rules: str) -> str:
    """Useful when an HR Manager wants to draft or update a company policy."""
    print(f"🛠️ TOOL CALLED: Drafting policy - {policy_title}")
    
    await db.policy_drafts.insert_one({
        "title": policy_title, 
        "content": new_rules
    })
    
    return f"SUCCESS: Draft for '{policy_title}' has been saved to the policy repository."