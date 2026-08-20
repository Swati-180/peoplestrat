import { QueryClient } from "@tanstack/react-query";

// Utility to throw API errors with readable messages
async function throwIfResNotOk(res) {
  if (!res.ok) {
    let text = "";
    try {
      text = (await res.text()) || res.statusText;
    } catch {
      text = res.statusText;
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

// Main API request wrapper
export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("auth_token");

  const headers = {
    ...(options.headers || {}),
  };

  // Automatically set JSON header when body is a string
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  return res;
}

// Query client fetch wrapper
export const getQueryFn = ({ on401 }) => {
  return async ({ queryKey }) => {
    const token = localStorage.getItem("auth_token");
    const headers = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Convert queryKey into a URL safely
    const url =
      typeof queryKey === "string"
        ? queryKey
        : Array.isArray(queryKey)
        ? queryKey.join("/")
        : String(queryKey);

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);

    return await res.json();
  };
};

// Create React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
