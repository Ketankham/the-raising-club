"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FeedbackType = "bug" | "improvement" | "idea";
type FormState = "idle" | "submitting" | "success" | "error";

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Bug",
  improvement: "Improvement",
  idea: "Idea",
};

const TYPE_COLORS: Record<FeedbackType, string> = {
  bug: "#E24B4A",
  improvement: "#BA7517",
  idea: "#1D9E75",
};

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>("idle");
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setType("bug");
    setTitle("");
    setDescription("");
    setEmail("");
    setScreenshot(null);
    setScreenshotPreview(null);
    setFormState("idle");
    setIssueUrl(null);
    setErrorMsg("");
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(reset, 300);
  }, [reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node))
        handleClose();
    };
    setTimeout(() => document.addEventListener("pointerdown", onPointer), 0);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, handleClose]);

  const handleScreenshotFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/"),
    );
    if (item) {
      const file = item.getAsFile();
      if (file) handleScreenshotFile(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleScreenshotFile(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMsg("");

    const fd = new FormData();
    fd.append("type", type);
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("email", email.trim());
    fd.append("pageUrl", window.location.href);
    if (screenshot) fd.append("screenshot", screenshot);

    try {
      const res = await fetch("/api/feedback", { method: "POST", body: fd });
      const data = (await res.json()) as {
        issueUrl?: string;
        error?: string;
      };
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Something went wrong. Try again.");
        setFormState("error");
        return;
      }
      setIssueUrl(data.issueUrl || null);
      setFormState("success");
    } catch {
      setErrorMsg("Network error. Try again.");
      setFormState("error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9000,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 16px",
          borderRadius: "99px",
          background: "var(--color-primary, #ED9A4E)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          letterSpacing: "0.01em",
          boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9001,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: "24px",
          }}
        >
          <div
            ref={modalRef}
            onPaste={handlePaste}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              background: "#fff",
              borderRadius: "16px",
              width: "min(100%, 440px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
              overflow: "hidden",
              animation: "fb-slide-up 0.2s ease",
            }}
          >
            <div style={{ padding: "18px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#504644" }}>
                Send feedback
              </span>
              <button
                type="button"
                onClick={handleClose}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: "4px", lineHeight: 1 }}
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {formState === "success" ? (
              <SuccessPane issueUrl={issueUrl} onClose={handleClose} onAnother={reset} />
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: "16px 20px 20px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                  {(Object.keys(TYPE_LABELS) as FeedbackType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: "99px",
                        border: `1.5px solid ${type === t ? TYPE_COLORS[t] : "#e2e8f0"}`,
                        background: type === t ? `${TYPE_COLORS[t]}18` : "transparent",
                        color: type === t ? TYPE_COLORS[t] : "#555",
                        fontWeight: type === t ? 600 : 400,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>

                <input
                  required
                  placeholder="Short title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  style={inputStyle}
                />

                <textarea
                  required
                  placeholder="Describe the issue or idea..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
                />

                <input
                  type="email"
                  placeholder="Your email (optional, for follow-up)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />

                {screenshotPreview ? (
                  <div style={{ position: "relative", marginBottom: "12px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      style={{ width: "100%", borderRadius: "8px", border: "1px solid #e2e8f0", maxHeight: "160px", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                      style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "99px", padding: "2px 8px", fontSize: "0.72rem", cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: "100%", padding: "10px", marginBottom: "12px", border: "1.5px dashed #e2e8f0", borderRadius: "8px", background: "#faf7f2", color: "#666", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    Attach screenshot — or paste / drag &amp; drop
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScreenshotFile(f); }}
                />

                {formState === "error" && (
                  <p style={{ color: "#E24B4A", fontSize: "0.8rem", margin: "0 0 10px" }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: formState === "submitting" ? "#e2e8f0" : "var(--color-primary, #ED9A4E)", color: formState === "submitting" ? "#555" : "#fff", border: "none", fontWeight: 600, fontSize: "0.88rem", cursor: formState === "submitting" ? "not-allowed" : "pointer" }}
                >
                  {formState === "submitting" ? "Submitting…" : "Submit feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fb-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function SuccessPane({ issueUrl, onClose, onAnother }: { issueUrl: string | null; onClose: () => void; onAnother: () => void }) {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div style={{ fontSize: "2rem", marginBottom: "8px", color: "#1D9E75" }}>✓</div>
      <p style={{ fontWeight: 700, marginBottom: "6px", color: "#504644" }}>Feedback submitted</p>
      {issueUrl && (
        <a href={issueUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--color-primary, #ED9A4E)", wordBreak: "break-all" }}>
          View GitHub issue →
        </a>
      )}
      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <button type="button" onClick={onAnother} style={{ ...pillBtn, flex: 1 }}>Submit another</button>
        <button type="button" onClick={onClose} style={{ ...pillBtn, flex: 1, background: "var(--color-primary, #ED9A4E)", color: "#fff", border: "none" }}>Done</button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  marginBottom: "10px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "0.88rem",
  background: "#fff",
  color: "#111",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const pillBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1.5px solid #e2e8f0",
  background: "transparent",
  cursor: "pointer",
  fontSize: "0.82rem",
  fontWeight: 500,
};
