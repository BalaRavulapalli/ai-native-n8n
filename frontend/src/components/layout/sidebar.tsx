"use client";

import { Building2, Database, FileText, MessageSquare, Plus, Shield } from "lucide-react";

interface ChatSessionSummary {
  id: number;
  title: string;
  messages: { role: string }[];
}

interface SidebarProps {
  companyName?: string | null;
  sessions?: ChatSessionSummary[];
  activeSessionId?: number;
  onSelectSession?: (id: number) => void;
  onNewChat?: () => void;
}

export function Sidebar({
  companyName,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewChat,
}: SidebarProps) {
  const chatSessions = sessions.filter((s) => s.messages.length > 0);

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 hidden lg:flex lg:flex-col">
      {/* Company context */}
      <div className="p-5 border-b border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Company Context
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="text-sm text-zinc-300 truncate">{companyName || "Not configured"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Database className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="text-sm text-zinc-400">PostgreSQL connected</span>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="text-sm text-zinc-400">Documents indexed</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="text-sm text-zinc-400">Context-aware RAG</span>
          </div>
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recents
          </h2>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="New chat"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-0.5">
          {chatSessions.length === 0 && (
            <p className="text-xs text-zinc-600 px-2 py-4 text-center">
              No conversations yet
            </p>
          )}
          {chatSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession?.(session.id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors group ${
                session.id === activeSessionId
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <span className="text-sm truncate">
                  {session.title || "New chat"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
