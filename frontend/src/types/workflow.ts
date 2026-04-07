export interface N8nNode {
  id?: string;
  name: string;
  type: string;
  position: number[];
  parameters: Record<string, unknown>;
  typeVersion?: number;
  credentials?: Record<string, unknown>;
}

export interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
  active?: boolean;
}
