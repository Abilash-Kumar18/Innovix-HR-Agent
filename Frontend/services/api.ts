import axios from 'axios';

// 1. Point to your Backend
// ⚠️ CRITICAL UPDATE: We switched this to Localhost.
// Why? Your new Login code exists on your Laptop, but NOT on Render yet.
// If you use the Render link, it will say "404 Not Found" for the new login features.
const API_URL = "http://127.0.0.1:8000"; 

// Keep the Render link here for later (commented out)
// const API_URL = "https://innovix-hr-agent.onrender.com"; 

// Create a configured axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Chat Function - Links Frontend to Python Agent
export const sendMessageToBackend = async (userMessage: string, employeeId: string = "emp_001") => {
  try {
    console.log("📡 Sending to backend:", userMessage);
    
    // This calls the @app.post("/chat") endpoint in main.py
    const response = await api.post('/chat', {
      message: userMessage,
      employee_id: employeeId
    });

    console.log("✅ Backend replied:", response.data.response);
    return response.data.response;

  } catch (error) {
    console.error("❌ Connection Error:", error);
    return "Error: Could not connect to the HR Brain. Make sure the backend terminal is running!";
  }
};

// 3. Dashboard Data Fetching (For your tables)
export const fetchEmployees = async () => (await api.get('/api/employees')).data;
export const fetchTickets = async () => (await api.get('/api/tickets')).data;
export const fetchLeaves = async () => (await api.get('/api/leaves')).data;
export const fetchApprovals = async () => (await api.get('/api/approvals')).data;