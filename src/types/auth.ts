export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  googleAccessToken?: string;
}

export interface AuthSession {
  user: User;
  expires: string;
}

export interface ComposioAuthConfig {
  apiKey: string;
  authConfigId: string;
}
