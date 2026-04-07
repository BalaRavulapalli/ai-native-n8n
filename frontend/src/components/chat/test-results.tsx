"use client";

import {
  CheckCircle2,
  AlertTriangle,
  Circle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Shield,
  Play,
  Zap,
} from "lucide-react";

/** Safely render a value that might be an object */
function safeStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  return JSON.stringify(val, null, 2);
}
import { useState } from "react";
import { Wrench } from "lucide-react";
import type { TestResults, TestLayerResult } from "@/types/chat";

const STATUS_ICONS = {
  pass: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  fail: <XCircle className="h-4 w-4 text-red-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
  skipped: <AlertTriangle className="h-4 w-4 text-zinc-500" />,
  running: <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />,
};

const STATUS_COLORS = {
  pass: "text-emerald-400",
  warning: "text-yellow-400",
  fail: "text-red-400",
  error: "text-red-400",
  skipped: "text-zinc-500",
  success: "text-emerald-400",
  running: "text-blue-400",
};

const LAYER_ICONS = {
  audit: <Shield className="h-4 w-4" />,
  dry_run: <Play className="h-4 w-4" />,
  execution: <Zap className="h-4 w-4" />,
};

const LAYER_LABELS = {
  audit: "Logical Audit",
  dry_run: "Dry Run Trace",
  execution: "Live Execution",
};

function LayerResult({ layerKey, result }: { layerKey: string; result: TestLayerResult }) {
  const [expanded, setExpanded] = useState(layerKey === "audit");
  const status = result.status as keyof typeof STATUS_ICONS;

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-zinc-800/50 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3 text-zinc-500" /> : <ChevronRight className="h-3 w-3 text-zinc-500" />}
        <span className="text-zinc-400">{LAYER_ICONS[layerKey as keyof typeof LAYER_ICONS]}</span>
        <span className="text-sm font-medium text-zinc-200">
          {LAYER_LABELS[layerKey as keyof typeof LAYER_LABELS] || layerKey}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {STATUS_ICONS[status] || STATUS_ICONS.warning}
          <span className={`text-xs ${STATUS_COLORS[status] || "text-zinc-400"}`}>
            {result.status}
          </span>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
          {(() => {
            const summary = result.summary || String((result as unknown as Record<string, string>).overall_assessment || "");
            if (!summary) return null;
            const lines = summary.split(/\n/).filter((l: string) => l.trim());
            const isBullets = lines.some((l: string) => l.trim().startsWith("•") || l.trim().startsWith("-"));
            if (isBullets) {
              return (
                <ul className="space-y-1">
                  {lines.map((line: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-300">{line.replace(/^[•\-]\s*/, "• ")}</li>
                  ))}
                </ul>
              );
            }
            return <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>;
          })()}

          {/* Audit checks */}
          {result.checks && Array.isArray(result.checks) && (
            <div className="space-y-1.5">
              {result.checks.map((check, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {STATUS_ICONS[check.status as keyof typeof STATUS_ICONS] || STATUS_ICONS.warning}
                  </span>
                  <div>
                    <span className="text-zinc-300">{check.check}</span>
                    {check.detail && (
                      <p className="text-zinc-500 mt-0.5">{check.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dry run scenarios */}
          {result.test_scenarios && Array.isArray(result.test_scenarios) && (
            <div className="space-y-3">
              {result.test_scenarios.map((scenario, i) => (
                <div key={i} className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-zinc-200 mb-1">{safeStr(scenario.name)}</p>
                  <p className="text-xs text-zinc-500 mb-2">{safeStr(scenario.description)}</p>
                  {scenario.trace && Array.isArray(scenario.trace) && (
                    <div className="space-y-1.5">
                      {scenario.trace.map((step, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs">
                          <span className="text-blue-400 shrink-0 font-mono">{j + 1}.</span>
                          <span>
                            <span className="text-zinc-300 font-medium">{safeStr(step.node)}</span>
                            <span className="text-zinc-500"> — {safeStr(step.action)}</span>
                            {step.output && (
                              <span className="text-zinc-400"> → {safeStr(step.output)}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 mt-2 italic">{safeStr(scenario.expected_outcome)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Execution node results */}
          {result.node_results && (
            <div className="space-y-1.5">
              {result.node_results.map((nr, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {STATUS_ICONS[nr.status as keyof typeof STATUS_ICONS] || STATUS_ICONS.warning}
                  </span>
                  <div>
                    <span className="text-zinc-200 font-medium">{nr.node}</span>
                    <span className={`ml-2 ${STATUS_COLORS[nr.status as keyof typeof STATUS_COLORS] || "text-zinc-400"}`}>
                      {nr.status}
                    </span>
                    {nr.data_summary && (
                      <p className="text-zinc-400 mt-0.5">{nr.data_summary}</p>
                    )}
                    {nr.notes && (
                      <p className="text-zinc-500 mt-0.5 italic">{nr.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

function LayerStatusIcon({ status }: { status: string }) {
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin shrink-0" />;
  if (status === "pending") return <Circle className="h-3.5 w-3.5 text-zinc-600 shrink-0" />;
  if (status === "pass" || status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  if (status === "fail" || status === "error") return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
  if (status === "skipped") return <AlertTriangle className="h-3.5 w-3.5 text-zinc-500 shrink-0" />;
  return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
}

export function TestResultsView({ results, onFix, isFixing }: { results: TestResults; onFix?: () => void; isFixing?: boolean }) {
  const overallStatus = results.overall_status as keyof typeof STATUS_ICONS;
  const isRunning = results.overall_status === "running";

  const layers = [
    { key: "audit", label: "Logical Audit", data: results.results.audit },
    { key: "dry_run", label: "Dry Run Trace", data: results.results.dry_run },
    { key: "execution", label: "Live Execution", data: results.results.execution },
  ];

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
        {isRunning ? <Loader2 className="h-4 w-4 text-blue-400 animate-spin" /> : (STATUS_ICONS[overallStatus] || STATUS_ICONS.warning)}
        <span className="text-sm font-medium text-zinc-200">
          {isRunning ? "Running tests..." : "Test Results"}
        </span>
        {!isRunning && (
          <span className={`text-xs ml-1 ${STATUS_COLORS[overallStatus] || "text-zinc-400"}`}>
            {results.overall_status}
          </span>
        )}
      </div>

      {/* Progress overview — always shown during running */}
      {isRunning && (
        <div className="px-4 py-3 space-y-2 border-b border-zinc-800/50">
          {layers.map(({ key, label, data }) => {
            const status = data?.status || "pending";
            return (
              <div key={key} className="flex items-center gap-2.5">
                <LayerStatusIcon status={status} />
                <span className={`text-sm ${
                  status === "running" ? "text-zinc-200" :
                  status === "pending" ? "text-zinc-600" :
                  "text-zinc-400"
                }`}>
                  {label}
                </span>
                {status !== "pending" && status !== "running" && (
                  <span className={`text-xs ml-auto ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "text-zinc-400"}`}>
                    {status}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed layer results — show as they finish */}
      <div className="p-3 space-y-2">
        {layers.map(({ key, data }) => {
          if (!data || data.status === "pending" || data.status === "running") return null;
          return <LayerResult key={key} layerKey={key} result={data} />;
        })}
      </div>

      {/* Fix Automation button — shown when tests have warnings or failures */}
      {!isRunning && onFix && (results.overall_status === "warning" || results.overall_status === "fail" || results.overall_status === "error") && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <button
            onClick={onFix}
            disabled={isFixing}
            className="flex items-center gap-2 rounded-lg bg-amber-600/20 border border-amber-500/30 px-4 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-600/30 hover:border-amber-500/50 disabled:opacity-40 transition-all w-full justify-center"
          >
            {isFixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
            {isFixing ? "Fixing automation..." : "Fix Automation"}
          </button>
        </div>
      )}
    </div>
  );
}
