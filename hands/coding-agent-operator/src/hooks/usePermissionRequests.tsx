"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  PermissionRequest,
  PermissionResponse,
} from "@/lib/types/permission";

type PermissionRequestContextType = {
  currentRequest: PermissionRequest | null;
  pendingRequests: PermissionRequest[];
  addRequest: (request: PermissionRequest) => void;
  removeRequest: (requestId: string) => void;
  respondToRequest: (response: PermissionResponse) => void;
  clearAllRequests: () => void;
};

const PermissionRequestContext = createContext<
  PermissionRequestContextType | undefined
>(undefined);

export function PermissionRequestProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [pendingRequests, setPendingRequests] = useState<PermissionRequest[]>(
    [],
  );
  const [currentRequest, setCurrentRequest] =
    useState<PermissionRequest | null>(null);

  const addRequest = useCallback((request: PermissionRequest) => {
    setPendingRequests((prev) => [...prev, request]);

    // If no request is currently being shown, show this one
    setCurrentRequest((currentReq) => currentReq || request);
  }, []);

  // Listen to SSE events for permission requests
  useEffect(() => {
    const eventSource = new EventSource("/api/events/state_changes");

    eventSource.addEventListener("permission_request", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.data) {
          // Convert timestamp string back to Date object
          const request: PermissionRequest = {
            ...data.data,
            timestamp: new Date(data.data.timestamp),
          };
          addRequest(request);
        }
      } catch (error) {
        console.error("Failed to parse permission request:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, [addRequest]);

  const removeRequest = (requestId: string) => {
    setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));

    // If the removed request was the current one, show the next one
    if (currentRequest?.id === requestId) {
      const remaining = pendingRequests.filter((req) => req.id !== requestId);
      setCurrentRequest(remaining.length > 0 ? remaining[0] || null : null);
    }
  };

  const respondToRequest = async (response: PermissionResponse) => {
    try {
      // Send response to backend
      await fetch("/api/permissions/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(response),
      });

      // Remove the request from pending
      removeRequest(response.requestId);
    } catch (error) {
      console.error("Failed to send permission response:", error);
    }
  };

  const clearAllRequests = () => {
    setPendingRequests([]);
    setCurrentRequest(null);
  };

  const value: PermissionRequestContextType = {
    currentRequest,
    pendingRequests,
    addRequest,
    removeRequest,
    respondToRequest,
    clearAllRequests,
  };

  return (
    <PermissionRequestContext.Provider value={value}>
      {children}
    </PermissionRequestContext.Provider>
  );
}

export function usePermissionRequests() {
  const context = useContext(PermissionRequestContext);
  if (context === undefined) {
    throw new Error(
      "usePermissionRequests must be used within a PermissionRequestProvider",
    );
  }
  return context;
}
