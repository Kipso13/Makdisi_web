import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { Avatar } from "../../components/common/Avatar";
import { useSchool } from "../../context/SchoolContext";
import type { MessageAttachment } from "../../db/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessagesPage() {
  const { currentUser, db, sendMessage, markConversationRead, notify } = useSchool();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<MessageAttachment | undefined>(undefined);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newRecipientId, setNewRecipientId] = useState("");
  const [newSubjectLabel, setNewSubjectLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!currentUser) return null;

  if (currentUser.role === "admin") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-[#0c1322] text-center max-w-xl mx-auto mt-6">
        <ShieldAlert className="h-9 w-9 text-[#2563EB] dark:text-[#60A5FA] mx-auto" />
        <h2 className="mt-3 font-display text-xl font-bold text-[#080B12] dark:text-white">
          Private Student–Teacher Messaging
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Direct messages and homework attachments are private between students and their
          teachers. Use the Admin Console for school-wide announcements and report oversight.
        </p>
      </div>
    );
  }

  const myConversations = useMemo(() => {
    return db.conversations
      .filter((c) =>
        currentUser.role === "student"
          ? c.studentId === currentUser.id
          : c.teacherId === currentUser.id,
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [db.conversations, currentUser]);

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return myConversations;
    return myConversations.filter((conv) => {
      const otherId = currentUser.role === "student" ? conv.teacherId : conv.studentId;
      const other = db.users.find((u) => u.id === otherId);
      return (
        conv.subjectLabel.toLowerCase().includes(q) ||
        conv.lastMessagePreview.toLowerCase().includes(q) ||
        (other?.fullName.toLowerCase().includes(q) ?? false)
      );
    });
  }, [myConversations, searchTerm, currentUser.role, db.users]);

  const activeConversation = useMemo(() => {
    if (selectedConvId) {
      return myConversations.find((c) => c.id === selectedConvId) || myConversations[0] || null;
    }
    return myConversations[0] || null;
  }, [myConversations, selectedConvId]);

  useEffect(() => {
    if (!activeConversation) return;
    const hasUnread =
      currentUser.role === "student"
        ? activeConversation.unreadForStudent > 0
        : activeConversation.unreadForTeacher > 0;
    if (hasUnread) {
      markConversationRead(activeConversation.id);
    }
  }, [activeConversation, currentUser.role, markConversationRead]);

  const activeMessages = useMemo(() => {
    if (!activeConversation) return [];
    return db.messages
      .filter((m) => m.conversationId === activeConversation.id)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }, [db.messages, activeConversation]);

  const availableRecipients = useMemo(() => {
    if (currentUser.role === "student") {
      return db.users.filter((u) => u.role === "teacher");
    }
    const allowedClassIds = currentUser.assignedClassIds || [];
    return db.users.filter(
      (u) => u.role === "student" && u.classId && allowedClassIds.includes(u.classId),
    );
  }, [db.users, currentUser]);

  const otherParticipant = useMemo(() => {
    if (!activeConversation) return null;
    const otherId =
      currentUser.role === "student"
        ? activeConversation.teacherId
        : activeConversation.studentId;
    return db.users.find((u) => u.id === otherId) || null;
  }, [activeConversation, currentUser.role, db.users]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment({
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      fileType: file.type || file.name.split(".").pop()?.toUpperCase() || "Document",
    });
    e.target.value = "";
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    if (!draft.trim() && !attachment) return;

    sendMessage({
      studentId: activeConversation.studentId,
      teacherId: activeConversation.teacherId,
      subjectLabel: activeConversation.subjectLabel,
      text: draft.trim() || `Shared attachment: ${attachment?.name}`,
      attachment,
    });
    setDraft("");
    setAttachment(undefined);
  };

  const handleStartNewConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientId) {
      notify("Please select a recipient first.", "error");
      return;
    }
    const recipient = db.users.find((u) => u.id === newRecipientId);
    if (!recipient) return;

    const studentId = currentUser.role === "student" ? currentUser.id : recipient.id;
    const teacherId = currentUser.role === "teacher" ? currentUser.id : recipient.id;
    const subject =
      newSubjectLabel.trim() ||
      (currentUser.role === "student"
        ? recipient.department || "Course Question"
        : currentUser.department || "Class Follow-up");

    sendMessage({
      studentId,
      teacherId,
      subjectLabel: subject,
      text:
        currentUser.role === "student"
          ? `Hello ${recipient.fullName}, I have a question regarding ${subject}.`
          : `Hello ${recipient.fullName}, following up regarding ${subject}.`,
    });

    const createdConv = db.conversations.find(
      (c) => c.studentId === studentId && c.teacherId === teacherId,
    );
    if (createdConv) setSelectedConvId(createdConv.id);
    setNewChatOpen(false);
    setNewRecipientId("");
    setNewSubjectLabel("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#080B12] dark:text-white">
            {currentUser.role === "student" ? "Teacher Messaging" : "Student Messaging"}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Private one-to-one conversations and homework document sharing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewChatOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New conversation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1322] overflow-hidden min-h-[560px]">
        {/* Conversation List */}
        <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No conversations yet. Start a message thread above.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const otherId =
                  currentUser.role === "student" ? conv.teacherId : conv.studentId;
                const other = db.users.find((u) => u.id === otherId);
                const unread =
                  currentUser.role === "student"
                    ? conv.unreadForStudent
                    : conv.unreadForTeacher;
                const isSelected = activeConversation?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-[#101C35]"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <Avatar
                      name={other?.fullName || "User"}
                      avatarUrl={other?.avatarUrl}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#080B12] dark:text-white truncate">
                          {other?.fullName || "School Member"}
                        </span>
                        {unread > 0 ? (
                          <span className="tabular-nums text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                            {unread} new
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-[#2563EB] dark:text-[#60A5FA] truncate">
                        {conv.subjectLabel}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {conv.lastMessagePreview}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Thread View */}
        <section className="lg:col-span-8 flex flex-col">
          {!activeConversation || !otherParticipant ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-9 w-9 text-slate-400 mb-3" />
              <div className="text-base font-semibold text-[#080B12] dark:text-white">
                Select a conversation
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Ask questions about coursework, submit homework drafts, or receive feedback
                directly.
              </p>
            </div>
          ) : (
            <>
              <header className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#101C35]/50">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={otherParticipant.fullName}
                    avatarUrl={otherParticipant.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#080B12] dark:text-white truncate">
                      {otherParticipant.fullName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {activeConversation.subjectLabel} ·{" "}
                      {otherParticipant.role === "teacher"
                        ? otherParticipant.department || "Faculty"
                        : otherParticipant.academicLevel || "Student"}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                  Private thread
                </span>
              </header>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[420px]">
                {activeMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        {isMine ? "You" : msg.senderName} ·{" "}
                        {new Date(msg.sentAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isMine
                            ? "bg-[#2563EB] text-white"
                            : "bg-slate-100 text-[#080B12] dark:bg-[#101C35] dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.attachment ? (
                          <div
                            className={`mt-2.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs ${
                              isMine
                                ? "bg-white/15 text-white"
                                : "bg-white dark:bg-[#080B12] text-[#080B12] dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {msg.attachment.name}
                              </div>
                              <div className="opacity-80">
                                {msg.attachment.sizeLabel} · {msg.attachment.fileType}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSend}
                className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                {attachment ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-[#101C35] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-[#2563EB] shrink-0" />
                      <span className="font-medium truncate">{attachment.name}</span>
                      <span className="text-slate-500 dark:text-slate-300">
                        ({attachment.sizeLabel})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachment(undefined)}
                      className="p-1 text-slate-500 hover:text-red-600"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#101C35] shrink-0"
                    title="Attach homework or document"
                    aria-label="Attach homework or document"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message or attach homework..."
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      {/* New Conversation Modal */}
      {newChatOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#101C35]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#080B12] dark:text-white">
                Start New Conversation
              </h3>
              <button
                type="button"
                onClick={() => setNewChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleStartNewConversation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  {currentUser.role === "student" ? "Select Teacher" : "Select Student"}
                </label>
                <select
                  value={newRecipientId}
                  onChange={(e) => setNewRecipientId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                >
                  <option value="">Choose recipient...</option>
                  {availableRecipients.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (
                      {u.role === "teacher" ? u.department || "Teacher" : u.academicLevel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  value={newSubjectLabel}
                  onChange={(e) => setNewSubjectLabel(e.target.value)}
                  placeholder="e.g., Physics Lab Report or Calculus Homework"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewChatOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Start thread
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
