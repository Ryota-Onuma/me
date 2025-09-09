"use client";

import { usePermissionRequests } from "@/hooks/usePermissionRequests";
import { PermissionRequestDialog } from "./PermissionRequestDialog";

export function GlobalPermissionRequestDialog() {
  const { currentRequest, respondToRequest, removeRequest } =
    usePermissionRequests();

  const handleClose = () => {
    if (currentRequest) {
      // Remove the current request when user closes the dialog
      // This allows them to dismiss the request without making a decision
      removeRequest(currentRequest.id);
    }
  };

  return (
    <PermissionRequestDialog
      request={currentRequest}
      isOpen={currentRequest !== null}
      onResponse={respondToRequest}
      onClose={handleClose}
    />
  );
}
