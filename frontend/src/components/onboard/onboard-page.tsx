"use client";

import { useState, useRef } from "react";
import { Upload, ArrowRight, FileText, X, Loader2, Workflow } from "lucide-react";
import { submitProfile, uploadDocuments } from "@/lib/api-client";

interface OnboardPageProps {
  onComplete: (companyName: string) => void;
}

export function OnboardPage({ onComplete }: OnboardPageProps) {
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [services, setServices] = useState("");
  const [size, setSize] = useState("");
  const [regulatoryEnv, setRegulatoryEnv] = useState("");
  const [headquarters, setHeadquarters] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"idle" | "profile" | "documents" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileComplete =
    companyName.trim() &&
    companyType.trim() &&
    services.trim() &&
    size.trim() &&
    regulatoryEnv.trim() &&
    headquarters.trim();

  const canSubmit = profileComplete && files.length > 0 && !isSubmitting;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Submit profile
      setStep("profile");
      await submitProfile({
        company_name: companyName.trim(),
        company_type: companyType.trim(),
        services: services.trim(),
        size: size.trim(),
        regulatory_environment: regulatoryEnv.trim(),
        headquarters: headquarters.trim(),
      });

      // Step 2: Upload documents
      setStep("documents");
      await uploadDocuments(files);

      setStep("done");
      onComplete(companyName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed. Please try again.");
      setStep("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { label: "Company Name", value: companyName, setter: setCompanyName, placeholder: "e.g. Acme Corp" },
    { label: "Company Type", value: companyType, setter: setCompanyType, placeholder: "e.g. Financial services firm" },
    { label: "Services", value: services, setter: setServices, placeholder: "e.g. Advisory, Trading, Asset management" },
    { label: "Company Size", value: size, setter: setSize, placeholder: "e.g. ~500 employees" },
    { label: "Regulatory Environment", value: regulatoryEnv, setter: setRegulatoryEnv, placeholder: "e.g. SEC, FINRA" },
    { label: "Headquarters", value: headquarters, setter: setHeadquarters, placeholder: "e.g. San Francisco, CA" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-5">
            <Workflow className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100 mb-2">
            Soren Workflow Automation
          </h1>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Set up your company profile and upload internal documents to get started with context-aware workflow generation.
          </p>
        </div>

        {/* Company Profile */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">
            Company Profile
          </h2>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.label}>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Document Upload */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Company Documents
          </h2>
          <p className="text-xs text-zinc-600 mb-4">
            Upload internal documents (compliance manuals, policies, procedures, org charts, tool guides). These are chunked and embedded for context-aware generation.
          </p>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-zinc-700 hover:border-blue-500/50 rounded-lg p-8 text-center cursor-pointer transition-colors"
          >
            <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">
              Drop files here or <span className="text-blue-400">browse</span>
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Markdown (.md), text (.txt), or PDF files
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md,.txt,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 border border-zinc-700/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="text-sm text-zinc-300 truncate">{file.name}</span>
                    <span className="text-xs text-zinc-600 shrink-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    disabled={isSubmitting}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-800/50 px-4 py-3 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium py-3 px-6 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {step === "profile" && "Saving company profile..."}
              {step === "documents" && "Processing & embedding documents..."}
              {step === "done" && "Complete!"}
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-xs text-zinc-600 text-center mt-4">
          Documents are processed locally and embedded into Qdrant for RAG retrieval.
          Nothing leaves your infrastructure.
        </p>
      </div>
    </div>
  );
}
