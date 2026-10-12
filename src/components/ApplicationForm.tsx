import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { platforms, statuses, today } from "../types";
import type { Application, Draft, Platform, Status } from "../types";

interface Props {
  initial?: Application;
  onSave: (draft: Draft) => void;
  onCancel: () => void;
}
export default function ApplicationForm({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(
    initial ?? {
      company: "",
      role: "",
      url: "",
      platform: "Gmail",
      status: "Applied",
      appliedOn: today(),
      description: "",
      summary: "",
      response: "",
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.company.trim() || !draft.role.trim()) return;
    if (draft.url && !/^https?:\/\//i.test(draft.url)) {
      setError("Use a job link beginning with https:// or http://.");
      return;
    }
    onSave({
      ...draft,
      company: draft.company.trim(),
      role: draft.role.trim(),
    });
  }
  async function summarize() {
    setError("");
    setBusy(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: draft.description }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Could not generate a summary.");
      if (typeof data.summary !== "string" || !data.summary.trim())
        throw new Error("No summary was returned. Please try again.");
      update("summary", data.summary);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "AI server unavailable. Please try again.",
        );
    } finally {
      setBusy(false);
    }
  }
  function cancel() {
    request.current?.abort();
    onCancel();
  }
  return (
    <section className="editor" aria-labelledby="editor-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR NEXT OPPORTUNITY</span>
          <h2 id="editor-title">
            {initial ? "Edit application" : "New application"}
          </h2>
        </div>
        <button type="button" className="quiet" onClick={cancel}>
          Cancel
        </button>
      </div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>
            Company
            <input
              autoFocus
              required
              maxLength={120}
              value={draft.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Company name"
            />
          </label>
          <label>
            Job title
            <input
              required
              maxLength={160}
              value={draft.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="e.g. Frontend developer"
            />
          </label>
          <label className="wide">
            Job posting URL
            <input
              type="url"
              value={draft.url}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label>
            Sent through
            <select
              value={draft.platform}
              onChange={(e) => update("platform", e.target.value as Platform)}
            >
              {platforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(e) => update("status", e.target.value as Status)}
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Application date
            <input
              required
              type="date"
              value={draft.appliedOn}
              onChange={(e) => update("appliedOn", e.target.value)}
            />
          </label>
          <label className="wide">
            Full job description
            <textarea
              rows={6}
              maxLength={20000}
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Paste the hiring post here…"
              disabled={busy}
            />
          </label>
        </div>
        <div className="ai-bar">
          <div>
            <strong>A little less reading.</strong>
            <p>
              Extract the responsibilities, skills, remote terms, and salary.
            </p>
          </div>
          <button
            className="secondary"
            type="button"
            disabled={busy || draft.description.trim().length < 30}
            onClick={summarize}
          >
            {busy ? "Summarizing…" : "✦ Summarize with AI"}
          </button>
        </div>
        <p className="hint">
          Sends the pasted description to the AI provider when you click. Review
          the summary before saving.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <label>
          Short description / AI summary
          <textarea
            rows={5}
            value={draft.summary}
            onChange={(e) => update("summary", e.target.value)}
            placeholder="Write your own overview, or generate one above."
            disabled={busy}
          />
        </label>
        <label>
          Response & notes
          <textarea
            rows={4}
            value={draft.response}
            onChange={(e) => update("response", e.target.value)}
            placeholder="What did they reply? Add interview details or next steps."
          />
        </label>
        <div className="form-actions">
          <button type="button" className="quiet" onClick={cancel}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            Save application
          </button>
        </div>
      </form>
    </section>
  );
}
