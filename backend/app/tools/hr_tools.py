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
async def check_google_calendar_for_leaves(employee_id: str, target_month_num: int, target_year: int = datetime.now().year) -> str:
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
async def apply_for_leave(employee_id_or_name: str, start_date: str, end_date: str, reason: str, leave_type: str, days: int, policy_citation: str) -> str:
    """
    Submits a leave request. 
    CRITICAL: You MUST use the 'search_policy' tool first to determine if this leave complies. 
    You must provide a brief 'policy_citation' explaining exactly why this request is approved or denied based on the document.
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
        "policy_citation": policy_citation,
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
async def onboard_employee(new_hire_name: str, new_hire_email: str, role: str, department: str, bank_account: str, emergency_contact: str) -> str:
    """
    Onboards a new hire. MUST include their personal email address so IT can contact them!
    """
    print(f"🛠️ TOOL CALLED: Orchestrating Onboarding for {new_hire_name}")
    
    count = await db.employees.count_documents({})
    new_id = f"emp_{count + 100}" 
    
    # 1. Create Core HRIS Record
    await db.employees.insert_one({
        "employee_id": new_id, "name": new_hire_name, "email": new_hire_email, "role": role, 
        "department": department, "bank_account": bank_account, "emergency_contact": emergency_contact,
        "casual_leaves_left": 12, "sick_leaves_left": 10, "status": "Active"
    })
    
    # 2. Create Real LMS Tracking Checklist for Frontend
    lms_tasks = [
        {"task_id": 1, "task": "Complete Security & Phishing 101", "completed": False},
        {"task_id": 2, "task": "Read and Acknowledge HR Handbook", "completed": False},
        {"task_id": 3, "task": f"Complete {department} Specific Training", "completed": False}
    ]
    await db.lms_tracking.insert_one({"emp_id": new_id, "checklist": lms_tasks})
    
    # 3. Send physical trigger email to IT
    it_email = os.getenv("IT_EMAIL", "it@innvoix.com") # Add this to your .env or just use your own email to test
    it_body = f"URGENT: New hire {new_hire_name} ({new_id}) starts soon in {department}. Please provision a laptop and standard access. Contact them at: {new_hire_email}"
    send_standard_email(it_email, f"IT Action Required: Provision {new_hire_name}", it_body)
    
    # 4. Send Welcome Packet to New Hire
    welcome_body = f"Welcome to Innovix, {new_hire_name}! Your employee ID is {new_id}. Please log in to your dashboard to complete your 3 assigned learning modules. Your Company website link is https://hr-innovix-agent.vercel.app/. If you have any questions, feel free to reach out to HR or IT. We're excited to have you on board!🎉"
    send_standard_email(new_hire_email, "Welcome to Innovix!", welcome_body)
    
    await log_audit_action("ONBOARD", f"Onboarded {new_hire_name} ({new_id}). LMS tasks assigned, IT notified.")
    
    return f"SUCCESS: Onboarding complete. HRIS updated, 3 LMS tracking tasks generated, welcome email sent to {new_hire_email}, and IT department notified for laptop provisioning."

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
async def draft_policy_update(policy_title: str, new_rules: str, affected_department: str) -> str:
    """
    Drafts a policy and physically emails the affected department.
    Input 'affected_department' should be a specific department or 'All'.
    """
    print(f"🛠️ TOOL CALLED: Drafting policy and notifying '{affected_department}'")
    
    # 1. Save the draft
    await db.policy_drafts.insert_one({
        "title": policy_title, 
        "content": new_rules,
        "target_audience": affected_department,
        "created_at": datetime.utcnow()
    })
    
    # 2. Find the real employees affected by this change
    query = {} if affected_department.lower() == "all" else {"department": {"$regex": affected_department, "$options": "i"}}
    cursor = db.employees.find(query)
    affected_employees = await cursor.to_list(length=100)
    
    # 3. Send physical emails to the affected staff
    notified_count = 0
    for emp in affected_employees:
        emp_email = emp.get("email")
        if emp_email:
            body = f"Hello {emp['name']},\n\nA new policy draft titled '{policy_title}' has been proposed that affects your department. Please review the new rules on your HR Dashboard.\n\nSummary:\n{new_rules}"
            send_standard_email(emp_email, f"Policy Update Notice: {policy_title}", body)
            notified_count += 1
            
    return f"SUCCESS: Draft for '{policy_title}' saved. Physically emailed {notified_count} employees in the {affected_department} department."

def send_standard_email(to_email: str, subject: str, body: str):
    """A generic email sender for real cross-system notifications."""
    sender_email = os.getenv("SENDER_EMAIL") 
    sender_password = os.getenv("SENDER_PASSWORD")
    
    if not sender_email or not sender_password:
        print("⚠️ Email credentials not set. Skipping real email.")
        return

    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")


@tool
async def invite_new_hire(name: str, email: str, temp_password: str) -> str:
    """
    For HR Admin use ONLY. 
    Creates a new employee login account and sets their onboarding status to Pending.
    """
    print(f"🛠️ TOOL CALLED: Inviting new hire {name} to the portal")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        return f"Error: An account with email {email} already exists."
        
    new_user = {
        "name": name,
        "email": email,
        "password": temp_password,  # In production, this would be hashed!
        "role": "employee",
        "department": "Unassigned",
        "onboarding_status": "Pending",
        "casual_leaves_left": 0,
        "sick_leaves_left": 0
    }
    
    result = await db.users.insert_one(new_user)
    new_user_id = str(result.inserted_id)
    
    # Send an email to the new hire with their login details
    welcome_body = (
        f"Welcome to Innvoix, {name}!\n\n"
        f"Your HR onboarding portal is ready. Please log in to chat with our AI Assistant to complete your setup.\n\n"
        f"Portal: https://innvoix-hr.com/login\n"
        f"Email: {email}\n"
        f"Password: {temp_password}\n\n"
        f"Please log in as soon as possible."
    )
    send_standard_email(email, "Your Innvoix Onboarding Credentials", welcome_body)
    
    return f"SUCCESS: Account created for {name}. They have been emailed their login credentials. Their status is currently 'Pending'."

@tool
async def complete_onboarding_profile(employee_id: str, phone_number: str, home_address: str, bank_account: str, emergency_contact: str) -> str:
    """
    For Employee use.
    Saves the employee's final onboarding details and marks their status as Completed.
    """
    print(f"🛠️ TOOL CALLED: Completing onboarding for ID {employee_id}")
    
    from bson import ObjectId
    
    # Update the user collection with ALL the new details
    await db.users.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": {
            "phone_number": phone_number,
            "home_address": home_address,
            "bank_account": bank_account,
            "emergency_contact": emergency_contact,
            "onboarding_status": "Completed",
            "casual_leaves_left": 12, # Grant standard leaves upon completion
            "sick_leaves_left": 10
        }}
    )
    
    # Fetch user to get their name for the HR email
    user = await db.users.find_one({"_id": ObjectId(employee_id)})
    emp_name = user.get("name", "Unknown Employee")
    
    # Alert HR
    hr_email = os.getenv("HR_EMAIL", "hr@innvoix.com")
    hr_body = f"Good news! New hire {emp_name} has successfully completed their AI onboarding chat and provided all required details (Phone, Address, Bank, Emergency Contact)."
    send_standard_email(hr_email, f"Onboarding Completed: {emp_name}", hr_body)
    
    return "SUCCESS: Your profile has been updated, your leaves have been granted, and HR has been notified. Welcome to the team!"
