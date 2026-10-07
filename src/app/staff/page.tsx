"use client";

import { useCallback, useEffect, useState } from "react";
import { StickerView } from "@/components/StickerDetail";
import { TopBar } from "@/components/TopBar";
import { useAppState } from "@/components/useAppState";
import { api, postJson } from "@/lib/api";
import { PENALTY_DAYS, REPORT_REASONS, type StaffReport } from "@/lib/types";

export default function StaffPage() {
  const { state } = useAppState();
  const [reports, setReports] = useState<StaffReport[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setReports((await api<{ reports: StaffReport[] }>("/api/staff/reports")).reports);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, []);

  useEffect(() => {
    if (state) load();
  }, [state, load]);

  async function decide(reportId: string, upheld: boolean) {
    setBusy(true);
    setError("");
    try {
      await postJson("/api/staff/reports", { reportId, upheld });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    await load();
    setBusy(false);
  }

  return (
    <main>
      <TopBar title="Reports" />
      {error && <p className="error">{error}</p>}
      {reports === null ? (
        !error && (
          <div className="stack empty">
            <div className="spinner" />
          </div>
        )
      ) : reports.length === 0 ? (
        <p className="note empty">No reports waiting.</p>
      ) : (
        <div className="staff-list">
          {reports.map((report) => (
            <div key={report.id} className="card stack">
              <p className="tag">{REPORT_REASONS[report.reason]}</p>
              <StickerView sticker={report.sticker} />
              <p className="note">
                Remove: hides the sticker, blocks its maker for {PENALTY_DAYS} days, rewards
                everyone who reported it.
              </p>
              <div className="row">
                <button
                  className="btn btn-danger"
                  disabled={busy}
                  onClick={() => decide(report.id, true)}
                >
                  Remove
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => decide(report.id, false)}
                >
                  Keep
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
