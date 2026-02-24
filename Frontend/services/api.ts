import axios from 'axios';

// Use localhost for testing! Change to Render URL ONLY when you deploy for the final hackathon presentation.
const API_URL = "http://localhost:8000"; 
// const API_URL = "https://innovix-hr-agent.onrender.com"; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sendMessageToBackend = async (userMessage: string, employeeId: string = "emp_001") => {
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