export interface TransparencyLog {
  query_id: string;
  plan_id: string;
  execution_started_at: string;
  execution_completed_at: string;
  total_duration_ms: number;
  total_tool_invocations: number;
  total_external_api_calls: number;
  execution_status: 'completed' | 'partial' | 'failed';
  entries: TransparencyLogEntry[];
}

export interface TransparencyLogEntry {
  entry_id: string;
  step_id: string;
  invocation_id: string;
  tool_name: string;
  integration_id: string;
  parameters: Record<string, unknown>;
  credential_mode: 'broker' | 'direct';
  status: 'success' | 'error' | 'partial';
  error_code?: string;
  error_message?: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  external_api_calls: number;
  data_hash?: string;
  is_retry: boolean;
  retry_of?: string;
}
