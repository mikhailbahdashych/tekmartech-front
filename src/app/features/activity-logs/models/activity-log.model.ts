import { PaginationResponse } from '@features/queries/models';

export type ActivityAction =
  | 'user_registered'
  | 'user_login'
  | 'user_invited'
  | 'user_removed'
  | 'user_role_changed'
  | 'integration_connected'
  | 'integration_disconnected'
  | 'integration_health_checked'
  | 'query_submitted'
  | 'query_plan_approved'
  | 'query_plan_rejected'
  | 'organization_updated';

export type TargetType = 'user' | 'integration' | 'query' | 'organization';

export interface ActivityLogResponse {
  id: string;
  user: {
    id: string;
    display_name: string;
    email: string;
  };
  action: ActivityAction;
  target_type: TargetType | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityLogListResponse {
  activity_logs: ActivityLogResponse[];
  pagination: PaginationResponse;
}
