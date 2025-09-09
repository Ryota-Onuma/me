import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PermissionService } from "@/server/service/permission/PermissionService";

const PermissionResponseSchema = z.object({
  requestId: z.string(),
  decision: z.enum(["allow", "deny"]),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, decision, reason } =
      PermissionResponseSchema.parse(body);

    const permissionService = PermissionService.getInstance();
    permissionService.respondToPermissionRequest(requestId, decision, reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing permission response:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
