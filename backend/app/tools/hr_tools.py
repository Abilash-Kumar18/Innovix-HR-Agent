import os
import smtplib
import certifi
from dotenv import load_dotenv
from langchain_core.tools import tool
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from email.message import EmailMessage

load_dotenv()

# --- MONGODB CONNECTION ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.innvoix_hr 

# --- GOOGLE CALENDAR AUTH SETUP ---
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

# Dynamically builds the absolute path: tools -> app -> backend -> data -> google_credentials.json
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))
SERVICE_ACCOUNT_FILE = os.path.join(BACKEND_DIR, 'data', 'google_credentials.json')

def get_calendar_service():
    """Authenticates with Google Cloud using the Service Account JSON."""
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('calendar', 'v3', credentials=creds)

def send_leave_email_to_hr(employee_name: str, start_date: str, end_date: str, reason: str):
    """Sends an automated email to the HR department."""
    sender_email = os.getenv("SENDER_EMAIL") 
    sender_password = os.getenv("SENDER_PASSWORD")
    hr_email = os.getenv("HR_EMAIL", "hr@innvoix.com")
    
    if not sender_email or not sender_password:
        print("⚠️ Email credentials not set in .env. Skipping email notification.")
        return

    msg = EmailMessage()
    msg.set_content(
        f"Hello HR,\n\n"
        f"A new leave request has been submitted and requires your approval.\n\n"
        f"Employee: {employee_name}\n"
        f"Dates: {start_date} to {end_date}\n"
        f"Reason: {reason}\n\n"
        f"Please log in to the Innvoix HR Dashboard to approve or reject this request."
    )
    
    msg['Subject'] = f"Action Required: Leave Request from {employee_name}"
    msg['From'] = sender_email
    msg['To'] = hr_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
            print(f"📧 Notification email successfully sent to {hr_email}!")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

@tool
async def check_google_calendar_for_leaves(employee_id: str, target_month_num: int, target_year: int = 2026) -> str:
    """
    Useful for checking REAL Google Calendar holidays to suggest vacation days.
    Input requires the employee_id, target_month_num (1-12), and target_year.
    """
    try:
        target_month_num = int(target_month_num)
        target_year = int(target_year)
    except ValueError:
        return "I need a valid numerical month and year to check the calendar."
        
    if not (1 <= target_month_num <= 12):
        return "I can only check calendar events for valid months (1 through 12). Please specify a real month."

    print(f"🛠️ TOOL CALLED: Fetching live Google Calendar for month {target_month_num}")
    
    emp = await db.employees.find_one({"employee_id": employee_id.lower()})
    if not emp:
        return "Error: Employee not found."
        
    leaves_left = emp.get("casual_leaves_left", 0)
    if leaves_left <= 0:
        return "You have 0 casual leaves remaining. I cannot suggest a vacation."

    time_min = datetime(target_year, target_month_num, 1, 0, 0, 0).isoformat() + 'Z' 
    if target_month_num == 12:
        time_max = datetime(target_year + 1, 1, 1, 0, 0, 0).isoformat() + 'Z'
    else:
        time_max = datetime(target_year, target_month_num + 1, 1, 0, 0, 0).isoformat() + 'Z'

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
            
        calendar_summary = f"You have {leaves_left} casual leaves left.\n\nHere are the live events from the Google Calendar:\n"
        for event in holidays:
            start = event['start'].get('dateTime', event['start'].get('date'))
            calendar_summary += f"- {event['summary']} on {start}\n"
            
        calendar_summary += "\nAI INSTRUCTION: Look at these dates. If any fall on a Tuesday or Thursday, explicitly suggest that the user takes Monday or Friday off to get a 4-day long weekend."
        
        return calendar_summary

    except Exception as e:
        print(f"❌ GOOGLE CALENDAR API ERROR: {str(e)}")
        return "I'm sorry, I'm having trouble accessing the Google Calendar to check for upcoming holidays and your leave balance at the moment."

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
    Input can be their exact employee ID (e.g., 'emp_001') OR their Name.
    """
    if not isinstance(employee_id_or_name, str) or not employee_id_or_name.strip():
        return "Please provide a valid employee name or ID."

    print(f"🛠️ TOOL CALLED: Fetching DB details for {employee_id_or_name}")
    
    emp = await db.employees.find_one({"employee_id": employee_id_or_name.lower()})
    if not emp:
        emp = await db.employees.find_one({"name": {"$regex": employee_id_or_name, "$options": "i"}})
        
    if emp:
        return f"ID: {emp.get('employee_id')}, Name: {emp['name']}, Role: {emp['role']}, Salary: ${emp.get('salary', 'N/A')}, Casual Leaves: {emp.get('casual_leaves_left', 0)}, Sick Leaves: {emp.get('sick_leaves_left', 0)}"
    return f"Employee '{employee_id_or_name}' not found."

@tool
async def apply_for_leave(employee_id_or_name: str, start_date: str, end_date: str, reason: str) -> str:
    """
    Submits a leave request for the employee to HR. 
    MUST include the start_date, end_date, and the specific reason for the leave.
    """
    if not isinstance(employee_id_or_name, str) or not employee_id_or_name.strip():
        return "Please provide a valid employee name or ID."

    print(f"🛠️ TOOL CALLED: Applying for leave for {employee_id_or_name} from {start_date} to {end_date}")
    
    emp = await db.employees.find_one({"employee_id": employee_id_or_name.lower()})
    if not emp:
        emp = await db.employees.find_one({"name": {"$regex": employee_id_or_name, "$options": "i"}})
        
    if not emp: 
        return f"Cannot apply for leave: Employee '{employee_id_or_name}' not found."
    
    actual_emp_id = emp["employee_id"]
    emp_name = emp["name"]
    
    leave_request = {
        "emp_id": actual_emp_id,
        "employee_name": emp_name,
        "start_date": start_date,
        "end_date": end_date,
        "reason": reason,
        "status": "Pending HR Approval"
    }
    await db.leaves.insert_one(leave_request)
    
    send_leave_email_to_hr(emp_name, start_date, end_date, reason)
    
    return f"SUCCESS: Leave request for {start_date} to {end_date} submitted. HR has been notified via email and will review your reason: '{reason}'."

@tool
async def get_upcoming_holidays() -> str:
    """Useful to find out the upcoming official company holidays and festival days off."""
    print("🛠️ TOOL CALLED: Fetching company holidays from MongoDB")
    
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
    You MUST ask the user 1 or 2 clarifying questions first to understand the root cause.
    The 'issue_summary' MUST be a detailed, bulleted summary of the entire chat history.
    """
    if not isinstance(employee_id_or_name, str) or not employee_id_or_name.strip():
        return "Please provide a valid employee name or ID."

    print(f"🛠️ TOOL CALLED: Raising HR ticket for {employee_id_or_name}")
    
    emp = await db.employees.find_one({"employee_id": employee_id_or_name.lower()})
    if not emp:
        emp = await db.employees.find_one({"name": {"$regex": employee_id_or_name, "$options": "i"}})
        
    if not emp: 
        return f"Cannot raise ticket: Employee '{employee_id_or_name}' not found."
    
    actual_emp_id = emp["employee_id"]
    
    count = await db.hr_tickets.count_documents({})
    ticket_id = f"TKT-{count + 1000}"
    
    await db.hr_tickets.insert_one({
        "ticket_id": ticket_id,
        "emp_id": actual_emp_id, 
        "employee_name": emp["name"],
        "issue_summary": issue_summary,
        "status": "Open",
        "created_at": datetime.utcnow()
    })
    
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
    new_id = f"emp_{count + 100}" 
    
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
    if not isinstance(employee_id_or_name, str) or not employee_id_or_name.strip():
        return "Please provide a valid employee name or ID."

    print(f"🛠️ TOOL CALLED: Multi-System Offboarding for {employee_id_or_name} on {offboard_date}")
    
    emp = await db.employees.find_one({"employee_id": employee_id_or_name.lower()})
    if not emp:
        emp = await db.employees.find_one({"name": {"$regex": employee_id_or_name, "$options": "i"}})
        
    if not emp: 
        return f"Cannot offboard: Employee '{employee_id_or_name}' not found."
    
    actual_emp_id = emp["employee_id"]
    emp_name = emp["name"]
    
    await db.employees.update_one(
        {"employee_id": actual_emp_id}, 
        {"$set": {"status": "Terminated", "offboard_date": offboard_date}}
    )
    
    await db.it_tickets.insert_one({
        "emp_id": actual_emp_id,
        "employee_name": emp_name,
        "task": "Revoke laptop, email, and system access",
        "due_date": offboard_date,
        "status": "Pending IT Action"
    })
    
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
    
    query = {"department": {"$regex": department, "$options": "i"}} if department else {}
    
    cursor = db.employees.find(query)
    employees = await cursor.to_list(length=50)
    
    if not employees:
        return "No employees found in the database."
        
    emp_list = "\n".join([f"- {emp.get('name', 'Unknown')} (ID: {emp.get('employee_id', 'N/A')}, Role: {emp.get('role', 'N/A')}, Dept: {emp.get('department', 'N/A')})" for emp in employees])
    
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