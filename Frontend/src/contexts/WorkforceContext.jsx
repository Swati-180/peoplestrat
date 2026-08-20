import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";

const WorkforceContext = createContext(null);

export function WorkforceProvider({ children }) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/employees')
        .then(response => {
          const data = response.data?.success ? response.data.data : (Array.isArray(response.data) ? response.data : []);
          // Format strict backend models to adapt to frontend UI specs
          const formatted = data.map(emp => ({
            id: emp._id || emp.id,
            employeeId: emp.employeeId || (emp._id ? `EMP-${emp._id.substring(emp._id.length - 4)}` : 'UNK'),
            name: emp.name || emp.userId?.username || 'Unknown',
            email: emp.email || emp.userId?.email || '',
            department: emp.department || 'Unassigned',
            position: emp.recommendedRole || emp.position || 'Pending',
            skills: {
              hard: emp.skills || [],
              soft: []
            },
            scores: {
              fitment: emp.fitmentScore || 0,
              performance: emp.performance === 'High' ? 90 : emp.performance === 'Average' ? 70 : 40,
              productivity: emp.productivity || 0,
              fatigue: emp.fatigueScore || 0,
              utilization: emp.utilization || 0
            }
          }));
          setEmployees(formatted);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load workforce", err);
          setEmployees([]);
          setIsLoading(false);
        });

    } else {
      setEmployees([]);
      setIsLoading(false);
    }
  }, [user]);

  // Expose the helper functions globally
  const getOverallRisk = (emp) => {
    if (!emp) return "Low";
    if (emp.scores.fatigue > 75) return "High";
    if (emp.scores.fitment < 50) return "High";
    return "Low";
  };

  const getFitmentBand = (score) => {
    if (score >= 80) return "Optimal";
    if (score >= 60) return "Stable";
    return "At-Risk";
  };

  const getFatigueRisk = (score) => {
    if (score > 75) return "Critical";
    if (score > 50) return "Elevated";
    return "Normal";
  };

  return (
    <WorkforceContext.Provider value={{ employees, isLoading, getOverallRisk, getFitmentBand, getFatigueRisk }}>
      {children}
    </WorkforceContext.Provider>
  );
}

export function useWorkforceData() {
  return useContext(WorkforceContext);
}
