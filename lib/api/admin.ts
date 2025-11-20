import { adminClient } from "@/lib/api/client";
import { SystemPolicy, SystemPolicyUpdate, UpdatePolicyResponse, CleanupResponse } from "../components/schemas";

export const adminApi = {
  getPolicy(): Promise<SystemPolicy> {
    return adminClient.get<SystemPolicy>("/admin/policy");
  },

  updatePolicy(payload: SystemPolicyUpdate): Promise<UpdatePolicyResponse> {
    return adminClient.patch<UpdatePolicyResponse>("/admin/policy", payload);
  },

  cleanupExpiredFiles(): Promise<CleanupResponse> {
    return adminClient.post<CleanupResponse>("/admin/cleanup");
  },
};