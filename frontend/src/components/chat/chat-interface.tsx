"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { streamChat, deployWorkflow, testWorkflowStream } from "@/lib/api-client";
import type { ChatMessage, ValidationResult, DeployResult, TestResults, TestLayerResult, CredentialStep, ConfigNote, Suggestion, GenerationStep } from "@/types/chat";

interface ChatInterfaceProps {
  companyName?: string | null;
  messages: ChatMessage[];
  setMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  lastWorkflow: Record<string, unknown> | null;
  setLastWorkflow: (wf: Record<string, unknown> | null) => void;
  lastUserRequest: string;
  setLastUserRequest: (req: string) => void;
}

export function ChatInterface({
  companyName,
  messages,
  setMessages,
  lastWorkflow,
  setLastWorkflow,
  lastUserRequest,
  setLastUserRequest,
}: ChatInterfaceProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll: any user wheel/touch input locks it out until next message send
  const autoScrollLocked = useRef(false);
  const lastMessageLen = messages[messages.length - 1]?.content?.length ?? 0;
  const messageCount = messages.length;

  // Reset lock when a new message is added (user sent or assistant reply started)
  useEffect(() => {
    autoScrollLocked.current = false;
  }, [messageCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const lockScroll = () => { autoScrollLocked.current = true; };
    el.addEventListener("wheel", lockScroll, { passive: true });
    el.addEventListener("touchmove", lockScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", lockScroll);
      el.removeEventListener("touchmove", lockScroll);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current && !autoScrollLocked.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, lastMessageLen, isStreaming]);

  const handleSend = useCallback(async (message: string) => {
    if (isStreaming) return;

    setLastUserRequest(message);

    const userMessage: ChatMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);

    setIsStreaming(true);
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
        workflow_json: m.workflow_json || null,
      }));

      for await (const event of streamChat(message, history as ChatMessage[], lastWorkflow)) {
        switch (event.type) {
          case "status":
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  generationStatus: (event.step as GenerationStep) || null,
                };
              }
              return updated;
            });
            break;

          case "text":
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + (event.content as string),
                };
              }
              return updated;
            });
            break;

          case "workflow": {
            const workflow = event.content as Record<string, unknown>;
            const validation = event.validation as ValidationResult | undefined;
            const eventData = event as unknown as Record<string, unknown>;
            const credentials = eventData.credentials as CredentialStep[] | undefined;
            const configNotes = eventData.config_notes as ConfigNote[] | undefined;
            const suggestions = eventData.suggestions as Suggestion[] | undefined;

            setLastWorkflow(workflow);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  workflow_json: workflow,
                  validation: validation || null,
                  credentials: credentials || null,
                  configNotes: configNotes || null,
                  suggestions: suggestions || null,
                };
              }
              return updated;
            });
            break;
          }

          case "done":
            break;

          case "error":
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + `\n\nError: ${event.content}`,
                };
              }
              return updated;
            });
            break;
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: `Failed to connect to backend. Make sure the FastAPI server is running on http://localhost:8000.\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, messages, lastWorkflow, setMessages, setLastWorkflow, setLastUserRequest]);

  const handleDeploy = useCallback(async (workflow: Record<string, unknown>) => {
    try {
      const result: DeployResult = await deployWorkflow(
        workflow,
        workflow.name as string | undefined
      );

      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].workflow_json === workflow) {
            updated[i] = { ...updated[i], deployResult: result };
            break;
          }
        }
        return [...updated];
      });
    } catch (error) {
      console.error("Deploy failed:", error);
    }
  }, [setMessages]);

  const handleTest = useCallback(async (workflow: Record<string, unknown>) => {
    try {
      // Initialize with all layers pending
      const initResults: TestResults = {
        overall_status: "running",
        results: {
          audit: { layer: "audit", status: "pending", summary: "" },
          dry_run: { layer: "dry_run", status: "pending", summary: "" },
        },
      };

      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].workflow_json === workflow) {
            updated[i] = { ...updated[i], testResults: initResults };
            break;
          }
        }
        return [...updated];
      });

      const deployResult = messages.find(
        (m) => m.workflow_json === workflow && m.deployResult?.workflow_id
      )?.deployResult;

      const results = await testWorkflowStream(
        workflow,
        lastUserRequest,
        deployResult?.workflow_id,
        (layer, status, result) => {
          setMessages((prev) => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].workflow_json === workflow && updated[i].testResults) {
                const tr = { ...updated[i].testResults! };
                const updatedResults = { ...tr.results };
                if (status === "running") {
                  updatedResults[layer] = { layer, status: "running", summary: "" };
                } else if (result) {
                  updatedResults[layer] = result as unknown as TestLayerResult;
                }
                updated[i] = { ...updated[i], testResults: { ...tr, results: updatedResults } };
                break;
              }
            }
            return [...updated];
          });
        },
      );

      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].workflow_json === workflow) {
            updated[i] = { ...updated[i], testResults: results };
            break;
          }
        }
        return [...updated];
      });
    } catch (error) {
      console.error("Test failed:", error);
    }
  }, [lastUserRequest, messages, setMessages]);

  const [fixingIndex, setFixingIndex] = useState<number | null>(null);

  const handleFix = useCallback(async (messageIndex: number) => {
    if (isStreaming || fixingIndex !== null) return;

    const targetMessage = messages[messageIndex];
    if (!targetMessage?.workflow_json || !targetMessage?.testResults) return;

    // Build a summary of the test issues for the LLM
    const testResults = targetMessage.testResults;
    const issues: string[] = [];
    for (const [layerKey, layerResult] of Object.entries(testResults.results)) {
      if (!layerResult) continue;
      if (layerResult.status === "warning" || layerResult.status === "fail" || layerResult.status === "error") {
        issues.push(`[${layerKey}] ${layerResult.summary || ""}`);
        if (layerResult.checks) {
          for (const check of layerResult.checks) {
            if (check.status === "warning" || check.status === "fail") {
              issues.push(`  - ${check.check}: ${check.detail}`);
            }
          }
        }
      }
    }

    const fixPrompt = `The following warnings or failures were found during testing of this workflow. Fix ONLY these specific issues — do not refactor, reorganize, or make other changes.\n\nIssues to fix:\n${issues.join("\n")}\n\nBriefly explain what you changed (use the same format: summary paragraph, then ## Steps, then ## Assumptions), then output the complete corrected workflow JSON.`;

    setFixingIndex(messageIndex);

    // Clear old results and start fresh content on the target message
    setMessages((prev) => {
      const updated = [...prev];
      updated[messageIndex] = {
        ...updated[messageIndex],
        content: "",
        workflow_json: null,
        validation: null,
        testResults: null,
        deployResult: null,
        credentials: null,
        configNotes: null,
        suggestions: null,
      };
      return updated;
    });

    try {
      const history = messages.slice(0, messageIndex + 1).map((m) => ({
        role: m.role,
        content: m.content,
        workflow_json: m.workflow_json || null,
      }));

      for await (const event of streamChat(fixPrompt, history as ChatMessage[], targetMessage.workflow_json)) {
        switch (event.type) {
          case "status":
            setMessages((prev) => {
              const updated = [...prev];
              const msg = updated[messageIndex];
              if (msg.role === "assistant") {
                updated[messageIndex] = {
                  ...msg,
                  generationStatus: (event.step as GenerationStep) || null,
                };
              }
              return updated;
            });
            break;

          case "text":
            setMessages((prev) => {
              const updated = [...prev];
              const msg = updated[messageIndex];
              if (msg.role === "assistant") {
                updated[messageIndex] = {
                  ...msg,
                  content: msg.content + (event.content as string),
                };
              }
              return updated;
            });
            break;

          case "workflow": {
            const workflow = event.content as Record<string, unknown>;
            const validation = event.validation as ValidationResult | undefined;
            const eventData = event as unknown as Record<string, unknown>;
            const credentials = eventData.credentials as CredentialStep[] | undefined;
            const configNotes = eventData.config_notes as ConfigNote[] | undefined;
            const suggestions = eventData.suggestions as Suggestion[] | undefined;

            setLastWorkflow(workflow);
            setMessages((prev) => {
              const updated = [...prev];
              const msg = updated[messageIndex];
              if (msg.role === "assistant") {
                updated[messageIndex] = {
                  ...msg,
                  workflow_json: workflow,
                  validation: validation || null,
                  credentials: credentials || null,
                  configNotes: configNotes || null,
                  suggestions: suggestions || null,
                };
              }
              return updated;
            });
            break;
          }

          case "done":
            break;

          case "error":
            setMessages((prev) => {
              const updated = [...prev];
              const msg = updated[messageIndex];
              if (msg.role === "assistant") {
                updated[messageIndex] = {
                  ...msg,
                  content: msg.content + `\n\nError: ${event.content}`,
                };
              }
              return updated;
            });
            break;
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const msg = updated[messageIndex];
        if (msg.role === "assistant") {
          updated[messageIndex] = {
            ...msg,
            content: `Failed to fix workflow. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
        return updated;
      });
    } finally {
      setFixingIndex(null);
    }
  }, [isStreaming, fixingIndex, messages, lastWorkflow, setMessages, setLastWorkflow]);

  const handleOpenInN8n = useCallback((url: string) => {
    window.open(url, "_blank");
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-200 mb-2">
                Build Workflows with Context
              </h2>
              <p className="text-sm text-zinc-500 max-w-lg mb-8">
                Describe what you want to automate in plain English. The system knows
                your company&apos;s tools, policies, teams, and databases.
              </p>
              <div className="grid gap-3 w-full max-w-xl">
                {[
                  "Set up an automation that checks for new client applications every morning, runs them against our sanctions list, and routes flagged ones to the compliance team's Slack channel",
                  "Create a workflow that monitors our deal pipeline in Salesforce and sends a weekly summary to the deal team",
                  "When a KYC review is due for a client, automatically pull their latest docs from SharePoint and create a review task",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <MessageBubble
              key={i}
              message={message}
              messageIndex={i}
              isStreaming={isStreaming && i === messages.length - 1 && message.role === "assistant"}
              isFixing={fixingIndex === i}
              onDeploy={handleDeploy}
              onTest={handleTest}
              onOpenInN8n={handleOpenInN8n}
              onSendMessage={handleSend}
              onFix={handleFix}
              isChatStreaming={isStreaming || fixingIndex !== null}
            />
          ))}
        </div>
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={isStreaming || fixingIndex !== null} />
    </div>
  );
}
