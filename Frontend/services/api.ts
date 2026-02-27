import axios from 'axios';

// IMPORTANT: Keep this as localhost while testing on your machine!
const API_URL = "https://innovix-hr-agent.onrender.com"; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- AI AGENT ---
export const sendMessageToBackend = async (userMessage: string, employeeId: string) => {
  try {
    const response = await api.post('/chat', {
      message: userMessage,
      employee_id: employeeId
    });
    return response.data.response;
  } catch (error) {
    console.error("❌ Connection Error:", error);
    return "Error: Could not connect to the HR Brain. Make sure the backend terminal is running!";
  }
};

// --- DATABASE CALLS ---
export const fetchUserProfile = async (id: string) => {
  const res = await api.get(`/api/users/${id}`);
  return res.data;
};

export const fetchAllEmployees = async () => {
  const res = await api.get('/api/employees');
  return res.data;
};

export const fetchTickets = async () => {
  const res = await api.get('/api/tickets');
  return res.data;
};

export const createTicket = async (data: any) => {
  const res = await api.post('/api/tickets', data);
  return res.data;
};

export const updateTicketStatus = async (id: string, status: string) => {
  const res = await api.put(`/api/tickets/${id}`, { status });
  return res.data;
};
