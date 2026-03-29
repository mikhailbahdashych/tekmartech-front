import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QueryService } from './query.service';
import { WebSocketService } from '@core/services/websocket.service';
import {
  QueryPlan,
  ResultData,
  TransparencyLog,
  QueryWsEvent,
  QueryDetailResponse,
} from '@features/queries/models';

export type QueryPhase =
  | 'idle'
  | 'interpreting'
  | 'awaiting_approval'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface ExecutionStepState {
  stepId: string;
  stepIndex: number;
  toolName: string;
  toolDisplayName: string;
  integrationDisplayName: string;
  description: string;
  status: 'running' | 'completed' | 'failed';
  durationMs?: number;
  recordCount?: number;
  summary?: string;
  errorMessage?: string;
}

@Injectable()
export class QueryPageStore {
  private queryService = inject(QueryService);
  private wsService = inject(WebSocketService);
  private destroyRef = inject(DestroyRef);

  // Phase state
  readonly phase = signal<QueryPhase>('idle');
  readonly queryId = signal<string | null>(null);
  readonly queryText = signal('');

  // Interpretation phase
  readonly interpretationText = signal('');
  readonly isInterpretationStreaming = signal(false);

  // Plan phase
  readonly plan = signal<QueryPlan | null>(null);
  readonly planSummary = signal<string | null>(null);
  readonly estimatedDuration = signal<number | null>(null);

  // Execution phase
  readonly executionSteps = signal<ExecutionStepState[]>([]);
  readonly totalSteps = signal(0);

  // Results phase
  readonly resultSummary = signal<string | null>(null);
  readonly executionStatus = signal<'completed' | 'partial' | null>(null);
  readonly resultData = signal<ResultData | null>(null);
  readonly transparencyLog = signal<TransparencyLog | null>(null);

  // Error state
  readonly errorMessage = signal<string | null>(null);

  // Loading states
  readonly isSubmitting = signal(false);
  readonly isApproving = signal(false);
  readonly isRejecting = signal(false);

  constructor() {
    // Recover missed events on WebSocket reconnection
    this.wsService.reconnected$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.recoverState();
    });
  }

  submitQuery(queryText: string, integrationIds?: string[]): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.queryService.submitQuery({ query_text: queryText, integration_ids: integrationIds }).subscribe({
      next: (response) => {
        this.queryId.set(response.query.id);
        this.queryText.set(queryText);
        this.phase.set('interpreting');
        this.isInterpretationStreaming.set(true);
        this.isSubmitting.set(false);
        this.subscribeToEvents(response.query.id);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error?.message ?? 'Failed to submit query. Please try again.');
        this.isSubmitting.set(false);
      },
    });
  }

  approveQuery(): void {
    const id = this.queryId();
    if (!id) return;

    this.isApproving.set(true);
    this.queryService.approveQuery(id).subscribe({
      next: () => {
        // Phase transition happens via query_execution_started WS event
        this.isApproving.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error?.message ?? 'Failed to approve query.');
        this.isApproving.set(false);
      },
    });
  }

  rejectQuery(): void {
    const id = this.queryId();
    if (!id) return;

    this.isRejecting.set(true);
    this.queryService.rejectQuery(id).subscribe({
      next: () => {
        this.phase.set('rejected');
        this.isRejecting.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error?.message ?? 'Failed to reject query.');
        this.isRejecting.set(false);
      },
    });
  }

  exportCsv(): void {
    const id = this.queryId();
    if (!id) return;
    this.queryService.exportCsv(id);
  }

  loadFromExisting(queryId: string): void {
    this.queryId.set(queryId);

    this.queryService.getQuery(queryId).subscribe({
      next: (response) => {
        this.populateFromDetail(response.query);

        // Subscribe to live events if query is still active
        const phase = this.phase();
        if (phase === 'interpreting' || phase === 'awaiting_approval' || phase === 'executing') {
          this.subscribeToEvents(queryId);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error?.message ?? 'Failed to load query.');
        this.phase.set('failed');
      },
    });
  }

  reset(): void {
    this.phase.set('idle');
    this.queryId.set(null);
    this.queryText.set('');
    this.interpretationText.set('');
    this.isInterpretationStreaming.set(false);
    this.plan.set(null);
    this.planSummary.set(null);
    this.estimatedDuration.set(null);
    this.executionSteps.set([]);
    this.totalSteps.set(0);
    this.resultSummary.set(null);
    this.executionStatus.set(null);
    this.resultData.set(null);
    this.transparencyLog.set(null);
    this.errorMessage.set(null);
    this.isSubmitting.set(false);
    this.isApproving.set(false);
    this.isRejecting.set(false);
  }

  private subscribeToEvents(queryId: string): void {
    this.wsService.messagesForQuery(queryId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => this.handleWsEvent(event));
  }

  private handleWsEvent(event: QueryWsEvent): void {
    switch (event.event) {
      case 'query_interpreting':
        this.isInterpretationStreaming.set(true);
        break;

      case 'query_interpretation_text_delta':
        this.interpretationText.update(text => text + event.text_delta);
        break;

      case 'query_plan_ready':
        this.isInterpretationStreaming.set(false);
        this.plan.set(event.query_plan);
        this.planSummary.set(event.plan_summary);
        this.estimatedDuration.set(event.estimated_duration_seconds);
        this.phase.set('awaiting_approval');
        break;

      case 'query_interpretation_failed':
        this.isInterpretationStreaming.set(false);
        this.errorMessage.set(event.error_message);
        this.phase.set('failed');
        break;

      case 'query_execution_started':
        this.totalSteps.set(event.total_steps);
        this.phase.set('executing');
        break;

      case 'query_step_started':
        this.executionSteps.update(steps => [...steps, {
          stepId: event.step_id,
          stepIndex: event.step_index,
          toolName: event.tool_name,
          toolDisplayName: event.tool_display_name,
          integrationDisplayName: event.integration_display_name,
          description: event.description,
          status: 'running',
        }]);
        break;

      case 'query_step_completed':
        this.executionSteps.update(steps =>
          steps.map(s => s.stepId === event.step_id ? {
            ...s,
            status: 'completed' as const,
            durationMs: event.duration_ms,
            recordCount: event.record_count,
            summary: event.summary,
          } : s)
        );
        break;

      case 'query_step_failed':
        this.executionSteps.update(steps =>
          steps.map(s => s.stepId === event.step_id ? {
            ...s,
            status: 'failed' as const,
            durationMs: event.duration_ms,
            errorMessage: event.error_message,
          } : s)
        );
        break;

      case 'query_completed':
        this.resultSummary.set(event.result_summary);
        this.executionStatus.set(event.execution_status);
        this.phase.set('completed');
        this.fetchFullDetail();
        break;

      case 'query_failed':
        this.errorMessage.set(event.error_message);
        this.phase.set('failed');
        break;
    }
  }

  private fetchFullDetail(): void {
    const id = this.queryId();
    if (!id) return;

    this.queryService.getQuery(id).subscribe({
      next: (response) => {
        this.resultData.set(response.query.result_data);
        this.transparencyLog.set(response.query.transparency_log);
      },
    });
  }

  private recoverState(): void {
    const id = this.queryId();
    const currentPhase = this.phase();
    if (!id || currentPhase === 'idle' || currentPhase === 'completed' || currentPhase === 'failed' || currentPhase === 'rejected') {
      return;
    }

    this.queryService.getQuery(id).subscribe({
      next: (response) => {
        this.populateFromDetail(response.query);
      },
    });
  }

  private populateFromDetail(query: QueryDetailResponse): void {
    this.queryText.set(query.query_text);

    if (query.query_plan) {
      this.plan.set(query.query_plan);
    }
    if (query.plan_summary) {
      this.planSummary.set(query.plan_summary);
    }
    if (query.result_data) {
      this.resultData.set(query.result_data);
    }
    if (query.transparency_log) {
      this.transparencyLog.set(query.transparency_log);
    }
    if (query.result_summary) {
      this.resultSummary.set(query.result_summary);
    }
    if (query.error_message) {
      this.errorMessage.set(query.error_message);
    }

    // Map API status to page phase
    switch (query.status) {
      case 'interpreting':
        this.phase.set('interpreting');
        this.isInterpretationStreaming.set(true);
        break;
      case 'awaiting_approval':
        this.phase.set('awaiting_approval');
        break;
      case 'approved':
      case 'executing':
        this.phase.set('executing');
        break;
      case 'completed':
        this.phase.set('completed');
        this.executionStatus.set(
          query.transparency_log?.execution_status === 'partial' ? 'partial' : 'completed'
        );
        break;
      case 'failed':
        this.phase.set('failed');
        break;
      case 'rejected':
        this.phase.set('rejected');
        break;
    }
  }
}
