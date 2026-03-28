import { PaginationResponse } from '@features/queries/models';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface InvitationResponse {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: InvitationStatus;
  invited_by: {
    id: string;
    display_name: string;
  };
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface InvitationListResponse {
  invitations: InvitationResponse[];
  pagination: PaginationResponse;
}

export interface UserListResponse {
  users: import('@core/models').User[];
  pagination: PaginationResponse;
}
