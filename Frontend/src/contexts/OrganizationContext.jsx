import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchMyOrganizations, setApiOrganizationId } from "@/services/api";
import { useAuth } from "@/lib/auth";

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const { user } = useAuth();
  
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganization, setActiveOrganization] = useState(null);
  const [activeOrganizationId, setActiveOrganizationId] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrganizations = async () => {
      if (!user) {
        setOrganizations([]);
        setActiveOrganization(null);
        setActiveOrganizationId(null);
        setActiveRole(null);
        setApiOrganizationId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchMyOrganizations();
        const memberships = response.data?.success ? response.data.data : response.data || [];
        
        if (isMounted) {
          setOrganizations(memberships);

          if (memberships.length > 0) {
            const savedOrgId = localStorage.getItem("saved_org_id");
            let selectedMembership = memberships.find(m => m.organizationId?._id === savedOrgId);

            if (!selectedMembership) {
              selectedMembership = memberships[0];
            }

            const orgId = selectedMembership.organizationId?._id;
            setActiveOrganization(selectedMembership.organizationId);
            setActiveOrganizationId(orgId);
            setActiveRole(selectedMembership.role);
            
            // Persist valid selection
            localStorage.setItem("saved_org_id", orgId);
            
            // Update Axios interceptor
            setApiOrganizationId(orgId);
          } else {
            setActiveOrganization(null);
            setActiveOrganizationId(null);
            setActiveRole(null);
            setApiOrganizationId(null);
          }
        }
      } catch (err) {
        console.error("Failed to load organizations:", err);
        if (isMounted) {
          setError(err.response?.data?.message || err.message || "Failed to load organizations");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSetActiveOrganization = (orgId) => {
    const membership = organizations.find(m => m.organizationId?._id === orgId);
    if (membership) {
      setActiveOrganization(membership.organizationId);
      setActiveOrganizationId(orgId);
      setActiveRole(membership.role);
      localStorage.setItem("saved_org_id", orgId);
      setApiOrganizationId(orgId);
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrganization,
        activeOrganizationId,
        activeRole,
        isLoading,
        error,
        setActiveOrganization: handleSetActiveOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
