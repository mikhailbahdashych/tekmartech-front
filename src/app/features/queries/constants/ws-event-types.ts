export const WS_EVENT_TYPES = {
  QUERY_INTERPRETING: 'query_interpreting',
  QUERY_INTERPRETATION_TEXT_DELTA: 'query_interpretation_text_delta',
  QUERY_PLAN_READY: 'query_plan_ready',
  QUERY_INTERPRETATION_FAILED: 'query_interpretation_failed',
  QUERY_EXECUTION_STARTED: 'query_execution_started',
  QUERY_STEP_STARTED: 'query_step_started',
  QUERY_STEP_COMPLETED: 'query_step_completed',
  QUERY_STEP_FAILED: 'query_step_failed',
  QUERY_COMPLETED: 'query_completed',
  QUERY_FAILED: 'query_failed',
} as const;
