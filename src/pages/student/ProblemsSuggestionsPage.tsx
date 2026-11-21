import React, { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { useSchool } from "../../context/SchoolContext";
import { canViewProblemReport } from "../../db/databaseAdapter";
import type { ReportCategory, ReportUrgency } from "../../db/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DraftSummary {
  title: string;
  category: ReportCategory;
  urgency: ReportUrgency;
  summary: string;
}

export function ProblemsSuggestionsPage() {
  const { currentUser, db, submitProblemReport } = useSchool();

  if (!currentUser || currentUser.role !== "student") return null;

  const studentClass = db.classes.find((c) => c.id === currentUser.classId);
  const viceRep = db.users.find(
    (u) =>
      u.id === studentClass?.viceRepresentativeId ||
      (u.isViceRepresentative && u.viceRepClassId === studentClass?.id),
  );

  const initialGreeting: ChatMessage = {
    role: "assistant",
    content: `Hi ${currentUser.fullName.split(" ")[0]}, I'm your School Plus assistant for ${
      studentClass?.name || "your class"
    }. Share any classroom issue, campus problem, or suggestion in your own words. I'll ask any quick follow-up questions if needed, summarize it clearly, and send it privately to your Vice Representative (${
      viceRep?.fullName || "Class Vice Rep"
    }).`,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [input, setInput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState("");
  const [draftSummary, setDraftSummary] = useState<DraftSummary | null>(null);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const myReports = useMemo(
    () =>
      db.reports.filter(
        (r) => r.studentId === currentUser.id && canViewProblemReport(currentUser, r),
      ),
    [db.reports, currentUser],
  );

  const handleResetChat = () => {
    setMessages([initialGreeting]);
    setInput("");
    setAiError("");
    setDraftSummary(null);
    setJustSubmittedId(null);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loadingAi) return;

    const updatedMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(updatedMessages);
    setInput("");
    setAiError("");
    setJustSubmittedId(null);
    setLoadingAi(true);

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const response = await fetch("/api/assistant/report-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          studentName: currentUser.fullName,
          className: studentClass?.name || "Makdisi School Class",
          viceRepName: viceRep?.fullName || "Class Vice Representative",
          userRole: currentUser.role,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        reply?: string;
        readyToSubmit?: boolean;
        suggestedTitle?: string;
        category?: ReportCategory;
        urgency?: ReportUrgency;
        summary?: string;
      };

      if (!response.ok) {
        setAiError(data.error || "Unable to contact the AI assistant.");
        return;
      }

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply as string }]);
      }

      if (data.readyToSubmit && data.summary) {
        setDraftSummary({
          title: data.suggestedTitle || "Student Report",
          category: data.category || "Suggestion",
          urgency: data.urgency || "Medium",
          summary: data.summary,
        });
      }
    } catch {
      setAiError("Network error reaching /api/assistant/report-chat. Please try again.");
    } finally {
      setLoadingAi(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };

  const handleConfirmSendReport = () => {
    if (!draftSummary) return;
    const created = submitProblemReport({
      title: draftSummary.title,
      category: draftSummary.category,
      urgency: draftSummary.urgency,
      summary: draftSummary.summary,
      originalTranscript: messages,
    });
    if (created) {
      setJustSubmittedId(created.id);
      setDraftSummary(null);
      setMessages([
        ...messages,
        {
          role: "assistant",
          content: `Confirmed — your report "${created.title}" has been sent privately to ${created.viceRepName} (${created.className}). You can track its status below.`,
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Problems & Suggestions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Private chat assistant · Routed directly to{" "}
            <span className="font-medium text-[#080B12] dark:text-white">
              {viceRep?.fullName || "your Class Vice Representative"}
            </span>{" "}
            for {studentClass?.name}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0c1322] dark:text-slate-200 dark:hover:bg-[#101C35] self-start whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>New conversation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* AI Chat Assistant Workspace */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1322] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#101C35]/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Makdisi Student Support Assistant</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Private to you, {viceRep?.fullName || "Vice Rep"}, and authorized admins
                </div>
              </div>
            </div>
            <Lock className="h-4 w-4 text-slate-400 shrink-0" />
          </div>

          {/* Chat Transcript */}
          <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#2563EB] text-white"
                      : "border border-slate-200 bg-slate-50 text-[#080B12] dark:border-slate-700 dark:bg-[#101C35] dark:text-slate-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loadingAi ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-[#101C35] dark:text-slate-300">
                  Reviewing your message...
                </div>
              </div>
            ) : null}

            {aiError ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">AI Assistant Notice</div>
                  <p className="mt-0.5">{aiError}</p>
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          {/* Structured Summary Card Ready to Send */}
          {draftSummary ? (
            <div className="mx-5 mb-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-[#101C35]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                  Ready for {viceRep?.fullName || "Vice Representative"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {draftSummary.category} · {draftSummary.urgency} priority
                </span>
              </div>
              <input
                type="text"
                value={draftSummary.title}
                onChange={(e) =>
                  setDraftSummary({ ...draftSummary, title: e.target.value })
                }
                aria-label="Report title"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#080B12] dark:border-slate-700 dark:bg-[#0c1322] dark:text-white"
              />
              <textarea
                rows={3}
                value={draftSummary.summary}
                onChange={(e) =>
                  setDraftSummary({ ...draftSummary, summary: e.target.value })
                }
                aria-label="Report summary"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-[#0c1322] dark:text-slate-200"
              />
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDraftSummary(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0c1322] dark:text-slate-300"
                >
                  Keep editing in chat
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendReport}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send to Vice Representative</span>
                </button>
              </div>
            </div>
          ) : null}

          {justSubmittedId ? (
            <div className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Submission confirmed! Your class Vice Representative has been notified.
              </span>
            </div>
          ) : null}

          {/* Input Bar */}
          <form
            onSubmit={handleSendChat}
            className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Explain a problem or share a suggestion for your class..."
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#080B12] placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
            />
            <button
              type="submit"
              disabled={loadingAi || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Student's Private Submitted Reports History */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322]">
          <h3 className="font-display text-base font-semibold">My Submitted Reports</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Track whether your class Vice Representative has received or handled your report.
          </p>

          {myReports.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              You haven’t submitted any reports or suggestions yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {myReports.map((rep) => (
                <article
                  key={rep.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {rep.category} · {rep.urgency}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        rep.status === "handled"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : rep.status === "received"
                            ? "text-[#2563EB] dark:text-[#60A5FA]"
                            : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {rep.status === "handled" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {rep.status === "handled"
                          ? "Handled"
                          : rep.status === "received"
                            ? "Received"
                            : "Submitted"}
                      </span>
                    </span>
                  </div>

                  <h4 className="mt-1.5 text-sm font-semibold text-[#080B12] dark:text-white">
                    {rep.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rep.summary}
                  </p>
                  {rep.handlingNote ? (
                    <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-[#101C35] dark:text-slate-200">
                      <span className="font-semibold">{rep.viceRepName}:</span>{" "}
                      {rep.handlingNote}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
