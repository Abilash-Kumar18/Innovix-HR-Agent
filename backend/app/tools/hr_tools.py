from langchain_core.tools import tool

# --- MOCK DATABASES FOR HACKATHON ---
MOCK_DB = {
    "emp_001": {"name": "Abilash", "role": "Software Engineer", "casual_leaves_left": 8, "sick_leaves_left": 5},
    "emp_002": {"name": "Dharani", "role": "Frontend Developer", "casual_leaves_left": 10, "sick_leaves_left": 4}
}

LEAVE_REQUESTS = []
HR_TICKETS = []  # New database for tickets

MOCK_HOLIDAYS = [
    {"date": "2026-05-01", "name": "May Day"},
    {"date": "2026-08-15", "name": "Independence Day"},
    {"date": "2026-10-02", "name": "Gandhi Jayanti"},
    {"date": "2026-10-14", "name": "Ayudha Pooja"},
    {"date": "2026-11-08", "name": "Diwali"}
]

# --- EXISTING TOOLS ---
@tool
def get_employee_details(employee_id: str) -> str:
    """Useful to find an employee's leave balance, role, or personal details. Input is the employee ID."""
    print(f"🛠️ TOOL CALLED: Fetching details for {employee_id}")
    emp = MOCK_DB.get(employee_id.lower())
    if emp:
        return f"Name: {emp['name']}, Role: {emp['role']}, Casual Leaves Left: {emp['casual_leaves_left']}, Sick Leaves Left: {emp['sick_leaves_left']}"
    return "Employee not found in the system."

@tool
def apply_for_leave(employee_id: str, leave_type: str, days: int) -> str:
    """Useful to apply for leave. Input must be the employee_id, leave_type ('casual' or 'sick'), and days."""
    print(f"🛠️ TOOL CALLED: Applying {days} days of {leave_type} leave for {employee_id}")
    emp = MOCK_DB.get(employee_id.lower())
    if not emp: return "Cannot apply: Employee ID not found."
    
    balance_key = f"{leave_type.lower()}_leaves_left"
    if balance_key not in emp: return "Invalid leave type. Must be 'casual' or 'sick'."
        
    if emp[balance_key] >= int(days):
        emp[balance_key] -= int(days)
        LEAVE_REQUESTS.append({"emp_id": employee_id, "type": leave_type, "days": days, "status": "Pending HR Approval"})
        return f"SUCCESS: {days} days of {leave_type} leave applied. Remaining balance: {emp[balance_key]}."
    else:
        return f"DENIED: Only {emp[balance_key]} {leave_type} leaves left."

# --- NEW TOOLS ---
@tool
def get_upcoming_holidays() -> str:
    """Useful to find out the upcoming official company holidays and festival days off."""
    print("🛠️ TOOL CALLED: Fetching company holidays")
    holidays_str = "\n".join([f"- {h['name']} ({h['date']})" for h in MOCK_HOLIDAYS])
    return f"Here are the upcoming company holidays:\n{holidays_str}"

@tool
def raise_hr_ticket(employee_id: str, issue_category: str, description: str) -> str:
    """
    Useful for raising an HR, IT, or Payroll support ticket. 
    Inputs: employee_id, issue_category (e.g., 'IT', 'Payroll', 'HR'), and a brief description.
    """
    print(f"🛠️ TOOL CALLED: Raising {issue_category} ticket for {employee_id}")
    ticket_id = f"TKT-{len(HR_TICKETS) + 101}"
    
    HR_TICKETS.append({
        "ticket_id": ticket_id,
        "emp_id": employee_id,
        "category": issue_category,
        "issue": description,
        "status": "Open"
    })
    
    return f"SUCCESS: Ticket {ticket_id} has been raised for the {issue_category} department regarding: '{description}'. The team will contact you soon."
# Add these new mock databases at the top of hr_tools.py
PENDING_APPROVALS = []
POLICY_DRAFTS = []

@tool
def onboard_employee(new_hire_name: str, role: str, department: str) -> str:
    """
    Useful for HR to start the onboarding workflow for a new hire.
    Inputs: new_hire_name, role, and department.
    """
    print(f"🛠️ TOOL CALLED: Onboarding {new_hire_name} into {department}")
    new_id = f"emp_00{len(MOCK_DB) + 1}"
    
    # 1. Create HR Record
    MOCK_DB[new_id] = {
        "name": new_hire_name, 
        "role": role, 
        "casual_leaves_left": 12, # Default
        "sick_leaves_left": 10
    }
    
    # 2. Generate Automated Checklist & IT Provisioning
    return (
        f"SUCCESS: Onboarding initiated for {new_hire_name} (ID: {new_id}).\n"
        f"Workflow Executed:\n"
        f"- HRIS Record Created.\n"
        f"- IT Ticket raised for Laptop & Software Access.\n"
        f"- Automated Welcome Email & Policy Checklist queued for delivery."
    )

@tool
def prepare_sensitive_transaction(employee_id: str, action_type: str, details: str) -> str:
    """
    CRITICAL: Must be used for sensitive actions like 'salary_change', 'termination', or 'promotion'.
    This tool DOES NOT execute the action. It prepares it for Human HR approval.
    """
    print(f"🛠️ TOOL CALLED: Guardrail triggered for {action_type} on {employee_id}")
    
    transaction_id = f"TRX-{len(PENDING_APPROVALS) + 1000}"
    PENDING_APPROVALS.append({
        "trx_id": transaction_id,
        "emp_id": employee_id,
        "action": action_type,
        "details": details,
        "status": "AWAITING_HUMAN_APPROVAL"
    })
    
    return f"GUARDRAIL ACTIVE: The {action_type} transaction for {employee_id} has been drafted (ID: {transaction_id}). It is currently locked and awaiting final Human HR approval. No systems have been updated yet."

@tool
def draft_policy_update(policy_title: str, new_rules: str) -> str:
    """
    Useful when an HR Manager wants to draft or update a company policy.
    Inputs: policy_title and the new_rules.
    """
    print(f"🛠️ TOOL CALLED: Drafting policy - {policy_title}")
    POLICY_DRAFTS.append({"title": policy_title, "content": new_rules})
    
    return f"SUCCESS: Draft for '{policy_title}' has been saved to the policy repository. Would you like me to identify which employees will be affected by this change so we can orchestrate a notification?"