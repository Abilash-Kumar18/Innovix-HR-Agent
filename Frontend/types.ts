
export enum UserRole {
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE'
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Remote';
  department: string;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
