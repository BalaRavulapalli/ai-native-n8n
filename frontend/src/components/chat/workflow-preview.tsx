"use client";

import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Rocket,
  FlaskConical,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import type { ValidationResult, DeployResult, TestResults } from "@/types/chat";
import type { N8nNode } from "@/types/workflow";
import { Circle } from "lucide-react";

// Map n8n node types to display labels and colors
const NODE_DISPLAY: Record<string, { label: string; color: string }> = {
  "n8n-nodes-base.scheduleTrigger": { label: "Schedule", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  "n8n-nodes-base.webhook": { label: "Webhook", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  "n8n-nodes-base.manualTrigger": { label: "Manual", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  "n8n-nodes-base.postgres": { label: "Postgres", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  "n8n-nodes-base.slack": { label: "Slack", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  "n8n-nodes-base.salesforce": { label: "Salesforce", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  "n8n-nodes-base.httpRequest": { label: "HTTP", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  "n8n-nodes-base.if": { label: "IF", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  "n8n-nodes-base.switch": { label: "Switch", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  "n8n-nodes-base.code": { label: "Code", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  "n8n-nodes-base.set": { label: "Set", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  "n8n-nodes-base.sendGrid": { label: "Email", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  "n8n-nodes-base.microsoftSharePoint": { label: "SharePoint", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  "n8n-nodes-base.filter": { label: "Filter", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  "n8n-nodes-base.merge": { label: "Merge", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
};

function getNodeDisplay(type: string) {
  return NODE_DISPLAY[type] || { label: type.split(".").pop() || "Node", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" };
}

// Build a simple ordered node list from connections
function getOrderedNodes(nodes: N8nNode[], connections: Record<string, unknown>): N8nNode[] {
  if (!nodes.length) return [];

  const nodeMap = new Map(nodes.map((n) => [n.name, n]));
  const hasIncoming = new Set<string>();

  // Find all nodes that have incoming connections
  for (const [, outputs] of Object.entries(connections)) {
    const mainOutputs = (outputs as { main?: Array<Array<{ node: string }>> })?.main;
    if (mainOutputs) {
      for (const outputGroup of mainOutputs) {
        if (Array.isArray(outputGroup)) {
          for (const target of outputGroup) {
            hasIncoming.add(target.node);
          }
        }
      }
    }
  }

  // Start nodes are those with no incoming connections
  const startNodes = nodes.filter((n) => !hasIncoming.has(n.name));
  if (!startNodes.length) return nodes;

  // BFS to order nodes
  const ordered: N8nNode[] = [];
  const visited = new Set<string>();
  const queue = [...startNodes];

  while (queue.length) {
    const node = queue.shift()!;
    if (visited.has(node.name)) continue;
    visited.add(node.name);
    ordered.push(node);

    const outputs = (connections as Record<string, { main?: Array<Array<{ node: string }>> }>)[node.name]?.main;
    if (outputs) {
      for (const outputGroup of outputs) {
        if (Array.isArray(outputGroup)) {
          for (const target of outputGroup) {
            const targetNode = nodeMap.get(target.node);
            if (targetNode && !visited.has(target.node)) {
              queue.push(targetNode);
            }
          }
        }
      }
    }
  }

  // Add any unvisited nodes at the end
  for (const node of nodes) {
    if (!visited.has(node.name)) {
      ordered.push(node);
    }
  }

  return ordered;
}

interface WorkflowPreviewProps {
  workflow: Record<string, unknown>;
  validation?: ValidationResult;
  deployResult?: DeployResult;
  testResults?: TestResults;
  onDeploy?: (workflow: Record<string, unknown>) => void;
  onTest?: (workflow: Record<string, unknown>) => void;
  onOpenInN8n?: (url: string) => void;
}

export function WorkflowPreview({
  workflow,
  validation,
  deployResult,
  testResults,
  onDeploy,
  onTest,
  onOpenInN8n,
}: WorkflowPreviewProps) {
  const [deploying, setDeploying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const nodes = (workflow.nodes as N8nNode[]) || [];
  const connections = (workflow.connections as Record<string, unknown>) || {};
  const orderedNodes = getOrderedNodes(nodes, connections);
  const workflowName = (workflow.name as string) || "Generated Workflow";

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      onDeploy?.(workflow);
    } finally {
      setTimeout(() => setDeploying(false), 1000);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      onTest?.(workflow);
    } finally {
      setTimeout(() => setTesting(false), 1000);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-400" />
          <span className="text-sm font-medium text-zinc-200">{workflowName}</span>
          <span className="text-xs text-zinc-500">{nodes.length} nodes</span>
        </div>
        <div className="flex items-center gap-1">
          {testResults ? (
            // Show test status after tests have run
            testResults.overall_status === "running" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                <span className="text-xs text-blue-400">Testing</span>
              </>
            ) : testResults.overall_status === "pass" || testResults.overall_status === "success" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400">Passed</span>
              </>
            ) : testResults.overall_status === "warning" ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400">Warning</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs text-red-400">Failed</span>
              </>
            )
          ) : validation && !validation.valid ? (
            // Structural validation errors
            <>
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-400">{validation.errors.length} errors</span>
            </>
          ) : (
            // Default: untested
            <span className="text-xs text-zinc-500">Untested</span>
          )}
        </div>
      </div>

      {/* Node Graph */}
      <div className="px-4 py-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2.5 min-w-max">
          {orderedNodes.map((node, i) => {
            const display = getNodeDisplay(node.type);
            return (
              <div key={node.name} className="flex items-center gap-2.5">
                <div
                  className={`rounded-lg border px-4 py-3.5 text-sm font-medium whitespace-nowrap ${display.color}`}
                >
                  <div className="text-[11px] opacity-60 mb-1">{display.label}</div>
                  <div>{node.name}</div>
                </div>
                {i < orderedNodes.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Warnings */}
      {validation && validation.warnings.length > 0 && (
        <div className="border-t border-zinc-800 px-4 py-2">
          {validation.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-yellow-400/80">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-2.5">
        <button
          onClick={handleDeploy}
          disabled={deploying || (validation && !validation.valid)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 transition-colors"
        >
          {deploying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
          Deploy to n8n
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3.5 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-40 transition-colors"
        >
          {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3" />}
          Test
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
        {deployResult?.success && deployResult.n8n_url && (
          <button
            onClick={() => onOpenInN8n?.(deployResult.n8n_url!)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors ml-auto"
          >
            <ExternalLink className="h-3 w-3" />
            Open in n8n
          </button>
        )}
      </div>

      {/* Deploy Result */}
      {deployResult && (
        <div className={`border-t px-4 py-2 text-xs ${deployResult.success ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
          {deployResult.success ? (
            <div className="space-y-0.5">
              <span>Deployed successfully (ID: {deployResult.workflow_id})</span>
              {deployResult.n8n_url && (
                <p className="text-emerald-400/60 truncate">{deployResult.n8n_url}</p>
              )}
            </div>
          ) : (
            <span>Deploy failed: {deployResult.error}</span>
          )}
        </div>
      )}
    </div>
  );
}
