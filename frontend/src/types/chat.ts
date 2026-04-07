export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  workflow_json?: Record<string, unknown> | null;
  validation?: ValidationResult | null;
  testResults?: TestResults | null;
  deployResult?: DeployResult | null;
  credentials?: CredentialStep[] | null;
  configNotes?: ConfigNote[] | null;
  suggestions?: Suggestion[] | null;
  generationStatus?: GenerationStep | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeployResult {
  success: boolean;
  workflow_id?: string;
  n8n_url?: string;
  error?: string;
}

export interface CredentialStep {
  node_name: string;
  service: string;
  icon: string;
  credential_type: string;
  description: string;
  status: "complete" | "needs_setup";
}

export interface ConfigNote {
  node_name: string;
  note: string;
}

export interface Suggestion {
  label: string;
  prompt: string;
}

export interface TestLayerResult {
  layer: string;
  status: string;
  summary: string;
  checks?: Array<{
    check: string;
    status: string;
    detail: string;
  }>;
  test_scenarios?: Array<{
    name: string;
    description: string;
    trace: Array<{
      node: string;
      action: string;
      output: string;
      notes?: string;
    }>;
    expected_outcome: string;
  }>;
  node_results?: Array<{
    node: string;
    status: string;
    data_summary: string;
    notes?: string;
  }>;
  recommendations?: string[];
  raw_response?: string;
}

export interface TestResults {
  overall_status: string;
  results: {
    audit?: TestLayerResult;
    dry_run?: TestLayerResult;
    execution?: TestLayerResult;
    [key: string]: TestLayerResult | undefined;
  };
}

export type GenerationStep =
  | "retrieving_context"
  | "retrieving_context_done"
  | "planning_nodes"
  | "planning_nodes_done"
  | "generating";

export interface SSEEvent {
  type: "text" | "workflow" | "done" | "error" | "status";
  content?: string | Record<string, unknown>;
  step?: GenerationStep;
  validation?: ValidationResult;
  credentials?: CredentialStep[];
  config_notes?: ConfigNote[];
  suggestions?: Suggestion[];
}
