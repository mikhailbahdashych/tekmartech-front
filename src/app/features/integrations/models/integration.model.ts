import { PaginationResponse } from '../../queries/models';

export type IntegrationType = 'aws' | 'google_workspace' | 'github';
export type IntegrationStatus = 'active' | 'inactive' | 'error';
export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface IntegrationResponse {
  id: string;
  type: IntegrationType;
  display_name: string;
  status: IntegrationStatus;
  connected_by: {
    id: string;
    display_name: string;
  };
  last_health_check_at: string | null;
  last_health_check_status: HealthStatus | null;
  created_at: string;
}

export interface IntegrationListResponse {
  integrations: IntegrationResponse[];
  pagination: PaginationResponse;
}

export interface AwsCredentials {
  access_key_id: string;
  secret_access_key: string;
  region: string;
}

export interface GoogleWorkspaceCredentials {
  service_account_json: string;
  delegated_email?: string;
}

export interface GitHubCredentials {
  personal_access_token: string;
  organization: string;
}

export type IntegrationCredentials = AwsCredentials | GoogleWorkspaceCredentials | GitHubCredentials;

export interface ConnectIntegrationPayload {
  type: IntegrationType;
  display_name: string;
  credentials: IntegrationCredentials;
}
