"use client";

import {
  CheckCircle2,
  Circle,
  Database,
  ExternalLink,
  Globe,
  Info,
  Mail,
  MessageSquare,
  Settings,
  Share2,
  TrendingUp,
} from "lucide-react";
import type { CredentialStep, ConfigNote } from "@/types/chat";

const ICON_MAP: Record<string, React.ElementType> = {
  salesforce: TrendingUp,
  slack: MessageSquare,
  database: Database,
  globe: Globe,
  mail: Mail,
  share: Share2,
  settings: Settings,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Settings;
}

/* ── Credential Checklist ── */

interface CredentialCardsProps {
  credentials: CredentialStep[];
  n8nUrl?: string;
}

export function CredentialCards({ credentials, n8nUrl }: CredentialCardsProps) {
  if (!credentials.length) return null;

  const needsSetup = credentials.filter((s) => s.status === "needs_setup");

  const n8nCredentialsUrl = n8nUrl
    ? `${new URL(n8nUrl).origin}/home/credentials`
    : "http://localhost:5678/home/credentials";

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <span className="text-sm font-medium text-zinc-400">
          {needsSetup.length > 0
            ? `${needsSetup.length} credential${needsSetup.length > 1 ? "s" : ""} to configure`
            : "All credentials configured"}
        </span>
        {needsSetup.length > 0 && (
          <a
            href={n8nCredentialsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Open n8n credentials
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      <div className="divide-y divide-zinc-800/50">
        {credentials.map((step) => {
          const Icon = getIcon(step.icon);
          const isComplete = step.status === "complete";

          return (
            <div key={step.service} className="flex items-center gap-3 px-4 py-3">
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-zinc-600 shrink-0" />
              )}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isComplete ? "text-zinc-400" : "text-zinc-200"}`}>
                    {step.service}
                  </span>
                  <span className="text-xs text-zinc-500">{step.credential_type}</span>
                </div>
                <p className="text-sm text-zinc-500 truncate">{step.description}</p>
              </div>
              {isComplete ? (
                <span className="text-xs text-emerald-400/70 whitespace-nowrap">Ready</span>
              ) : (
                <a
                  href={n8nCredentialsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors whitespace-nowrap"
                >
                  Set up
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Config Notes (for HTTP endpoints, etc.) ── */

interface ConfigNotesProps {
  notes: ConfigNote[];
}

export function ConfigNotes({ notes }: ConfigNotesProps) {
  if (!notes.length) return null;

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div
          key={note.node_name}
          className="flex items-start gap-2.5 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3.5 py-2.5"
        >
          <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-200/80 leading-relaxed">{note.note}</p>
        </div>
      ))}
    </div>
  );
}
