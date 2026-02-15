from langchain_core.tools import tool

# Mock Database for the Hackathon
MOCK_DB = {
    "emp_001": {"name": "Abilash", "role": "Software Engineer", "casual_leaves_left": 8, "sick_leaves_left": 5},
    "emp_002": {"name": "Dharani", "role": "Frontend Developer", "casual_leaves_left": 10, "sick_leaves_left": 4}
}

# Keep track of submitted requests
LEAVE_REQUESTS = []

@tool
def get_employee_details(employee_id: str) -> str:
    """
    Useful when you need to find an employee's leave balance, role, or personal details.
    Input should be the employee ID (e.g., 'emp_001').
    """
    print(f"🛠️ TOOL CALLED: Fetching details for {employee_id}")
    emp = MOCK_DB.get(employee_id.lower())
    if emp:
        return f"Name: {emp['name']}, Role: {emp['role']}, Casual Leaves Left: {emp['casual_leaves_left']}, Sick Leaves Left: {emp['sick_leaves_left']}"
    return "Employee not found in the system."

@tool
def apply_for_leave(employee_id: str, leave_type: str, days: int) -> str:
    """
    Useful to apply for leave on behalf of an employee.
    Input must be the employee_id, the leave_type ('casual' or 'sick'), and the number of days.
    """
    print(f"🛠️ TOOL CALLED: Applying {days} days of {leave_type} leave for {employee_id}")
    emp = MOCK_DB.get(employee_id.lower())
    
    if not emp:
        return "Cannot apply: Employee ID not found."
    
    # Check if they have enough balance
    balance_key = f"{leave_type.lower()}_leaves_left"
    if balance_key not in emp:
        return f"Invalid leave type. Must be 'casual' or 'sick'."
        
    if emp[balance_key] >= int(days):
        # Deduct the balance
        emp[balance_key] -= int(days)
        # Record the request
        LEAVE_REQUESTS.append({"emp_id": employee_id, "type": leave_type, "days": days, "status": "Pending HR Approval"})
        return f"SUCCESS: {days} days of {leave_type} leave applied for {emp['name']}. Remaining {leave_type} balance: {emp[balance_key]}."
    else:
        return f"DENIED: {emp['name']} only has {emp[balance_key]} {leave_type} leaves left, but tried to apply for {days}."