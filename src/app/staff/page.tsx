"use client";

import { useCallback, useEffect, useState } from "react";
import { Segment } from "@/components/Segment";
import { StickerCard } from "@/components/Sticker";
import { StickerView } from "@/components/StickerDetail";
import { TopBar } from "@/components/TopBar";
import { useAppState } from "@/components/useAppState";
import { api, postJson } from "@/lib/api";
import {
  PENALTY_DAYS,
  REPORT_REASONS,
  type StaffReport,
  type StaffSticker,
} from "@/lib/types";

type Tab = "reports" | "stickers";

function Reports({ onCount }: { onCount: (count: number) => void }) {
  const [reports, setReports] = useState<StaffReport[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { reports } = await api<{ reports: StaffReport[] }>("/api/staff/reports");
      setReports(reports);
      onCount(reports.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, [onCount]);

  useEffect(() => {
    load();
  }, [load]);

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

  if (error && !reports) return <p className="error">{error}</p>;
  if (!reports) {
    return (
      <div className="stack empty">
        <div className="spinner" />
      </div>
    );
  }
  if (reports.length === 0) return <p className="note empty">No reports waiting.</p>;

  return (
    <div className="staff-list">
      {error && <p className="error">{error}</p>}
      {reports.map((report) => (
        <div key={report.id} className="card stack">
          <p className="tag">{REPORT_REASONS[report.reason]}</p>
          <StickerView sticker={report.sticker} />
          <p className="note">
            Remove: hides the sticker, blocks its maker for {PENALTY_DAYS} days, rewards everyone
            who reported it.
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
  );
}

// Every sticker ever made, newest first. Removed ones are dimmed.
function AllStickers() {
  const [stickers, setStickers] = useState<StaffSticker[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<StaffSticker | null>(null);
  const [busy, setBusy] = useState(false);

  async function setHidden(sticker: StaffSticker, hidden: boolean) {
    const question = hidden
      ? `Remove "${sticker.name}"? Its maker will see a notice. No penalty is applied.`
      : `Put "${sticker.name}" back?`;
    if (!window.confirm(question)) return;
    setBusy(true);
    setError("");
    try {
      await postJson("/api/staff/stickers", { stickerId: sticker.id, hidden });
      setStickers((all) => all.map((s) => (s.id === sticker.id ? { ...s, hidden } : s)));
      setOpen(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setBusy(false);
  }

  const loadMore = useCallback(async (offset: number) => {
    setLoading(true);
    setError("");
    try {
      const page = await api<{ total: number; stickers: StaffSticker[] }>(
        `/api/staff/stickers?offset=${offset}`,
      );
      setTotal(page.total);
      setStickers((current) => (offset === 0 ? page.stickers : [...current, ...page.stickers]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMore(0);
  }, [loadMore]);

  return (
    <>
      {total !== null && (
        <p className="note" style={{ marginBottom: 12 }}>
          {total} sticker{total === 1 ? "" : "s"} in total
        </p>
      )}
      <div className="album-grid">
        {stickers.map((sticker) => (
          <button
            key={sticker.id}
            className="album-item"
            data-hidden={sticker.hidden}
            onClick={() => setOpen(sticker)}
          >
            <StickerCard sticker={sticker} />
            {sticker.hidden && <span className="removed">Removed</span>}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {loading && (
        <div className="stack empty">
          <div className="spinner" />
        </div>
      )}
      {!loading && total !== null && stickers.length < total && (
        <div className="actions">
          <button className="btn btn-ghost" onClick={() => loadMore(stickers.length)}>
            Load more
          </button>
        </div>
      )}
      {open && (
        <div className="modal" onClick={() => !busy && setOpen(null)}>
          <div className="modal-content card stack" onClick={(e) => e.stopPropagation()}>
            {open.hidden && <p className="tag">Removed</p>}
            <StickerView sticker={open} />
            <div className="row">
              {open.hidden ? (
                <button className="btn" disabled={busy} onClick={() => setHidden(open, false)}>
                  Put back
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  disabled={busy}
                  onClick={() => setHidden(open, true)}
                >
                  Remove
                </button>
              )}
              <button className="btn btn-ghost" disabled={busy} onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function StaffPage() {
  const { state } = useAppState();
  const [tab, setTab] = useState<Tab>("stickers");
  // Reports waiting for a decision, shown on the tab so they are not missed.
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    if (!state) return;
    api<{ reports: StaffReport[] }>("/api/staff/reports")
      .then((data) => setWaiting(data.reports.length))
      .catch(() => {});
  }, [state]);

  return (
    <main>
      <TopBar title="Staff" />
      <div className="toggles">
        <Segment
          value={tab}
          onChange={setTab}
          options={[
            ["stickers", "All stickers"],
            ["reports", waiting > 0 ? `Reports (${waiting})` : "Reports"],
          ]}
        />
      </div>
      {state && (tab === "reports" ? <Reports onCount={setWaiting} /> : <AllStickers />)}
    </main>
  );
}
