import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { useWorkforceData } from "./WorkforceContext.jsx";
import { chatWithAI } from "@/services/api";

// AI Context for managing chat state across the app
const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const { employees: centralEmployees, getOverallRisk } = useWorkforceData();

  // Comprehensive Workforce Data Engine - Derived from Central Data
  const workforceData = useMemo(() => {
    const data = {};
    if (!centralEmployees) return data;
    
    centralEmployees.forEach(e => {
      data[e.name] = {
        id: e.id,
        role: e.position,
        department: e.department,
        fitment: e.scores.fitment,
        fatigue: e.scores.fatigue,
        softSkills: {
          leadership: e.scores.performance > 80 ? 85 : 65,
          communication: 80,
          teamwork: 80 
        },
        sixBySix: {
          fatigue: e.scores.fatigue > 75 ? "Critical" : e.scores.fatigue > 45 ? "Medium" : "Low",
          productivity: e.scores.productivity > 75 ? "Strong" : "Stable",
          engagement: "High"
        },
        risk: getOverallRisk(e),
        recommendations: [
          e.scores.fatigue > 75 ? "Reduce workload by 20%" : "Continue current path",
          e.scores.fitment < 70 ? "Target for reskilling" : "Mentor others",
        ],
        skills: [...(e.skills?.hard || []), ...(e.skills?.soft || [])],
        utilization: e.scores.utilization,
        lastReview: "2024-03-01"
      };
    });
    return data;
  }, [centralEmployees, getOverallRisk]);

  // Enhanced AI message processing with backend integration
  const sendMessage = async (message, mode = 'workforce') => {
    setIsLoading(true);
    console.log(`Sending AI message in mode: ${mode}`);

    try {
      const response = await chatWithAI(message, mode);
      const aiReply = response.data.data.reply;

      // Extract employee mentions for UI cards
      const employeeNames = Object.keys(workforceData);
      const mentionedEmployees = employeeNames.filter(name =>
        message.toLowerCase().includes(name.toLowerCase()) || 
        aiReply.toLowerCase().includes(name.toLowerCase())
      );

      const detectedEmployees = mentionedEmployees.map(name => ({
        name,
        ...workforceData[name]
      }));

      const newMessage = {
        id: Date.now(),
        type: "ai",
        content: aiReply,
        timestamp: new Date(),
        detectedEmployees: detectedEmployees,
        queryType: detectedEmployees.length > 0 ? "employee_profile" : "general"
      };

      setMessages(prev => [...prev, newMessage]);
      setChatHistory(prev => [...prev, { userMessage: message, aiResponse: newMessage }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      const errorMessage = {
        id: Date.now(),
        type: "ai",
        content: "I'm sorry, I'm having trouble connecting to the intelligence engine right now. Please ensure the backend is running and your API key is valid.",
        timestamp: new Date(),
        detectedEmployees: [],
        queryType: "error"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const value = {
    messages,
    setMessages,
    isLoading,
    chatHistory,
    sendMessage,
    clearChat,
    workforceData
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};