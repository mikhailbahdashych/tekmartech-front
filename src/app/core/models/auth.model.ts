import { User } from './user.model';
import { Organization } from './organization.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  organization_name: string;
  email: string;
  password: string;
  display_name: string;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  access_token: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
  display_name: string;
}
