"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { User, Bot } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { WorkflowPreview } from "./workflow-preview";
import { TestResultsView } from "./test-results";
import { CredentialCards, ConfigNotes } from "./setup-cards";
import { SuggestionChips } from "./suggestion-chips";
import { GenerationProgress } from "./generation-progress";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  isFixing?: boolean;
  onDeploy?: (workflow: Record<string, unknown>) => void;
  onTest?: (workflow: Record<string, unknown>) => void;
  onOpenInN8n?: (url: string) => void;
  onSendMessage?: (message: string) => void;
  onFix?: (messageIndex: number) => void;
  messageIndex?: number;
  isChatStreaming?: boolean;
}

/**
 * Strip workflow JSON code blocks from message text.
 */
function stripWorkflowJson(text: string): string {
  return text.replace(/```(?:json)?\s*([\s\S]*?)```/g, (match, content) => {
    if (content.includes('"nodes"') && content.includes('"connections"')) {
      return "";
    }
    return match;
  });
}

/**
 * Strip suggestion/setup instruction blocks — now rendered as UI components.
 */
function stripSuggestions(text: string): string {
  return text
    // "If you want, I can also:" followed by bullet list or plain lines
    .replace(/(?:^|\n)If you (?:want|like|prefer|need),?\s*I can (?:also\s+)?[\s\S]*$/im, "")
    .replace(/(?:^|\n)I can also (?:refine|update|modify|enhance)[\s\S]*$/im, "")
    .replace(/(?:^|\n)(?:You will need to|You'll need to|Next steps|Before running|To configure|To get this running)[:\s][\s\S]*$/im, "")
    .replace(/(?:^|\n)(?:If you (?:tell|give|share|provide) me)[:\s][\s\S]*$/im, "")
    .trim();
}

export function MessageBubble({
  message,
  isStreaming,
  isFixing,
  onDeploy,
  onTest,
  onOpenInN8n,
  onSendMessage,
  onFix,
  messageIndex,
  isChatStreaming,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasWorkflow = !!message.workflow_json;

  const displayContent = useMemo(() => {
    if (!message.content) return "";
    let content = message.content;
    if (message.workflow_json) {
      content = stripWorkflowJson(content);
    }
    if (message.suggestions?.length || message.credentials?.length || message.configNotes?.length) {
      content = stripSuggestions(content);
    }
    return content.trim();
  }, [message.content, message.workflow_json, message.suggestions, message.credentials, message.configNotes]);

  const isGenerating = isStreaming || isFixing;

  // During streaming/fixing, show progress indicator instead of raw text
  const showProgress = isGenerating || (!hasWorkflow && !displayContent && message.role === "assistant" && message.content === "");

  // After generation is complete and we have a workflow, show the cleaned text
  // If text is empty after stripping, don't show the text bubble
  const showTextBubble = !isUser && displayContent && !isGenerating;

  // Staggered reveal: track how many sections to show (0 = none yet)
  const [revealStep, setRevealStep] = useState(isGenerating ? 0 : 5);
  const wasGenerating = useRef(isGenerating);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gentle auto-scroll to keep newly revealed sections visible
  useEffect(() => {
    if (revealStep > 0 && revealStep <= 5 && containerRef.current) {
      const t = setTimeout(() => {
        const el = containerRef.current;
        if (!el) return;
        const scrollParent = el.closest(".overflow-y-auto");
        if (!scrollParent) return;

        const targetY = scrollParent.scrollTop + el.getBoundingClientRect().bottom - scrollParent.getBoundingClientRect().bottom + 40;
        if (targetY <= scrollParent.scrollTop) return; // already visible

        const startY = scrollParent.scrollTop;
        const distance = targetY - startY;
        const duration = 600; // ms
        let start: number | null = null;

        function step(timestamp: number) {
          if (!start) start = timestamp;
          const elapsed = timestamp - start;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          scrollParent!.scrollTop = startY + distance * ease;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [revealStep]);

  useEffect(() => {
    // When generating (streaming or fixing) just finished, start the cascade
    if (wasGenerating.current && !isGenerating) {
      setRevealStep(0);
      const timers = [
        setTimeout(() => setRevealStep(1), 200),    // text bubble
        setTimeout(() => setRevealStep(2), 1000),   // workflow preview
        setTimeout(() => setRevealStep(3), 1800),   // credentials
        setTimeout(() => setRevealStep(4), 2400),   // config notes
        setTimeout(() => setRevealStep(5), 3000),   // suggestions
      ];
      return () => timers.forEach(clearTimeout);
    }
    // When fixing starts, immediately hide everything
    if (!wasGenerating.current && isGenerating) {
      setRevealStep(0);
    }
    wasGenerating.current = isGenerating;
  }, [isGenerating]);

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div ref={containerRef} className={`max-w-3xl space-y-3 ${isUser ? "order-first" : ""}`}>
        {/* User message */}
        {isUser && (
          <div className="rounded-2xl px-4 py-3 text-sm bg-blue-600 text-white">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {/* Streaming/Fixing: show progress steps */}
        {!isUser && isGenerating && (
          <GenerationProgress
            content={message.content}
            hasWorkflow={hasWorkflow}
            isStreaming={true}
            isFixing={isFixing}
            generationStatus={message.generationStatus}
          />
        )}

        {/* Completed: show text content */}
        {showTextBubble && revealStep >= 1 && (
          <div className="rounded-2xl px-4 py-3 text-sm bg-zinc-800/50 text-zinc-200 animate-fade-in-up">
            <div className="prose prose-invert prose-sm max-w-none overflow-hidden leading-relaxed [&_p]:mb-3 [&_p]:leading-relaxed [&_ol]:my-3 [&_ol]:space-y-1.5 [&_ul]:my-3 [&_ul]:space-y-1.5 [&_li]:leading-relaxed [&_strong]:text-zinc-100 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-zinc-700/50 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-100 [&_h3]:mt-4 [&_h3]:mb-2 [&_pre]:bg-zinc-900 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all [&_hr]:my-4 [&_hr]:border-zinc-700">
              <ReactMarkdown>
                {displayContent}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Workflow Preview Card */}
        {hasWorkflow && revealStep >= 2 && (
          <div className="animate-fade-in-up">
            <WorkflowPreview
              workflow={message.workflow_json!}
              validation={message.validation || undefined}
              deployResult={message.deployResult || undefined}
              testResults={message.testResults || undefined}
              onDeploy={onDeploy}
              onTest={onTest}
              onOpenInN8n={onOpenInN8n}
            />
          </div>
        )}

        {/* Test Results — right under the workflow card */}
        {message.testResults && revealStep >= 2 && (
          <div className="animate-fade-in-up">
            <TestResultsView
              results={message.testResults}
              onFix={onFix && messageIndex !== undefined ? () => onFix(messageIndex) : undefined}
              isFixing={isFixing}
            />
          </div>
        )}

        {/* Credential Setup Checklist */}
        {message.credentials && message.credentials.length > 0 && revealStep >= 3 && (
          <div className="animate-fade-in-up">
            <CredentialCards
              credentials={message.credentials}
              n8nUrl={message.deployResult?.n8n_url}
            />
          </div>
        )}

        {/* Config Notes (HTTP endpoints, etc.) */}
        {message.configNotes && message.configNotes.length > 0 && revealStep >= 4 && (
          <div className="animate-fade-in-up">
            <ConfigNotes notes={message.configNotes} />
          </div>
        )}

        {/* Suggested Enhancements */}
        {message.suggestions && message.suggestions.length > 0 && onSendMessage && revealStep >= 5 && (
          <div className="animate-fade-in-up">
            <SuggestionChips
              suggestions={message.suggestions}
              onSelect={onSendMessage}
              disabled={isChatStreaming}
            />
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-zinc-300">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
