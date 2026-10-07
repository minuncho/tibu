"use client";

import { useState } from "react";
import { postJson } from "@/lib/api";
import { REPORT_REASONS, type ReportReason, type Sticker } from "@/lib/types";

// Shown under a freshly drawn sticker. Staff review every report by hand.
export function ReportButton({ sticker }: { sticker: Sticker }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!reason) return;
    setBusy(true);
    setError("");
    try {
      await postJson("/api/reports", { stickerId: sticker.id, reason });
      setSent(true);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="link" disabled={sent} onClick={() => setOpen(true)}>
        {sent ? "Reported. Our staff will take a look." : "Report this sticker"}
      </button>

      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="modal-content card stack" onClick={(e) => e.stopPropagation()}>
            <h2>What is wrong with it?</h2>
            <div className="reasons">
              {(Object.keys(REPORT_REASONS) as ReportReason[]).map((key) => (
                <button
                  key={key}
                  className="reason"
                  data-on={key === reason}
                  onClick={() => setReason(key)}
                >
                  {REPORT_REASONS[key]}
                </button>
              ))}
            </div>
            <p className="note">
              Staff check every report. If they agree, the sticker is removed and you get a bonus
              draw. If not, nothing is refunded.
            </p>
            {error && <p className="error">{error}</p>}
            <div className="actions" style={{ marginTop: 0 }}>
              <button className="btn" disabled={!reason || busy} onClick={send}>
                {busy ? "Sending..." : "Send report"}
              </button>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
