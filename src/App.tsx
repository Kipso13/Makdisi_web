import React, { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Download,
  Inbox,
  Loader2,
  Moon,
  Printer,
  QrCode,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  X,
} from "lucide-react";
import { BOX_CHAT_CONFIG, MAKDISI_CLASSES } from "./config";

interface StudentIdentity {
  fullName: string;
  classId: string;
  studentCode: string;
}

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type ReportCategory =
  | "Academic"
  | "Facilities"
  | "Schedule"
  | "Technology"
  | "Wellbeing"
  | "Suggestion";
type ReportUrgency = "Low" | "Medium" | "High";

interface ReportDraft {
  suggestedTitle: string;
  category: ReportCategory;
  urgency: ReportUrgency;
  summary: string;
}

interface SubmittedReceipt {
  id: string;
  studentName: string;
  studentCode: string;
  className: string;
  viceRepName: string;
  title: string;
  category: ReportCategory;
  urgency: ReportUrgency;
  summary: string;
  createdAt: string;
  deliveryMode: "webhook" | "local";
}

const IDENTITY_KEY = "makdisi_qr_student_identity_v1";
const RECEIPTS_KEY = "makdisi_qr_submitted_receipts_v1";
const THEME_KEY = "makdisi_qr_theme_v1";

function inferCategory(text: string): ReportCategory {
  const t = text.toLowerCase();
  if (t.includes("projector") || t.includes("wifi") || t.includes("computer") || t.includes("lab")) {
    return "Technology";
  }
  if (t.includes("chair") || t.includes("toilet") || t.includes("ac") || t.includes("room") || t.includes("light")) {
    return "Facilities";
  }
  if (t.includes("exam") || t.includes("schedule") || t.includes("timetable") || t.includes("break")) {
    return "Schedule";
  }
  if (t.includes("homework") || t.includes("teacher") || t.includes("grade") || t.includes("course")) {
    return "Academic";
  }
  if (t.includes("stress") || t.includes("bully") || t.includes("safe") || t.includes("health")) {
    return "Wellbeing";
  }
  return "Suggestion";
}

function buildGuidedDraft(turns: ChatTurn[]): ReportDraft {
  const userMessages = turns.filter((t) => t.role === "user").map((t) => t.content.trim());
  const combined = userMessages.join(" ");
  const firstSentence = userMessages[0] || "Student Feedback";
  const shortTitle =
    firstSentence.length > 52 ? `${firstSentence.slice(0, 49).trim()}...` : firstSentence;

  return {
    suggestedTitle: shortTitle,
    category: inferCategory(combined),
    urgency:
      combined.toLowerCase().includes("urgent") || combined.toLowerCase().includes("broken")
        ? "High"
        : "Medium",
    summary:
      userMessages.length > 1
        ? `Student report: ${userMessages[0]} Additional details: ${userMessages.slice(1).join(" ")}`
        : firstSentence,
  };
}

export default function App() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(THEME_KEY) === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  const [identity, setIdentity] = useState<StudentIdentity | null>(() => {
    try {
      const raw = window.sessionStorage.getItem(IDENTITY_KEY);
      return raw ? (JSON.parse(raw) as StudentIdentity) : null;
    } catch {
      return null;
    }
  });

  const [fullNameInput, setFullNameInput] = useState(identity?.fullName || "");
  const [classIdInput, setClassIdInput] = useState(
    identity?.classId || MAKDISI_CLASSES[0].id,
  );
  const [studentCodeInput, setStudentCodeInput] = useState(identity?.studentCode || "");

  const selectedClass = useMemo(
    () =>
      MAKDISI_CLASSES.find((c) => c.id === (identity?.classId || classIdInput)) ||
      MAKDISI_CLASSES[0],
    [identity?.classId, classIdInput],
  );

  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to the Makdisi School Box Chat. Explain a problem, classroom issue, or suggestion in your own words, and we will prepare a clear summary for your class Vice Representative.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [guidedFollowUpAsked, setGuidedFollowUpAsked] = useState(false);
  const [guidedModeActive, setGuidedModeActive] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<SubmittedReceipt | null>(null);

  const [receipts, setReceipts] = useState<SubmittedReceipt[]>(() => {
    try {
      const raw = window.localStorage.getItem(RECEIPTS_KEY);
      return raw ? (JSON.parse(raw) as SubmittedReceipt[]) : [];
    } catch {
      return [];
    }
  });
  const [inboxOpen, setInboxOpen] = useState(false);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrUrlInput, setQrUrlInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}`;
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draft, submittedReceipt, aiError]);

  useEffect(() => {
    if (!qrModalOpen || !qrUrlInput.trim()) return;
    QRCode.toDataURL(qrUrlInput.trim(), {
      width: 320,
      margin: 2,
      color: { dark: "#080B12", light: "#FFFFFF" },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(""));
  }, [qrModalOpen, qrUrlInput]);

  const handleIdentifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) return;
    const next: StudentIdentity = {
      fullName: fullNameInput.trim(),
      classId: classIdInput,
      studentCode: studentCodeInput.trim(),
    };
    setIdentity(next);
    window.sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(next));
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Welcome to the Makdisi School Box Chat. Explain a problem, classroom issue, or suggestion in your own words, and we will prepare a clear summary for your class Vice Representative.",
      },
    ]);
    setDraft(null);
    setGuidedFollowUpAsked(false);
    setSubmittedReceipt(null);
    setAiError(null);
  };

  const runGuidedStep = (turns: ChatTurn[], latestText: string) => {
    setGuidedModeActive(true);
    setAiError(null);
    if (!guidedFollowUpAsked && latestText.length < 70) {
      setGuidedFollowUpAsked(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          role: "assistant",
          content:
            "Got it. To help your Vice Representative act quickly, which room or subject is this for, and what change would help most?",
        },
      ]);
    } else {
      const generated = buildGuidedDraft(turns);
      setDraft(generated);
      setMessages((prev) => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          role: "assistant",
          content: `Thank you, ${identity?.fullName || "student"}. Your summary is ready below—review or edit it if needed, then tap "Send to Vice Representative".`,
        },
      ]);
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const content = (textOverride ?? inputText).trim();
    if (!content || loadingReply || !identity) return;

    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    const nextTurns = [...messages, userTurn];
    setMessages(nextTurns);
    setInputText("");
    setAiError(null);

    if (guidedModeActive) {
      runGuidedStep(nextTurns, content);
      return;
    }

    setLoadingReply(true);
    try {
      const apiMessages = nextTurns
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(BOX_CHAT_CONFIG.chatApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          studentName: identity.fullName,
          className: selectedClass.name,
          viceRepName: selectedClass.viceRepName,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // Static GitHub Pages host returns HTML 404/405 for /api/*
        runGuidedStep(nextTurns, content);
        return;
      }

      const data = (await res.json()) as {
        error?: string;
        reply?: string;
        readyToSubmit?: boolean;
        suggestedTitle?: string;
        category?: ReportCategory;
        urgency?: ReportUrgency;
        summary?: string;
      };

      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          runGuidedStep(nextTurns, content);
          return;
        }
        throw new Error(data.error || "Unable to reach the AI assistant right now.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply || "Thanks—could you share a little more detail?",
        },
      ]);

      if (data.readyToSubmit) {
        setDraft({
          suggestedTitle: data.suggestedTitle || "Student Report",
          category: data.category || "Suggestion",
          urgency: data.urgency || "Medium",
          summary: data.summary || content,
        });
      }
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Unable to reach the AI assistant.",
      );
    } finally {
      setLoadingReply(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!identity || !draft || submitting) return;
    setSubmitting(true);

    const receipt: SubmittedReceipt = {
      id: `MK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      studentName: identity.fullName,
      studentCode: identity.studentCode,
      className: selectedClass.name,
      viceRepName: selectedClass.viceRepName,
      title: draft.suggestedTitle.trim() || "Student Report",
      category: draft.category,
      urgency: draft.urgency,
      summary: draft.summary.trim(),
      createdAt: new Date().toISOString(),
      deliveryMode: BOX_CHAT_CONFIG.submissionWebhookUrl ? "webhook" : "local",
    };

    if (BOX_CHAT_CONFIG.submissionWebhookUrl) {
      try {
        await fetch(BOX_CHAT_CONFIG.submissionWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(receipt),
        });
      } catch {
        setAiError("Saved locally, though the webhook endpoint could not be reached.");
      }
    }

    const updated = [receipt, ...receipts];
    setReceipts(updated);
    try {
      window.localStorage.setItem(RECEIPTS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }

    setSubmittedReceipt(receipt);
    setDraft(null);
    setSubmitting(false);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "makdisi-school-box-chat-qr.png";
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#080B12] dark:bg-[#080B12] dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-[#0c1322]/95 print:hidden">
        <div className="mx-auto max-w-3xl px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="./favicon.ico"
              alt="Makdisi School"
              className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="min-w-0">
              <div className="font-display text-sm font-bold truncate">
                {BOX_CHAT_CONFIG.schoolName}
              </div>
              <div className="text-xs text-[#2563EB] dark:text-[#60A5FA] truncate">
                Student Identification · Box Chat
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#101C35] dark:text-slate-200 whitespace-nowrap"
              title="Generate School QR Code Poster"
            >
              <QrCode className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
              <span className="hidden sm:inline">QR Poster</span>
            </button>
            <button
              type="button"
              onClick={() => setInboxOpen((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#101C35] dark:text-slate-200"
              title="View submitted reports on this device"
            >
              <Inbox className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
              <span className="tabular-nums">{receipts.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#101C35]"
              aria-label="Toggle color theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 sm:py-8 space-y-6">
        {/* Submitted History Drawer */}
        {inboxOpen ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0c1322] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">
                Submitted Reports (This Device)
              </h2>
              <button
                type="button"
                onClick={() => setInboxOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                aria-label="Close submitted reports"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {receipts.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No reports submitted from this browser yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                {receipts.map((r) => (
                  <div key={r.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#080B12] dark:text-white">
                        {r.title}
                      </span>
                      <span className="font-mono text-[#2563EB] dark:text-[#60A5FA]">
                        {r.id}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {r.studentName} · {r.className} → {r.viceRepName}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{r.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {/* STEP 1: STUDENT IDENTIFICATION */}
        {!identity ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-[#0c1322] space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                <UserCheck className="h-4 w-4" />
                <span>Step 1 of 2 · Student Identification</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                Identify yourself to open Box Chat
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter your name and class so your message or suggestion reaches your class Vice
                Representative at Makdisi School.
              </p>
            </div>

            <form onSubmit={handleIdentifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Your Class *
                </label>
                <select
                  value={classIdInput}
                  onChange={(e) => setClassIdInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                >
                  {MAKDISI_CLASSES.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Vice Rep: {cls.viceRepName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Student Number or School Email (optional)
                </label>
                <input
                  type="text"
                  value={studentCodeInput}
                  onChange={(e) => setStudentCodeInput(e.target.value)}
                  placeholder="e.g., MK-2026-104 or name@makdisischool.edu"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <ShieldCheck className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
                <span>
                  Routed privately to your class Vice Representative ({selectedClass.viceRepName})
                  and authorized Makdisi School staff.
                </span>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <span>Open Box Chat</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </section>
        ) : (
          /* STEP 2: BOX CHAT */
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1322] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#101C35]/50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                  Step 2 of 2 · {identity.fullName}
                  {identity.studentCode ? ` · ${identity.studentCode}` : ""}
                </div>
                <div className="text-sm font-bold text-[#080B12] dark:text-white">
                  {selectedClass.name} → Vice Rep: {selectedClass.viceRepName}
                </div>
                {guidedModeActive ? (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Guided Intake Mode active (static site without live AI backend)
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.sessionStorage.removeItem(IDENTITY_KEY);
                    setIdentity(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#080B12] dark:text-slate-200"
                >
                  Change ID
                </button>
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#080B12] dark:text-slate-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>New</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 min-h-[300px] max-h-[440px] overflow-y-auto">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#101C35] text-white dark:bg-[#2563EB]">
                        <Bot className="h-4 w-4" />
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? "bg-[#2563EB] text-white"
                          : "bg-slate-100 text-[#080B12] dark:bg-[#101C35] dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {loadingReply ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
                  <span>Preparing response...</span>
                </div>
              ) : null}

              {aiError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => runGuidedStep(messages, messages[messages.length - 1]?.content || "")}
                    className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Continue with Guided Intake Mode
                  </button>
                </div>
              ) : null}

              {draft && !submittedReceipt ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 dark:border-blue-900 dark:bg-blue-950/35 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                    <Sparkles className="h-4 w-4" />
                    <span>Ready for {selectedClass.viceRepName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={draft.suggestedTitle}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, suggestedTitle: e.target.value } : d))
                      }
                      aria-label="Report title"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={draft.category}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, category: e.target.value as ReportCategory } : d,
                          )
                        }
                        aria-label="Report category"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                      >
                        {["Academic", "Facilities", "Schedule", "Technology", "Wellbeing", "Suggestion"].map(
                          (c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ),
                        )}
                      </select>
                      <select
                        value={draft.urgency}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, urgency: e.target.value as ReportUrgency } : d,
                          )
                        }
                        aria-label="Report urgency"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                      >
                        {["Low", "Medium", "High"].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={draft.summary}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, summary: e.target.value } : d))
                    }
                    aria-label="Report summary"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitReport}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>Send to Vice Representative</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {submittedReceipt ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/35 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Sent to {submittedReceipt.viceRepName}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200">
                    Reference <span className="font-mono font-bold">{submittedReceipt.id}</span> ·{" "}
                    {submittedReceipt.title} ({submittedReceipt.category})
                  </p>
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Submit another problem or suggestion
                  </button>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            {!submittedReceipt ? (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                {messages.length <= 2 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Projector / room equipment issue",
                      "Exam schedule feels too crowded",
                      "Suggestion for our class study space",
                    ].map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => sendMessage(starter)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:border-[#2563EB] dark:border-slate-700 dark:bg-[#101C35] dark:text-slate-200"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                ) : null}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Write your problem or suggestion here..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={loadingReply || !inputText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            ) : null}
          </section>
        )}
      </main>

      {/* QR Code Poster Modal */}
      {qrModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#101C35] space-y-4">
            <div className="flex items-center justify-between print:hidden">
              <h3 className="font-display text-lg font-bold text-[#080B12] dark:text-white">
                School QR Code Poster
              </h3>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close QR modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="print:hidden">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Target URL (your GitHub Pages link)
              </label>
              <input
                type="url"
                value={qrUrlInput}
                onChange={(e) => setQrUrlInput(e.target.value)}
                placeholder="https://username.github.io/makdisi-box-chat/"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#080B12] dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-[#080B12]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Makdisi School · School Plus
              </div>
              <div className="mt-1 font-display text-lg font-bold">
                Problems & Suggestions Box Chat
              </div>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code for Makdisi School Box Chat"
                  className="mx-auto my-4 h-56 w-56"
                />
              ) : null}
              <p className="text-xs text-slate-600">
                Scan with your phone camera to identify yourself and message your class Vice
                Representative.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                <Printer className="h-4 w-4" />
                <span>Print poster</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
