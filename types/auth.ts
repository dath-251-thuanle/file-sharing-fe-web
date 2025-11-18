export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface TotpSetupResponse {
  qrCodeUrl: string;
  secretKey: string;
}
