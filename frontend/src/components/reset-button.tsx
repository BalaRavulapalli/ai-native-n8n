"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ResetButton() {
  const [spinning, setSpinning] = useState(false);

  const handleReset = async () => {
    setSpinning(true);
    try {
      await fetch(`${API}/onboard/reset`, { method: "POST" });
    } catch {
      // backend may be down — that's fine, onboard state is already cleared on restart
    }
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <button
      onClick={handleReset}
      title="Reset onboarding"
      className="text-zinc-600 hover:text-zinc-400 transition-colors"
    >
      <RotateCcw
        className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      />
    </button>
  );
}
