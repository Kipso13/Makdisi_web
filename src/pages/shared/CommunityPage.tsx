import React, { useMemo, useState } from "react";
import {
  Bookmark,
  BookOpen,
  Heart,
  MessageCircle,
  PlayCircle,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { ImageWithFallback } from "../../components/common/ImageWithFallback";
import { useSchool } from "../../context/SchoolContext";
import { CAMPUS_IMAGES } from "../../db/demoData";
import type { AcademicLevel, CommunityCategory, CommunityPost } from "../../db/types";

const CATEGORIES: CommunityCategory[] = [
  "Mathematics",
  "Physics & Chemistry",
  "Biology & Geology (SVT)",
  "Languages",
  "History & Geography",
  "Computer Science",
  "Study Techniques",
  "Exam Preparation",
];

const LEVELS: (AcademicLevel | "All Levels")[] = [
  "All Levels",
  "Tronc Commun Sciences",
  "1ère Bac Sciences Math",
  "2ème Bac Physique",
];

export function CommunityPage() {
  const {
    currentUser,
    db,
    createCommunityPost,
    toggleLikePost,
    toggleSavePost,
    addCommunityComment,
    deleteCommunityPost,
    toggleFollowTopic,
  } = useSchool();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLevel, setSelectedLevel] = useState<string>("All Levels");
  const [savedOnly, setSavedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePost, setActivePost] = useState<CommunityPost | null>(null);
  const [commentText, setCommentText] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommunityPost | null>(null);

  // Share form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CommunityCategory>("Mathematics");
  const [academicLevel, setAcademicLevel] = useState<CommunityPost["academicLevel"]>("All Levels");
  const [mediaType, setMediaType] = useState<"video" | "guide">("video");
  const [durationOrReadTime, setDurationOrReadTime] = useState("10 min");
  const [thumbnailChoice, setThumbnailChoice] = useState<string>(CAMPUS_IMAGES.math);

  if (!currentUser) return null;

  const followedTopics = currentUser.followedTopics || [];

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return db.communityPosts
      .filter((post) => {
        if (selectedCategory !== "All" && post.category !== selectedCategory) return false;
        if (selectedLevel !== "All Levels" && post.academicLevel !== selectedLevel) return false;
        if (savedOnly && !post.savedBy.includes(currentUser.id)) return false;
        if (
          q &&
          !post.title.toLowerCase().includes(q) &&
          !post.description.toLowerCase().includes(q) &&
          !post.authorName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [db.communityPosts, selectedCategory, selectedLevel, savedOnly, searchQuery, currentUser.id]);

  // Keep modal synced with latest likes/comments
  const syncedActivePost = useMemo(() => {
    if (!activePost) return null;
    return db.communityPosts.find((p) => p.id === activePost.id) || null;
  }, [activePost, db.communityPosts]);

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    createCommunityPost({
      title: title.trim(),
      description: description.trim(),
      category,
      academicLevel,
      mediaType,
      durationOrReadTime: durationOrReadTime.trim() || "10 min",
      thumbnailUrl: thumbnailChoice || undefined,
    });
    setTitle("");
    setDescription("");
    setShareModalOpen(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncedActivePost || !commentText.trim()) return;
    addCommunityComment(syncedActivePost.id, commentText.trim());
    setCommentText("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#080B12] dark:text-white">
            Learning Community
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Educational videos, study guides, and exam tips shared by Makdisi School teachers and
            students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShareModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Share resource</span>
        </button>
      </div>

      {/* Filters & Topics Bar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-[#0c1322] space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, study notes, or authors..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
            />
          </div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            aria-label="Filter by academic level"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSavedOnly((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              savedOnly
                ? "border-[#2563EB] bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-[#60A5FA]"
                : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#101C35]"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Saved</span>
          </button>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === "All"
                ? "bg-[#101C35] text-white dark:bg-[#2563EB]"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#101C35] dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            All Subjects
          </button>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            const followed = followedTopics.includes(cat);
            return (
              <div key={cat} className="inline-flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "bg-[#2563EB] text-white"
                      : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-[#080B12] dark:text-slate-300 dark:hover:bg-[#101C35]"
                  }`}
                >
                  {cat}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFollowTopic(cat)}
                  title={followed ? `Unfollow ${cat}` : `Follow ${cat}`}
                  className={`px-2 py-1.5 text-[11px] border-l border-slate-200 dark:border-slate-700 transition-colors ${
                    followed
                      ? "bg-blue-50 text-[#2563EB] font-semibold dark:bg-blue-950/60 dark:text-[#60A5FA]"
                      : "bg-slate-50 text-slate-500 hover:text-[#080B12] dark:bg-[#101C35] dark:text-slate-400"
                  }`}
                >
                  {followed ? "Following" : "+ Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resource Grid */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#0c1322]">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No learning resources match your current filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => {
            const liked = post.likes.includes(currentUser.id);
            const saved = post.savedBy.includes(currentUser.id);
            const canDelete =
              currentUser.role === "admin" || post.authorId === currentUser.id;

            return (
              <article
                key={post.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-[#0c1322] transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setActivePost(post)}
                  className="relative h-44 w-full overflow-hidden text-left group"
                >
                  <ImageWithFallback
                    src={post.thumbnailUrl}
                    alt={post.title}
                    fallbackTitle={post.category}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {post.mediaType === "video" ? (
                        <PlayCircle className="h-4 w-4 text-[#60A5FA]" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-[#60A5FA]" />
                      )}
                      {post.mediaType === "video" ? "Video Lesson" : "Study Guide"} ·{" "}
                      {post.durationOrReadTime}
                    </span>
                  </div>
                </button>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-xs text-[#2563EB] dark:text-[#60A5FA] font-medium">
                    {post.category} · {post.academicLevel}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePost(post)}
                    className="mt-1.5 text-left font-display text-base font-semibold text-[#080B12] dark:text-white hover:text-[#2563EB] dark:hover:text-[#60A5FA] line-clamp-2"
                  >
                    {post.title}
                  </button>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 flex-1">
                    {post.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">
                      {post.authorName} ·{" "}
                      <span className="capitalize">{post.authorRole}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleLikePost(post.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 tabular-nums ${
                          liked ? "text-red-500 font-semibold" : ""
                        }`}
                        aria-label="Like resource"
                      >
                        <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
                        {post.likes.length}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePost(post)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 tabular-nums"
                        aria-label="Comments"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post.comments.length}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSavePost(post.id)}
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          saved ? "text-[#2563EB] dark:text-[#60A5FA]" : ""
                        }`}
                        aria-label="Save resource"
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
                      </button>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(post)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          aria-label="Delete resource"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail & Comments Modal */}
      {syncedActivePost ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#101C35]">
            <div className="relative h-56 w-full">
              <ImageWithFallback
                src={syncedActivePost.thumbnailUrl}
                alt={syncedActivePost.title}
                fallbackTitle={syncedActivePost.category}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActivePost(null)}
                className="absolute top-3 right-3 rounded-lg bg-black/60 p-2 text-white hover:bg-black/80"
                aria-label="Close resource modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                  {syncedActivePost.category} · {syncedActivePost.academicLevel} ·{" "}
                  {syncedActivePost.mediaType === "video" ? "Video Lesson" : "Study Guide"} (
                  {syncedActivePost.durationOrReadTime})
                </div>
                <h3 className="mt-1 font-display text-xl font-bold text-[#080B12] dark:text-white">
                  {syncedActivePost.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-200">
                  {syncedActivePost.description}
                </p>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Shared by {syncedActivePost.authorName} ({syncedActivePost.authorRole}) ·{" "}
                  {new Date(syncedActivePost.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-[#080B12] dark:text-white">
                  Discussion ({syncedActivePost.comments.length})
                </h4>
                <div className="space-y-2.5 max-h-52 overflow-y-auto">
                  {syncedActivePost.comments.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No comments yet. Ask a question or share a tip below.
                    </p>
                  ) : (
                    syncedActivePost.comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl bg-slate-50 dark:bg-[#080B12] p-3 text-xs"
                      >
                        <div className="font-semibold text-[#080B12] dark:text-white">
                          {c.authorName} ·{" "}
                          <span className="font-normal text-slate-500 capitalize">
                            {c.authorRole}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a helpful note or question..."
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Share Resource Modal */}
      {shareModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#101C35]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#080B12] dark:text-white">
                Share Educational Video or Study Guide
              </h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Limits & Continuity Quick Revision Sheet"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Subject Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CommunityCategory)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Academic Level
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) =>
                      setAcademicLevel(e.target.value as CommunityPost["academicLevel"])
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as "video" | "guide")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  >
                    <option value="video">Video Lesson</option>
                    <option value="guide">Study Guide</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Duration / Read time
                  </label>
                  <input
                    type="text"
                    value={durationOrReadTime}
                    onChange={(e) => setDurationOrReadTime(e.target.value)}
                    placeholder="12 min"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Cover Theme
                </label>
                <select
                  value={thumbnailChoice}
                  onChange={(e) => setThumbnailChoice(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                >
                  <option value={CAMPUS_IMAGES.math}>Mathematics & Problem Solving</option>
                  <option value={CAMPUS_IMAGES.physics}>Physics & Science Lab</option>
                  <option value={CAMPUS_IMAGES.robotics}>Robotics & Engineering</option>
                  <option value={CAMPUS_IMAGES.debate}>Languages & Debate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Summary & Study Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the core formulas, study strategy, or video highlights..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#080B12] focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#080B12] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Publish resource
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove Community Resource"
        description={`Are you sure you want to remove "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCommunityPost(deleteTarget.id);
            setDeleteTarget(null);
            if (activePost?.id === deleteTarget.id) setActivePost(null);
          }
        }}
      />
    </div>
  );
}
