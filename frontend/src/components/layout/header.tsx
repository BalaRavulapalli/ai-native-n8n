"use client";

import { Activity, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api-client";
import { SorenLogo } from "@/components/soren-logo";

interface HeaderProps {
  onNewChat?: () => void;
  companyName?: string | null;
}

export function Header({ onNewChat, companyName }: HeaderProps) {
  const [status, setStatus] = useState<Record<string, { status: string }>>({});

  useEffect(() => {
    const check = async () => {
      try {
        const data = await checkHealth();
        setStatus(data.services);
      } catch {
        setStatus({});
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const n8nOk = status.n8n?.status === "ok";

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          title="New chat"
        >
          <SorenLogo className="h-7 w-7 text-zinc-100" />
          <div className="text-left">
            <h1 className="text-lg font-semibold text-zinc-100">Soren Workflow Automation</h1>
            {companyName && (
              <p className="text-xs text-zinc-500">{companyName}</p>
            )}
          </div>
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </button>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Activity className={`h-3 w-3 ${n8nOk ? "text-emerald-400" : "text-zinc-600"}`} />
          <span>n8n {n8nOk ? "connected" : "offline"}</span>
        </div>
      </div>
    </header>
  );
}
