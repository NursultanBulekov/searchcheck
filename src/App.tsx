import { useState } from "react";
import ApplicationForm from "./components/ApplicationForm";
import { platforms, readApplications, statuses, STORAGE_KEY } from "./types";
import type { Application, Draft, Status } from "./types";
import "./App.css";

function App() {
  const [loaded] = useState(() => {
    try {
      return { applications: readApplications(), error: "" };
    } catch (error) {
      return {
        applications: [] as Application[],
        error:
          error instanceof Error
            ? error.message
            : "Browser storage unavailable.",
      };
    }
  });
  const [applications, setApplications] = useState(loaded.applications);
  const [error, setError] = useState(loaded.error);
  const [editing, setEditing] = useState<Application | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [platform, setPlatform] = useState("All platforms");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Save changes before updating the page, so storage failures cannot silently lose data.
  function persist(next: Application[]) {
    if (loaded.error) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setApplications(next);
      setError("");
      return true;
    } catch {
      setError(
        "Could not save to browser storage. Your previous applications are unchanged. Export a backup and check available storage.",
      );
      return false;
    }
  }

  function save(draft: Draft) {
    const next =
      editing && editing !== "new"
        ? applications.map((application) =>
            application.id === editing.id
              ? { ...draft, id: application.id }
              : application,
          )
        : [{ ...draft, id: crypto.randomUUID() }, ...applications];
    if (persist(next)) setEditing(null);
  }

  function changeStatus(id: string, next: Status) {
    persist(
      applications.map((application) =>
        application.id === id ? { ...application, status: next } : application,
      ),
    );
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(applications, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "job-applications.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function clearFilters() {
    setQuery("");
    setStatus("All statuses");
    setPlatform("All platforms");
  }

  const visible = applications
    .filter(
      (application) =>
        (status === "All statuses" || application.status === status) &&
        (platform === "All platforms" || application.platform === platform) &&
        `${application.company} ${application.role} ${application.summary} ${application.response}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));

  const waiting = applications.filter(
    (application) =>
      application.status === "Applied" || application.status === "Waiting",
  ).length;
  const interviews = applications.filter(
    (application) => application.status === "Interview",
  ).length;
  const offers = applications.filter(
    (application) => application.status === "Offer",
  ).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon">↗</span>next
          <span className="brand-dot">.</span>
        </a>
        <span className="workspace-label">MY JOB SEARCH</span>
        <span className="local-badge">
          <i /> Saved on this device
        </span>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <span className="eyebrow">ONE STEP CLOSER</span>
            <h1>Your next chapter.</h1>
            <p>A little organization for your next big opportunity.</p>
          </div>
          <button
            className="primary"
            disabled={!!loaded.error || !!editing}
            onClick={() => {
              setEditing("new");
              setDeleting(null);
            }}
          >
            + New application
          </button>
        </div>

        <section className="stats" aria-label="Application overview">
          {[
            [
              "Total applications",
              applications.length,
              "Every opportunity, in one place",
            ],
            ["Awaiting response", waiting, "Applied and waiting"],
            ["Interviews", interviews, "Conversations in progress"],
            ["Offers", offers, "Something to celebrate"],
          ].map(([label, count, detail]) => (
            <div className="stat" key={label}>
              <span>{label}</span>
              <strong>{count}</strong>
              <small>{detail}</small>
            </div>
          ))}
        </section>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {editing ? (
          <ApplicationForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? undefined : editing}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <>
            <div className="section-heading">
              <div>
                <h2>
                  Applications{" "}
                  <span className="count">{applications.length}</span>
                </h2>
                <p>Keep the details. See the progress.</p>
              </div>
              <button
                className="quiet"
                disabled={!applications.length}
                onClick={exportData}
              >
                ↓ Export backup
              </button>
            </div>
            <div className="filters">
              <label className="search">
                <span className="sr-only">Search applications</span>
                <input
                  type="search"
                  placeholder="Search company, role, or notes…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label>
                <span className="sr-only">Filter by status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option>All statuses</option>
                  {statuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by platform</span>
                <select
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                >
                  <option>All platforms</option>
                  {platforms.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="applications">
              {visible.length ? (
                visible.map((application) => (
                  <article
                    className={`application ${application.status === "Completed" ? "is-complete" : ""}`}
                    key={application.id}
                  >
                    <div className="application-top">
                      <div className="company-icon" aria-hidden="true">
                        {application.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="job-heading">
                        <h3>{application.role}</h3>
                        <p>
                          {application.company} <span>·</span>{" "}
                          {application.platform} <span>·</span>{" "}
                          {new Date(
                            `${application.appliedOn}T12:00:00`,
                          ).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <label
                        className={`status-select status-${application.status.toLowerCase()}`}
                      >
                        <span className="sr-only">
                          Status for {application.role} at {application.company}
                        </span>
                        <select
                          value={application.status}
                          onChange={(event) =>
                            changeStatus(
                              application.id,
                              event.target.value as Status,
                            )
                          }
                        >
                          {statuses.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {application.summary && (
                      <p className="summary">{application.summary}</p>
                    )}
                    {application.response && (
                      <div className="response">
                        <span className="eyebrow">RESPONSE & NOTES</span>
                        <p>{application.response}</p>
                      </div>
                    )}
                    {application.description && (
                      <details>
                        <summary>Full job description</summary>
                        <p className="description">{application.description}</p>
                      </details>
                    )}
                    <div className="application-footer">
                      <label className="completion">
                        <input
                          type="checkbox"
                          checked={application.status === "Completed"}
                          onChange={(event) =>
                            changeStatus(
                              application.id,
                              event.target.checked ? "Completed" : "Waiting",
                            )
                          }
                        />
                        Completed
                      </label>
                      <div className="row-actions">
                        {application.url &&
                          /^https?:\/\//i.test(application.url) && (
                            <a
                              href={application.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Job posting ↗
                            </a>
                          )}
                        <button
                          className="quiet"
                          onClick={() => setEditing(application)}
                        >
                          Edit
                        </button>
                        <button
                          className="quiet danger"
                          onClick={() => setDeleting(application.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {deleting === application.id && (
                      <div className="delete-confirm" role="alert">
                        <p>Delete this application permanently?</p>
                        <button
                          className="quiet"
                          onClick={() => setDeleting(null)}
                        >
                          Keep it
                        </button>
                        <button
                          className="secondary danger"
                          onClick={() => {
                            if (
                              persist(
                                applications.filter(
                                  (item) => item.id !== application.id,
                                ),
                              )
                            )
                              setDeleting(null);
                          }}
                        >
                          Delete application
                        </button>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="empty">
                  <span className="empty-icon">↗</span>
                  <h3>
                    {applications.length
                      ? "No matching applications"
                      : "Your next opportunity starts here."}
                  </h3>
                  <p>
                    {applications.length
                      ? "Try a different search or filter."
                      : "Add a role you applied for. Keep the posting, track replies, and take the next step."}
                  </p>
                  <button
                    className="secondary"
                    disabled={!!loaded.error}
                    onClick={() =>
                      applications.length ? clearFilters() : setEditing("new")
                    }
                  >
                    {applications.length
                      ? "Clear filters"
                      : "+ Add your first application"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        <footer>
          Small steps. New possibilities.
          <span>Stored in this browser · Export a backup to keep a copy.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
