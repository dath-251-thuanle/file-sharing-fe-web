import { adminClient } from "@/lib/api/client";

export interface SystemPolicy {
  id: number;
  maxFileSizeMB: number;
  minValidityHours: number;
  maxValidityDays: number;
  defaultValidityDays: number;
  requirePasswordMinLength: number;
}

export interface SystemPolicyUpdate {
  maxFileSizeMB?: number;
  minValidityHours?: number;
  maxValidityDays?: number;
  defaultValidityDays?: number;
  requirePasswordMinLength?: number;
}

export interface UpdatePolicyResponse {
  message: string;
  policy: SystemPolicy;
}

export interface CleanupResponse {
  message: string;
  deletedFiles: number;
  timestamp: string;
}

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