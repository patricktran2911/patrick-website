"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Database,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PageWrapper from "@/reusable-components/PageWrapper";
import JsonFieldEditor, {
  type EditableValue,
} from "@/reusable-components/admin/JsonFieldEditor";
import {
  SITE_CONTENT_SECTION_ORDER,
  type SiteContent,
  type SiteContentSectionKey,
} from "@/lib/site-content-schema";

interface AdminRenderProps {
  initialAuthenticated: boolean;
  initialContent: SiteContent | null;
}

type StatusTone = "idle" | "success" | "error";

function getStatusClasses(tone: StatusTone) {
  if (tone === "success") {
    return "border-emerald-300/18 bg-emerald-400/10 text-emerald-100";
  }

  if (tone === "error") {
    return "border-rose-300/18 bg-rose-400/10 text-rose-100";
  }

  return "border-white/10 bg-white/[0.04] text-white/72";
}

export default function AdminRender({
  initialAuthenticated,
  initialContent,
}: AdminRenderProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState<SiteContent | null>(initialContent);
  const [draft, setDraft] = useState<SiteContent | null>(initialContent);
  const [selectedSection, setSelectedSection] = useState<SiteContentSectionKey>("global");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusTone, setStatusTone] = useState<StatusTone>("idle");
  const [statusMessage, setStatusMessage] = useState(
    initialAuthenticated
      ? "Connected to the live JSON content source."
      : "Enter the admin password to unlock editing."
  );

  const hasChanges = useMemo(() => {
    if (!content || !draft) return false;
    return JSON.stringify(content) !== JSON.stringify(draft);
  }, [content, draft]);

  const activeSectionMeta =
    SITE_CONTENT_SECTION_ORDER.find((section) => section.key === selectedSection) ??
    SITE_CONTENT_SECTION_ORDER[0];

  async function loadContent(nextStatusMessage?: string) {
    setLoading(true);
    setStatusTone("idle");

    try {
      const response = await fetch("/api/admin/content", {
        method: "GET",
        credentials: "include",
      });

      const payload = (await response.json()) as {
        content?: SiteContent;
        error?: string;
      };

      if (!response.ok || !payload.content) {
        throw new Error(payload.error ?? "Unable to load content.");
      }

      setContent(payload.content);
      setDraft(payload.content);
      setStatusMessage(nextStatusMessage ?? "Content reloaded from the JSON source.");
    } catch (error) {
      setStatusTone("error");
      setStatusMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatusTone("idle");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Admin login failed.");
      }

      setAuthenticated(true);
      setPassword("");
      await loadContent("Authenticated. Editing the live content file now.");
    } catch (error) {
      setStatusTone("error");
      setStatusMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!draft) return;

    setSaving(true);
    setStatusTone("idle");

    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: draft }),
      });

      const payload = (await response.json()) as {
        content?: SiteContent;
        error?: string;
      };

      if (!response.ok || !payload.content) {
        throw new Error(payload.error ?? "Unable to save content.");
      }

      setContent(payload.content);
      setDraft(payload.content);
      setStatusTone("success");
      setStatusMessage("Saved. The JSON content file has been updated.");
    } catch (error) {
      setStatusTone("error");
      setStatusMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAuthenticated(false);
      setContent(null);
      setDraft(null);
      setSelectedSection("global");
      setStatusTone("idle");
      setStatusMessage("Admin session closed.");
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <PageWrapper className="min-h-full px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid min-h-[calc(100dvh-7rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(15,23,42,0.82),rgba(249,115,22,0.14))] p-8 shadow-[0_36px_90px_rgba(2,6,23,0.38)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.18),transparent_28%)]" />
            <div className="relative space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-cyan-100/80">
                <ShieldCheck className="h-4 w-4" />
                Content Studio
              </div>

              <div className="max-w-2xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Control every public page from one polished admin space.
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/68 sm:text-lg">
                  This dashboard edits the live JSON content source that powers your
                  homepage, about page, projects, skills, resume, contact details,
                  site metadata, and navigation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Database,
                    title: "JSON-first architecture",
                    body: "All public portfolio content is centralized into one structured file.",
                  },
                  {
                    icon: Sparkles,
                    title: "Reusable editor",
                    body: "Arrays, nested objects, and strings all flow through the same editor system.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Protected access",
                    body: "A signed admin session guards write access to the content API routes.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 backdrop-blur"
                  >
                    <item.icon className="h-5 w-5 text-cyan-200" />
                    <h2 className="mt-4 text-base font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/52">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleLogin}
            className="rounded-[36px] border border-white/10 bg-slate-950/72 p-7 shadow-[0_32px_90px_rgba(2,6,23,0.38)] backdrop-blur-xl"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-cyan-400 to-sky-500 text-white shadow-lg shadow-cyan-500/20">
              <LockKeyhole className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-white">Admin login</h2>
            <p className="mt-2 text-sm leading-6 text-white/54">
              Use the admin password to unlock editing. This session writes directly to
              <span className="mx-1 rounded bg-white/8 px-2 py-1 font-mono text-[12px] text-white/78">
                src/content/site-content.json
              </span>
            </p>

            <label className="mt-8 block space-y-2">
              <span className="text-sm font-medium text-white/78">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-400/12"
              />
            </label>

            <button
              type="submit"
              disabled={loading || password.trim().length === 0}
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? "Unlocking..." : "Unlock admin"}
            </button>

            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${getStatusClasses(statusTone)}`}>
              {statusMessage}
            </div>
          </motion.form>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-full px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5 pb-8">
        <div className="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
            <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-200/78">
                    Content Studio
                  </p>
                  <h1 className="mt-3 text-2xl font-semibold text-white">
                    Website Admin
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-white/52">
                    Manage the live structured content that powers your portfolio.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-cyan-400 to-sky-500 text-white shadow-lg shadow-cyan-500/20">
                  <Database className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                    Sections
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {SITE_CONTENT_SECTION_ORDER.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                    Changes
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {hasChanges ? "Unsaved" : "Clean"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                    Source
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    JSON file
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={() => void loadContent()}
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Reload
                </button>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white/76 transition hover:bg-rose-400/10 hover:text-rose-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-slate-950/62 p-4 backdrop-blur-xl">
              <div className="mb-3 px-2">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/34">
                  Sections
                </p>
              </div>
              <div className="space-y-2">
                {SITE_CONTENT_SECTION_ORDER.map((section) => {
                  const active = section.key === selectedSection;

                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setSelectedSection(section.key)}
                      className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                        active
                          ? "border-cyan-400/24 bg-cyan-400/10"
                          : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{section.label}</span>
                        {active && (
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-100">
                            Editing
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-white/44">{section.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>

          <section className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-cyan-200/78">
                    Active section
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">
                    {activeSectionMeta.label}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/54">
                    {activeSectionMeta.description}
                  </p>
                </div>

                <div className={`rounded-2xl border px-4 py-3 text-sm ${getStatusClasses(statusTone)}`}>
                  {statusMessage}
                </div>
              </div>
            </div>

            <div className="rounded-[34px] border border-white/10 bg-slate-950/78 p-4 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-6">
              <AnimatePresence mode="wait" initial={false}>
                {draft && (
                  <motion.div
                    key={selectedSection}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.18 }}
                  >
                    <JsonFieldEditor
                      label={selectedSection}
                      path={selectedSection}
                      value={draft[selectedSection] as unknown as EditableValue}
                      onChange={(nextSection) =>
                        setDraft((previous) =>
                          previous
                              ? {
                                  ...previous,
                                  [selectedSection]:
                                    nextSection as unknown as SiteContent[typeof selectedSection],
                                }
                              : previous
                        )
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
