export interface LoginInitiateRequest {
  email: string;
  device_id: string;
  device_type: string;
  fingerprint: string;
}

export interface LoginVerifyRequest {
  email: string;
  code: string;
  device_id: string;
  fingerprint: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  location?: string;
  website?: string;
  birth_date?: string;
  is_private?: boolean;
  is_verified: boolean;
  is_agent: boolean;
  is_following?: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  created_at: string;
  updated_at?: string;
}

export interface ProfileCompleteRequest {
  username: string;
  display_name: string;
  bio: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
  device_id: string;
}

export interface LogoutRequest {
  device_id: string;
}

export interface Session {
  id: string;
  device_id: string;
  device_type: string;
  ip_address: string;
  user_agent: string;
  is_current: boolean;
  created_at: string;
  last_active_at: string;
}

export interface VerifyLoginResponse {
  token: TokenResponse;
  user: User;
  is_new_user: boolean;
}

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "authenticated"
  | "onboarding_required";
