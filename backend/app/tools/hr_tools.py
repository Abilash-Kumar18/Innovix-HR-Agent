import os
import certifi
from dotenv import load_dotenv
from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

load_dotenv()

# --- MONGODB CONNECTION ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.innvoix_hr # Creates a database called 'innvoix_hr'

MOCK_HOLIDAYS = [
    {"date": "2026-05-01", "name": "May Day"},
    {"date": "2026-08-15", "name": "Independence Day"},
    {"date": "2026-10-02", "name": "Gandhi Jayanti"},
    {"date": "2026-10-14", "name": "Ayudha Pooja"},
    {"date": "2026-11-08", "name": "Diwali"}
]

# --- GOOGLE CALENDAR AUTH SETUP ---
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
SERVICE_ACCOUNT_FILE = 'data/google_credentials.json'

def get_calendar_service():
    """Authenticates with Google Cloud using the Service Account JSON."""
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('calendar', 'v3', credentials=creds)

@tool
async def check_google_calendar_for_leaves(employee_id: str, target_month_num: int, target_year: int = 2026) -> str:
    """
    Useful for checking REAL Google Calendar holidays to suggest vacation days.
    Input requires the employee_id, target_month_num (1-12), and target_year.
    """
    print(f"🛠️ TOOL CALLED: Fetching live Google Calendar for month {target_month_num}")
    
    # 1. Check Employee Leave Balance
    emp = await db.employees.find_one({"employee_id": employee_id.lower()})
    if not emp:
        return "Error: Employee not found."
        
    leaves_left = emp.get("casual_leaves_left", 0)
    if leaves_left <= 0:
        return "You have 0 casual leaves remaining. I cannot suggest a vacation."

   # 2. Setup Date Ranges for the Google API
    # Start of the month
    time_min = datetime(target_year, target_month_num, 1, 0, 0, 0).isoformat() + 'Z' 
    # End of the month
    if target_month_num == 12:
        time_max = datetime(target_year + 1, 1, 1, 0, 0, 0).isoformat() + 'Z'
    else:
        time_max = datetime(target_year, target_month_num + 1, 1, 0, 0, 0).isoformat() + 'Z'


    # 3. Call the actual Google Calendar API
    try:
        service = get_calendar_service()
        calendar_id = os.getenv("GOOGLE_CALENDAR_ID")
        
        events_result = service.events().list(
            calendarId=calendar_id, 
            timeMin=time_min,
            timeMax=time_max, 
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        holidays = events_result.get('items', [])
        
        if not holidays:
            return f"You have {leaves_left} leaves, but there are no official company holidays listed in Google Calendar for month {target_month_num}."
            
        # 4. Format the output so LangGraph can read it and do the math
        calendar_summary = f"You have {leaves_left} casual leaves left.\n\nHere are the live events from the Google Calendar:\n"
        for event in holidays:
            start = event['start'].get('dateTime', event['start'].get('date'))
            calendar_summary += f"- {event['summary']} on {start}\n"
            
        calendar_summary += "\nAI INSTRUCTION: Look at these dates. If any fall on a Tuesday or Thursday, explicitly suggest that the user takes Monday or Friday off to get a 4-day long weekend."
        
        return calendar_summary

    except Exception as e:
        return f"❌ Google Calendar API Error: {str(e)}"


# --- AUDIT LOGGING HELPER ---
async def log_audit_action(action_name: str, details: str):
    """Silently logs AI actions to MongoDB for enterprise compliance."""
    await db.audit_logs.insert_one({
        "timestamp": datetime.utcnow(),
        "action": action_name,
        "details": details,
        "performed_by": "Agentic_AI_Core"
    })

@tool
async def get_employee_details(employee_id_or_name: str) -> str:
    """
    Useful to find an employee's leave balance, role, or personal details. 
    Input can be their exact employee ID (e.g., 'emp_001') OR their Name (e.g., 'Abilash').
    """
    print(f"🛠️ TOOL CALLED: Fetching DB details for {employee_id_or_name}")
    
    # 1. Try finding by exact employee_id first
    emp = await db.employees.find_one({"employee_id": employee_id_or_name.lower()})
    
    # 2. If not found by ID, search by Name (case-insensitive partial match)
    if not emp:
        emp = await db.employees.find_one({"name": {"$regex": employee_id_or_name, "$options": "i"}})
        
    if emp:
        # --- ADDED SALARY TO THE RETURN STRING ---
        return f"ID: {emp.get('employee_id')}, Name: {emp['name']}, Role: {emp['role']}, Salary: ${emp.get('salary', 'N/A')}, Casual Leaves: {emp.get('casual_leaves_left', 0)}, Sick Leaves: {emp.get('sick_leaves_left', 0)}"
    return f"Employee '{employee_id_or_name}' not found."


@tool
async def apply_for_leave(employee_id_or_name: str, leave_type: str, days: int) -> str:
    """
    Useful to apply for leave. 
    Input 'employee_id_or_name' can be the ID or Name, 'leave_type' ('casual' or 'sick'), and 'days'.
    """
    print(f"🛠️ TOOL CALLED: Applying {days} days of {leave_type} leave for {employee_id_or_name}")
    
    # Smart lookup: Try ID first, then fallback to Name
    emp = await db.employees.find_one({"employee_id": employee_id_or_name.lower()})
    if not emp:
        emp = await db.employees.find_one({"name": {"$regex": employee_id_or_name, "$options": "i"}})
        
    if not emp: 
        return f"Cannot apply: Employee '{employee_id_or_name}' not found."
    
    # Ensure we use their actual ID for the database records, even if a name was passed
    actual_emp_id = emp["employee_id"]
    
    balance_key = f"{leave_type.lower()}_leaves_left"
    if balance_key not in emp: 
        return "Invalid leave type. Must be 'casual' or 'sick'."
        
    if emp[balance_key] >= int(days):
        new_balance = emp[balance_key] - int(days)
        
        # Update the balance using their actual ID
        await db.employees.update_one(
            {"employee_id": actual_emp_id}, 
            {"$set": {balance_key: new_balance}}
        )
        count = await db.leave_requests.count_documents({})
        req_id = f"LR-{count + 101}"
        # Add to leave requests using their actual ID
        await db.leave_requests.insert_one({
            "req_id": req_id,
            "emp_id": actual_emp_id, 
            "employee_name": emp["name"], # Good to store the name here too!
            "type": leave_type, 
            "days": days, 
            "status": "Pending HR Approval"
        })
        return f"SUCCESS: {days} days of {leave_type} leave applied for {emp['name']}. Remaining balance: {new_balance}."
    else:
        return f"DENIED: {emp['name']} only has {emp[balance_key]} {leave_type} leaves left."

@tool
async def get_upcoming_holidays() -> str:
    """Useful to find out the upcoming official company holidays and festival days off."""
    print("🛠️ TOOL CALLED: Fetching company holidays from MongoDB")
    
    # Fetch from a new 'holidays' collection in MongoDB
    cursor = db.holidays.find().sort("date", 1) 
    holidays = await cursor.to_list(length=20)
    
    if not holidays:
        return "I couldn't find any upcoming holidays in the database."
        
    holidays_str = "\n".join([f"- {h['name']} ({h['date']})" for h in holidays])
    return f"Here are the upcoming company holidays:\n{holidays_str}"

@tool
async def raise_hr_ticket(employee_id_or_name: str, issue_summary: str) -> str:
    """
    STRICT RULE: DO NOT use this tool on the user's first complaint. 
    You MUST ask the user 1 or 2 clarifying questions first to understand the root cause (e.g., "How much was it short?", "Did you work overtime?"). 
    ONLY trigger this tool AFTER they reply with more details, OR if they explicitly demand a ticket.
    The 'issue_summary' MUST be a detailed, bulleted summary of the entire chat history.
    """
    print(f"🛠️ TOOL CALLED: Raising HR ticket for {employee_id_or_name}")
    
    # Smart lookup: Try ID first, then fallback to Name
    emp = await db.employees.find_one({"employee_id": employee_id_or_name.lower()})
    if not emp:
        emp = await db.employees.find_one({"name": {"$regex": employee_id_or_name, "$options": "i"}})
        
    if not emp: 
        return f"Cannot raise ticket: Employee '{employee_id_or_name}' not found."
    
    actual_emp_id = emp["employee_id"]
    
    # Generate a unique ticket ID
    count = await db.hr_tickets.count_documents({})
    ticket_id = f"TKT-{count + 1000}"
    
    # Insert the summarized ticket into MongoDB
    await db.hr_tickets.insert_one({
        "ticket_id": ticket_id,
        "emp_id": actual_emp_id, 
        "employee_name": emp["name"],
        "issue_summary": issue_summary,
        "status": "Open",
        "created_at": datetime.utcnow()
    })
    
    # Log the action (from Phase 2)
    await log_audit_action(
        action_name="RAISE_TICKET", 
        details=f"Escalated ticket {ticket_id} for {emp['name']}."
    )
    
    return f"SUCCESS: Ticket {ticket_id} has been raised for {emp['name']}. A detailed summary has been sent to the HR team."

@tool
async def onboard_employee(new_hire_name: str, role: str, department: str, bank_account: str, emergency_contact: str) -> str:
    """
    Useful for HR to officially onboard a new hire. 
    MUST include bank_account and emergency_contact details.
    """
    print(f"🛠️ TOOL CALLED: Onboarding {new_hire_name} into {department}")
    
    count = await db.employees.count_documents({})
    new_id = f"emp_{count + 100}" # Starts IDs at emp_100 to avoid clashes
    
    # Inserts into the HRIS database
    await db.employees.insert_one({
        "employee_id": new_id,
        "name": new_hire_name, 
        "role": role, 
        "department": department,
        "bank_account": bank_account,
        "emergency_contact": emergency_contact,
        "salary": 60000, 
        "casual_leaves_left": 12, 
        "sick_leaves_left": 10,
        "status": "Active"
    })
    await log_audit_action(
        action_name="ONBOARD_EMPLOYEE", 
        details=f"Onboarded {new_hire_name} (ID: {new_id}) to {department}."
    )
    return f"SUCCESS: Onboarding initiated for {new_hire_name} (ID: {new_id}). Bank and contact info securely stored."

@tool
async def offboard_employee(employee_id_or_name: str, offboard_date: str) -> str:
    """
    Useful for HR to orchestrate cross-system offboarding.
    Triggers HRIS termination, IT access revocation, and Payroll final settlement.
    """
    print(f"🛠️ TOOL CALLED: Multi-System Offboarding for {employee_id_or_name} on {offboard_date}")
    
    # Smart lookup: ID or Name
    emp = await db.employees.find_one({"employee_id": employee_id_or_name.lower()})
    if not emp:
        emp = await db.employees.find_one({"name": {"$regex": employee_id_or_name, "$options": "i"}})
        
    if not emp: 
        return f"Cannot offboard: Employee '{employee_id_or_name}' not found."
    
    actual_emp_id = emp["employee_id"]
    emp_name = emp["name"]
    
    # 1. Update HRIS System (employees collection)
    await db.employees.update_one(
        {"employee_id": actual_emp_id}, 
        {"$set": {"status": "Terminated", "offboard_date": offboard_date}}
    )
    
    # 2. Trigger IT System (it_tickets collection)
    await db.it_tickets.insert_one({
        "emp_id": actual_emp_id,
        "employee_name": emp_name,
        "task": "Revoke laptop, email, and system access",
        "due_date": offboard_date,
        "status": "Pending IT Action"
    })
    
    # 3. Trigger Payroll System (payroll collection)
    await db.payroll.insert_one({
        "emp_id": actual_emp_id,
        "employee_name": emp_name,
        "action": "Process final settlement and tax forms",
        "effective_date": offboard_date,
        "status": "Pending Payroll Action"
    })
    
    await log_audit_action(
        action_name="OFFBOARD_EMPLOYEE", 
        details=f"Offboarded {emp_name} (ID: {actual_emp_id}) on {offboard_date}."
    )
    return f"SUCCESS: Offboarding orchestrated for {emp_name}. HRIS updated to Terminated, IT access revocation ticket created, and Payroll notified."

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
    await log_audit_action(
        action_name="PREPARE_SENSITIVE_TRANSACTION", 
        details=f"Prepared sensitive transaction {transaction_id} for employee {employee_id} ({action_type})."
    )
    return f"GUARDRAIL ACTIVE: The {action_type} transaction for {employee_id} has been drafted (ID: {transaction_id}). It is currently locked and awaiting final Human HR approval. No systems have been updated yet."

@tool
async def list_employees(department: str = None) -> str:
    """
    Useful for getting a list of all employees. 
    Can optionally filter by department (e.g., 'Sales', 'Engineering').
    """
    print(f"🛠️ TOOL CALLED: Listing employees (Department filter: {department})")
    
    # If a department is provided, filter by it. Otherwise, get everyone.
    query = {"department": department} if department else {}
    
    # Fetch up to 50 employees from MongoDB
    cursor = db.employees.find(query)
    employees = await cursor.to_list(length=50)
    
    if not employees:
        return "No employees found in the database."
        
    # Format the list nicely
    emp_list = "\n".join([f"- {emp.get('name', 'Unknown')} (ID: {emp.get('employee_id', 'N/A')}, Role: {emp.get('role', 'N/A')})" for emp in employees])
    
    return f"Here is the requested employee list:\n{emp_list}"

@tool
async def draft_policy_update(policy_title: str, new_rules: str) -> str:
    """Useful when an HR Manager wants to draft or update a company policy."""
    print(f"🛠️ TOOL CALLED: Drafting policy - {policy_title}")
    
    await db.policy_drafts.insert_one({
        "title": policy_title, 
        "content": new_rules
    })
    
    return f"SUCCESS: Draft for '{policy_title}' has been saved to the policy repository."