import { QueryPlan } from './query-plan.model';
import { ResultData } from './result-data.model';
import { TransparencyLog } from './transparency-log.model';

export type QueryStatus =
  | 'interpreting'
  | 'awaiting_approval'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface QueryInitiator {
  id: string;
  display_name: string;
}

export interface QueryResponse {
  id: string;
  query_text: string;
  status: QueryStatus;
  plan_summary: string | null;
  result_summary: string | null;
  error_message: string | null;
  initiated_by: QueryInitiator;
  integration_ids: string[];
  submitted_at: string;
  completed_at: string | null;
}

export interface QueryErrorDetails {
  stage: string;
  error_code: string;
  context: Record<string, unknown>;
}

export interface QueryDetailResponse extends QueryResponse {
  query_plan: QueryPlan | null;
  result_data: ResultData | null;
  transparency_log: TransparencyLog | null;
  error_details: QueryErrorDetails | null;
  plan_generated_at: string | null;
  approved_at: string | null;
  execution_started_at: string | null;
}

export interface PaginationResponse {
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
}

export interface QueryListResponse {
  queries: QueryResponse[];
  pagination: PaginationResponse;
}

export interface QuerySubmitRequest {
  query_text: string;
  integration_ids?: string[];
}
