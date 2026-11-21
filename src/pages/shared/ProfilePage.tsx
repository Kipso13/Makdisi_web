import React, { useRef, useState } from "react";
import { Camera, RotateCcw, Save, Trash2 } from "lucide-react";
import { Avatar } from "../../components/common/Avatar";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useSchool } from "../../context/SchoolContext";

export function ProfilePage() {
  const { currentUser, db, updateProfile, resetDemoPlatform, notify } = useSchool();
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  if (!currentUser) return null;

  const userClass = db.classes.find((c) => c.id === currentUser.classId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      notify("Full name cannot be empty.", "error");
      return;
    }
    updateProfile({
      fullName: fullName.trim(),
      bio: bio.trim(),
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 1.5) {
      notify("Please select an image smaller than 1.5 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateProfile({ avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#080B12] dark:text-white">
          My Profile
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage your Makdisi School display photo, academic bio, and platform settings.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0c1322] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <Avatar name={currentUser.fullName} avatarUrl={currentUser.avatarUrl} size="lg" />
            <div>
              <div className="font-display text-lg font-bold text-[#080B12] dark:text-white">
                {currentUser.fullName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser.email}
              </div>
              <div className="mt-1 text-xs font-medium text-[#2563EB] dark:text-[#60A5FA] capitalize">
                {currentUser.role}
                {currentUser.isViceRepresentative ? " · Class Vice Representative" : ""}
                {userClass ? ` · ${userClass.name}` : ""}
                {currentUser.department ? ` · ${currentUser.department}` : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#101C35]"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Upload photo</span>
            </button>
            {currentUser.avatarUrl ? (
              <button
                type="button"
                onClick={() => updateProfile({ avatarUrl: undefined })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                School ID / Role
              </label>
              <input
                type="text"
                readOnly
                value={
                  currentUser.studentNumber ||
                  currentUser.department ||
                  currentUser.role.toUpperCase()
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-[#080B12] dark:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Bio & Academic Interests
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your subjects, goals, or office hours..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-[#080B12] focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#101C35] dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#101C35]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset sample data</span>
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              <span>Save profile</span>
            </button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Restore Sample Makdisi School Data"
        description="This clears local edits (new grades, messages, clubs, or reports stored in your browser) and restores the original sample data."
        confirmLabel="Restore defaults"
        destructive
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          resetDemoPlatform();
          setConfirmResetOpen(false);
        }}
      />
    </div>
  );
}
