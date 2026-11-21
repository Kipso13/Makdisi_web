import React, { useMemo, useState } from "react";
import { CalendarDays, Check, Clock, MapPin, Users } from "lucide-react";
import { ImageWithFallback } from "../../components/common/ImageWithFallback";
import { useSchool } from "../../context/SchoolContext";

export function ClubsPage() {
  const { currentUser, db, toggleClubMembership } = useSchool();
  const [filter, setFilter] = useState<"all" | "joined">("all");

  if (!currentUser) return null;

  const visibleClubs = useMemo(() => {
    if (filter === "joined") {
      return db.clubs.filter((c) => c.memberIds.includes(currentUser.id));
    }
    return db.clubs;
  }, [db.clubs, filter, currentUser.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Makdisi School Clubs & Societies</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explore student clubs, weekly meeting times, room locations, and club announcements
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-[#101C35] self-start">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filter === "all"
                ? "bg-white text-[#080B12] shadow-xs dark:bg-[#2563EB] dark:text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            All clubs ({db.clubs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("joined")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filter === "joined"
                ? "bg-white text-[#080B12] shadow-xs dark:bg-[#2563EB] dark:text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            My clubs ({db.clubs.filter((c) => c.memberIds.includes(currentUser.id)).length})
          </button>
        </div>
      </div>

      {visibleClubs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#0c1322]">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You haven’t joined any clubs yet. Switch to All clubs to join one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleClubs.map((club) => {
            const isMember = club.memberIds.includes(currentUser.id);
            return (
              <article
                key={club.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1322] flex flex-col"
              >
                <div className="h-48 overflow-hidden bg-slate-100 dark:bg-[#101C35]">
                  <ImageWithFallback
                    src={club.imageUrl}
                    alt={club.name}
                    fallbackTitle={club.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                        {club.category} · Advisor: {club.advisorName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <Users className="h-3.5 w-3.5" />
                        <span>{club.memberIds.length}</span>
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-bold text-[#080B12] dark:text-white">
                      {club.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {club.description}
                    </p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl bg-slate-50 p-3.5 text-xs dark:bg-[#101C35]">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <CalendarDays className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
                        <span>{club.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 tabular-nums">
                        <Clock className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
                        <span>{club.meetingTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <MapPin className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
                        <span className="truncate">{club.location}</span>
                      </div>
                    </div>

                    {club.announcements.length > 0 ? (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Latest Club Announcement
                        </div>
                        {club.announcements.slice(0, 1).map((ca) => (
                          <div key={ca.id} className="mt-1 text-xs">
                            <span className="font-semibold text-[#080B12] dark:text-white">
                              {ca.title}
                            </span>{" "}
                            <span className="text-slate-500 dark:text-slate-400">
                              ({ca.date}) — {ca.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {currentUser.role === "student" ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => toggleClubMembership(club.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                          isMember
                            ? "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#101C35]"
                            : "bg-[#2563EB] text-white hover:bg-blue-700"
                        }`}
                      >
                        {isMember ? <Check className="h-3.5 w-3.5" /> : null}
                        <span>{isMember ? "Member · Leave Club" : "Join Club"}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
