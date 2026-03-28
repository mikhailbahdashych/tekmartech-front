export interface QueryPlan {
  plan_id: string;
  plan_version: string;
  steps: PlanStep[];
  estimated_tool_calls: number;
  summary: string;
}

export interface PlanStep {
  step_id: string;
  tool_name: string;
  integration_id: string;
  parameters: Record<string, unknown>;
  description: string;
  output_alias: string;
  transform?: StepTransform;
  depends_on?: string[];
  iterate_over?: IterateConfig;
  paginate?: boolean;
}

export interface StepTransform {
  filter?: {
    array_path: string;
    condition: {
      field: string;
      operator: string;
      value: unknown;
    };
  };
  select_fields?: string[];
}

export interface IterateConfig {
  source_step: string;
  array_path: string;
  item_alias: string;
}
