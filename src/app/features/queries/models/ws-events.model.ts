import { QueryPlan } from './query-plan.model';

interface BaseWsEvent {
  query_id: string;
  timestamp: string;
}

export interface QueryInterpretingEvent extends BaseWsEvent {
  event: 'query_interpreting';
}

export interface QueryInterpretationTextDeltaEvent extends BaseWsEvent {
  event: 'query_interpretation_text_delta';
  text_delta: string;
}

export interface QueryPlanReadyEvent extends BaseWsEvent {
  event: 'query_plan_ready';
  query_plan: QueryPlan;
  plan_summary: string;
  estimated_duration_seconds: number;
}

export interface QueryInterpretationFailedEvent extends BaseWsEvent {
  event: 'query_interpretation_failed';
  error_code: string;
  error_message: string;
}

export interface QueryExecutionStartedEvent extends BaseWsEvent {
  event: 'query_execution_started';
  plan_id: string;
  total_steps: number;
}

export interface QueryStepStartedEvent extends BaseWsEvent {
  event: 'query_step_started';
  step_id: string;
  step_index: number;
  tool_name: string;
  tool_display_name: string;
  integration_display_name: string;
  description: string;
}

export interface QueryStepCompletedEvent extends BaseWsEvent {
  event: 'query_step_completed';
  step_id: string;
  duration_ms: number;
  record_count: number;
  summary: string;
  data_hash: string;
}

export interface QueryStepFailedEvent extends BaseWsEvent {
  event: 'query_step_failed';
  step_id: string;
  duration_ms: number;
  error_code: string;
  error_message: string;
}

export interface QueryCompletedEvent extends BaseWsEvent {
  event: 'query_completed';
  execution_status: 'completed' | 'partial';
  result_summary: string;
  total_records: number;
  execution_duration_ms: number;
}

export interface QueryFailedEvent extends BaseWsEvent {
  event: 'query_failed';
  error_code: string;
  error_message: string;
}

export type QueryWsEvent =
  | QueryInterpretingEvent
  | QueryInterpretationTextDeltaEvent
  | QueryPlanReadyEvent
  | QueryInterpretationFailedEvent
  | QueryExecutionStartedEvent
  | QueryStepStartedEvent
  | QueryStepCompletedEvent
  | QueryStepFailedEvent
  | QueryCompletedEvent
  | QueryFailedEvent;
