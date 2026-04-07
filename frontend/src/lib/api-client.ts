import type { ChatMessage, DeployResult, TestResults, SSEEvent } from "@/types/chat";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function* streamChat(
  message: string,
  conversationHistory: ChatMessage[],
  workflowContext?: Record<string, unknown> | null
): AsyncGenerator<SSEEvent> {
  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        workflow_json: msg.workflow_json || null,
      })),
      workflow_context: workflowContext || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data as SSEEvent;
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  // Flush remaining buffer — critical for the final "workflow" and "done" events
  // which may not end with a trailing newline
  if (buffer.trim()) {
    const remaining = buffer.split("\n");
    for (const line of remaining) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data as SSEEvent;
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

export async function deployWorkflow(
  workflowJson: Record<string, unknown>,
  name?: string,
  activate = false
): Promise<DeployResult> {
  const response = await fetch(`${BACKEND_URL}/workflows/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflow_json: workflowJson,
      name: name || undefined,
      activate,
    }),
  });

  return response.json();
}

export async function testWorkflowStream(
  workflowJson: Record<string, unknown>,
  userRequest: string,
  workflowId: string | undefined,
  onLayerUpdate: (layer: string, status: "running" | "done", result?: Record<string, unknown>) => void,
): Promise<TestResults> {
  const response = await fetch(`${BACKEND_URL}/workflows/test/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflow_json: workflowJson,
      user_request: userRequest,
      workflow_id: workflowId || null,
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: TestResults | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.done) {
          finalResult = data as TestResults;
        } else if (data.result) {
          onLayerUpdate(data.layer, "done", data.result);
        } else if (data.status === "running") {
          onLayerUpdate(data.layer, "running");
        }
      } catch {
        // skip parse errors
      }
    }
  }

  // Flush remaining buffer
  if (buffer.startsWith("data: ")) {
    try {
      const data = JSON.parse(buffer.slice(6));
      if (data.done) finalResult = data as TestResults;
    } catch {
      // skip
    }
  }

  return finalResult || { overall_status: "error", results: {} };
}

export async function checkHealth(): Promise<{
  status: string;
  services: Record<string, { status: string }>;
}> {
  const response = await fetch(`${BACKEND_URL}/health/services`);
  return response.json();
}

// --- Onboarding ---

export async function checkOnboardStatus(): Promise<{
  onboarded: boolean;
  company_name: string | null;
}> {
  const response = await fetch(`${BACKEND_URL}/onboard/status`);
  return response.json();
}

export async function submitProfile(profile: {
  company_name: string;
  company_type: string;
  services: string;
  size: string;
  regulatory_environment: string;
  headquarters: string;
}): Promise<{ success: boolean; company_name: string }> {
  const formData = new FormData();
  formData.append("company_name", profile.company_name);
  formData.append("company_type", profile.company_type);
  formData.append("services", profile.services);
  formData.append("size", profile.size);
  formData.append("regulatory_environment", profile.regulatory_environment);
  formData.append("headquarters", profile.headquarters);

  const response = await fetch(`${BACKEND_URL}/onboard/profile`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Profile submission failed: ${response.statusText}`);
  }
  return response.json();
}

export async function uploadDocuments(
  files: File[]
): Promise<{ success: boolean; documents: string[]; count: number }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(`${BACKEND_URL}/onboard/documents`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Document upload failed: ${response.statusText}`);
  }
  return response.json();
}
