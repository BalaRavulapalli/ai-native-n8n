"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { OnboardPage } from "@/components/onboard/onboard-page";
import { checkOnboardStatus } from "@/lib/api-client";
import type { ChatMessage } from "@/types/chat";

interface ChatSession {
  id: number;
  title: string;
  messages: ChatMessage[];
  lastWorkflow: Record<string, unknown> | null;
  lastUserRequest: string;
}

let nextId = 1;

export default function Home() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  // Chat session management
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: nextId, title: "", messages: [], lastWorkflow: null, lastUserRequest: "" },
  ]);
  const [activeId, setActiveId] = useState(1);

  const activeSession = sessions.find((s) => s.id === activeId)!;

  useEffect(() => {
    checkOnboardStatus()
      .then((data) => {
        setOnboarded(data.onboarded);
        setCompanyName(data.company_name);
      })
      .catch(() => {
        setOnboarded(false);
      });
  }, []);

  // Update the active session's data
  const updateSession = useCallback(
    (patch: Partial<Pick<ChatSession, "messages" | "lastWorkflow" | "lastUserRequest" | "title">>) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, ...patch } : s))
      );
    },
    [activeId]
  );

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const newMessages = typeof updater === "function" ? updater(s.messages) : updater;
          // Auto-set title from first user message
          const title =
            s.title ||
            newMessages.find((m) => m.role === "user")?.content.slice(0, 60) ||
            "";
          return { ...s, messages: newMessages, title };
        })
      );
    },
    [activeId]
  );

  const handleNewChat = useCallback(() => {
    const newId = ++nextId;
    setSessions((prev) => [
      { id: newId, title: "", messages: [], lastWorkflow: null, lastUserRequest: "" },
      ...prev.filter((s) => s.messages.length > 0), // drop empty sessions
    ]);
    setActiveId(newId);
  }, []);

  const handleSelectSession = useCallback((id: number) => {
    setActiveId(id);
  }, []);

  const handleOnboardComplete = useCallback((name: string) => {
    setCompanyName(name);
    setOnboarded(true);
  }, []);

  if (onboarded === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!onboarded) {
    return <OnboardPage onComplete={handleOnboardComplete} />;
  }

  return (
    <div className="flex h-screen flex-col">
      <Header onNewChat={handleNewChat} companyName={companyName} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          companyName={companyName}
          sessions={sessions}
          activeSessionId={activeId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />
        <main className="flex-1">
          <ChatInterface
            key={activeId}
            companyName={companyName}
            messages={activeSession.messages}
            setMessages={setMessages}
            lastWorkflow={activeSession.lastWorkflow}
            setLastWorkflow={(wf) => updateSession({ lastWorkflow: wf })}
            lastUserRequest={activeSession.lastUserRequest}
            setLastUserRequest={(req) => updateSession({ lastUserRequest: req })}
          />
        </main>
      </div>
    </div>
  );
}
