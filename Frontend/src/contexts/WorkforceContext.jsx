import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/contexts/OrganizationContext";

const WorkforceContext = createContext(null);

export function WorkforceProvider({ children }) {
  const { user } = useAuth();
  const { activeOrganizationId, isLoading: orgLoading } = useOrganization();
  const [employees, setEmployees] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const latestRequestRef = useRef(null);

  const fetchEmployees = () => {
    if (user && activeOrganizationId) {
      const reqOrgId = activeOrganizationId;
      latestRequestRef.current = reqOrgId;
      
      setEmployees([]);
      setIsLoading(true);
      api.get('/employees?limit=all')
        .then(response => {
          if (latestRequestRef.current !== reqOrgId) {
            console.warn('Discarding stale workforce response due to organization switch.');
            return;
          }

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
          if (latestRequestRef.current !== reqOrgId) return;
          console.error("Failed to load workforce", err);
          setEmployees([]);
          setIsLoading(false);
        });

    } else if (!orgLoading) {
      setEmployees([]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user, activeOrganizationId, orgLoading]);

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
    <WorkforceContext.Provider value={{ employees, isLoading, getOverallRisk, getFitmentBand, getFatigueRisk, fetchEmployees }}>
      {children}
    </WorkforceContext.Provider>
  );
}

export function useWorkforceData() {
  return useContext(WorkforceContext);
}
