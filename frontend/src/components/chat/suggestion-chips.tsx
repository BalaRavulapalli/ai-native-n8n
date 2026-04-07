"use client";

import { Sparkles } from "lucide-react";
import type { Suggestion } from "@/types/chat";

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({ suggestions, onSelect, disabled }: SuggestionChipsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-2.5">
        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-sm font-medium text-zinc-400">Suggested enhancements</span>
      </div>
      <div className="p-2 space-y-1">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => onSelect(suggestion.prompt)}
            disabled={disabled}
            className="w-full text-left text-sm text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 hover:border-zinc-600 rounded-lg px-3.5 py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
