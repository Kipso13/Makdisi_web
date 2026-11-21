import React, { useMemo, useState } from "react";
import {
  Award,
  Bell,
  CalendarDays,
  CheckCheck,
  Inbox,
  Megaphone,
  MessageSquare,
  Video,
} from "lucide-react";
import type { AppViewId } from "../../components/layout/AppShell";
import { useSchool } from "../../context/SchoolContext";
import type { NotificationItem } from "../../db/types";

interface NotificationsPageProps {
  onNavigate: (view: AppViewId) => void;
}

function getNotifIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "grade":
      return Award;
    case "attendance":
    case "exam":
      return CalendarDays;
    case "message":
      return MessageSquare;
    case "report":
      return Inbox;
    case "community":
      return Video;
    default:
      return Megaphone;
  }
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const { currentUser, db, markNotificationRead, markAllNotificationsRead } = useSchool();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!currentUser) return null;

  const myNotifications = useMemo(() => {
    return db.notifications
      .filter((n) => n.userId === currentUser.id)
      .filter((n) => (filter === "unread" ? !n.read : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [db.notifications, currentUser.id, filter]);

  const unreadCount = db.notifications.filter(
    (n) => n.userId === currentUser.id && !n.read,
  ).length;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#080B12] dark:text-white">
            Smart Notifications
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            New grades, exam reminders, private teacher replies, and class report alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium ${
                filter === "all"
                  ? "bg-[#2563EB] text-white"
                  : "bg-white text-slate-600 dark:bg-[#0c1322] dark:text-slate-300"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-xs font-medium ${
                filter === "unread"
                  ? "bg-[#2563EB] text-white"
                  : "bg-white text-slate-600 dark:bg-[#0c1322] dark:text-slate-300"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0c1322] dark:text-slate-200 whitespace-nowrap"
            >
              <CheckCheck className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Mark all read</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1322] divide-y divide-slate-100 dark:divide-slate-800">
        {myNotifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-[#080B12] dark:text-white">
              No notifications to display
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              You are completely caught up on Makdisi School updates.
            </p>
          </div>
        ) : (
          myNotifications.map((item) => {
            const Icon = getNotifIcon(item.type);
            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  !item.read ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      !item.read
                        ? "bg-[#2563EB] text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-[#101C35] dark:text-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#080B12] dark:text-white">
                        {item.title}
                      </span>
                      {!item.read ? (
                        <span className="text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {item.body}
                    </p>
                    <div className="mt-1.5 text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.read ? (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(item.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  ) : null}
                  {item.linkView ? (
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationRead(item.id);
                        onNavigate(item.linkView as AppViewId);
                      }}
                      className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                    >
                      Open
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
