import { authClient, adminClient } from "./client";
import { LoginRequest, LoginResponse, RegisterRequest, RegisterSuccessResponse, TotpSetupResponse, TotpVerifyRequest, TotpVerifyResponse, TotpLoginRequest, LoginSuccessResponse } from "../components/schemas";

export const authApi = {
  login: (payload: LoginRequest) =>
    authClient.post<LoginResponse>("/auth/login", payload),
  register: (payload: RegisterRequest) =>
    authClient.post<RegisterSuccessResponse>("/auth/register", payload),
  setupTotp: () => adminClient.post<TotpSetupResponse>("/auth/totp/setup", {}),
  verifyTotp: (payload: TotpVerifyRequest) =>
    adminClient.post<TotpVerifyResponse>("/auth/totp/verify", payload),
  loginTotp: (payload: TotpLoginRequest) =>
    authClient.post<LoginSuccessResponse>("/auth/login/totp", payload),
};