"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Loader2 } from "lucide-react";
import type { GenerationStep } from "@/types/chat";

interface ProgressStep {
  label: string;
  status: "pending" | "active" | "done";
}

/**
 * Determine generation steps from real backend status events + content heuristics.
 *
 * Pre-generation steps (context retrieval, node planning) are driven by actual
 * backend status events. Streaming-phase steps (designing, generating, validating)
 * use content heuristics since they happen incrementally during text output.
 */
function deriveSteps(
  content: string,
  hasWorkflow: boolean,
  generationStatus: GenerationStep | null | undefined,
  isFixing?: boolean,
): ProgressStep[] {
  const len = content.length;
  const hasNodes = content.includes('"nodes"');
  const hasConnections = content.includes('"connections"');
  const hasJson = content.includes("```json") || content.includes("```\n{");

  if (isFixing) {
    return [
      {
        label: "Analyzing test feedback",
        status: len > 0 ? "done" : "active",
      },
      {
        label: "Identifying issues",
        status: len > 100 ? "done" : len > 0 ? "active" : "pending",
      },
      {
        label: "Rebuilding workflow",
        status: hasNodes && hasConnections ? "done" : hasJson ? "active" : len > 200 ? "active" : "pending",
      },
      {
        label: "Validating fix",
        status: hasWorkflow ? "done" : hasNodes && hasConnections ? "active" : "pending",
      },
    ];
  }

  // Map backend status events to step states
  const contextDone = generationStatus === "retrieving_context_done"
    || generationStatus === "planning_nodes"
    || generationStatus === "planning_nodes_done"
    || generationStatus === "generating"
    || len > 0;

  const contextActive = generationStatus === "retrieving_context" && !contextDone;

  const planningDone = generationStatus === "planning_nodes_done"
    || generationStatus === "generating"
    || len > 0;

  const planningActive = generationStatus === "planning_nodes" && !planningDone;

  return [
    {
      label: "Retrieving company context",
      status: contextDone ? "done" : contextActive ? "active" : "active",
    },
    {
      label: "Selecting n8n nodes",
      status: planningDone ? "done" : planningActive ? "active" : "pending",
    },
    {
      label: "Designing workflow",
      status: hasJson ? "done" : len > 0 ? "active" : planningDone ? "active" : "pending",
    },
    {
      label: "Generating n8n nodes",
      status: hasNodes && hasConnections ? "done" : hasJson ? "active" : "pending",
    },
    {
      label: "Validating workflow",
      status: hasWorkflow ? "done" : hasNodes && hasConnections ? "active" : "pending",
    },
  ];
}

interface GenerationProgressProps {
  content: string;
  hasWorkflow: boolean;
  isStreaming: boolean;
  isFixing?: boolean;
  generationStatus?: GenerationStep | null;
}

export function GenerationProgress({ content, hasWorkflow, isStreaming, isFixing, generationStatus }: GenerationProgressProps) {
  const [expanded, setExpanded] = useState(false);
  const rawOutputRef = useRef<HTMLDivElement>(null);
  const steps = deriveSteps(content, hasWorkflow, generationStatus, isFixing);

  // Auto-scroll raw output panel to bottom as content streams in
  useEffect(() => {
    if (expanded && rawOutputRef.current) {
      rawOutputRef.current.scrollTop = rawOutputRef.current.scrollHeight;
    }
  }, [content, expanded]);

  // Find the current active step for the headline
  const activeStep = steps.find((s) => s.status === "active");
  const allDone = steps.every((s) => s.status === "done");
  const headline = allDone
    ? (isFixing ? "Fix applied" : "Workflow ready")
    : activeStep?.label || (isFixing ? "Fixing automation" : "Generating workflow");

  return (
    <div className="rounded-2xl bg-zinc-800/50 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-800/80 transition-colors"
      >
        {isStreaming && !allDone ? (
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        )}
        <span className="text-sm text-zinc-200 flex-1">{headline}</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        )}
      </button>

      {/* Expandable: steps + raw output */}
      {expanded && (
        <div className="border-t border-zinc-700/50">
          {/* Step indicators */}
          <div className="px-4 py-3 space-y-2">
            {steps.map((step) => (
              <div key={step.label} className="flex items-center gap-2.5">
                {step.status === "done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : step.status === "active" ? (
                  <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                )}
                <span className={`text-xs ${
                  step.status === "done" ? "text-zinc-400" :
                  step.status === "active" ? "text-zinc-200" :
                  "text-zinc-600"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Raw LLM output (scrollable) */}
          {content && (
            <div className="border-t border-zinc-700/50 px-4 py-3">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Raw output
              </p>
              <div ref={rawOutputRef} className="max-h-48 overflow-y-auto rounded-lg bg-zinc-900/50 p-3">
                <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap break-words font-mono leading-relaxed">
                  {content}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
