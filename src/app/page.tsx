"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlbumArt, CameraArt } from "@/components/Art";
import { Coffee } from "@/components/Coffee";
import { RemovalNotice } from "@/components/RemovalNotice";
import { StickerCard } from "@/components/Sticker";
import { StickerDetail } from "@/components/StickerDetail";
import { clearAppState, useAppState } from "@/components/useAppState";
import { api } from "@/lib/api";
import type { Sticker } from "@/lib/types";
import { SUPPORT_COUNTRIES, SUPPORT_URL } from "@/lib/legal";
import { markHomeSeen } from "@/lib/nav";

const HINTS_KEY = "seenHints";
const BREADS = 12;
// Staff have no limit, so their shelf always shows this many breads.
const STAFF_BREADS = 3;

function preload(url: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = url;
    setTimeout(resolve, 3000);
  });
}

export default function HomePage() {
  const router = useRouter();
  const { state, refresh } = useAppState();
  // sticker opened full screen; "drawn" ones can be reported from there
  const [shown, setShown] = useState<{ sticker: Sticker; drawn: boolean } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // id restarts the fade animation when the same notice is shown again
  const [toast, setToast] = useState({ id: 0, text: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(markHomeSeen, []);

  // First visit only: a short label over each item says what it does. They are shown once
  // the signed-in home is up, and count as seen when the visitor leaves this screen.
  const signedIn = Boolean(state);
  const [hints, setHints] = useState(false);
  useEffect(() => {
    if (!signedIn || localStorage.getItem(HINTS_KEY)) return;
    setHints(true);
    return () => localStorage.setItem(HINTS_KEY, "1");
  }, [signedIn]);

  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "short" });
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });

  const framed = state?.latestMade ?? null;
  const showCoffee =
    Boolean(SUPPORT_URL && state) &&
    (SUPPORT_COUNTRIES.length === 0 || SUPPORT_COUNTRIES.includes(state?.country ?? ""));

  // Middle shelf: one bagged bread per draw left today. An opened one leaves its sticker in the
  // same spot. slotOf[i] is the shelf position of the i-th sticker drawn today.
  const drawn = state?.drawnToday ?? [];
  const breadsLeft = !state ? 0 : state.unlimited ? STAFF_BREADS : state.drawsLeft;
  const [slotOf, setSlotOf] = useState<number[]>([]);
  const [opening, setOpening] = useState<number | null>(null);
  // which of the bread pictures sits at each shelf position
  // The bread pictures in a random order, repeated, so neighbors never match.
  const [looks] = useState(() =>
    Array.from({ length: BREADS }, (_, i) => i + 1).sort(() => Math.random() - 0.5),
  );
  // After a reload (or anything else that changes today's draws) stickers simply come first.
  const positions = slotOf.length === drawn.length ? slotOf : drawn.map((_, i) => i);
  const slots = Array.from({ length: drawn.length + breadsLeft }, (_, slot) => {
    const i = positions.indexOf(slot);
    return i >= 0 ? drawn[i] : null;
  });

  async function openBread(slot: number) {
    if (opening !== null) return;
    setOpening(slot);
    try {
      const [{ sticker }] = await Promise.all([
        api<{ sticker: Sticker | null }>("/api/draw", { method: "POST" }),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
      if (!sticker) {
        showToast("No stickers from other owners yet. Your draw was not used.");
        return;
      }
      await preload(sticker.thumbUrl || sticker.imageUrl);
      const before = positions;
      await refresh();
      setSlotOf([...before, slot]);
      setShown({ sticker, drawn: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setOpening(null);
    }
  }

  // With no chances left the button still reacts to the tap, but shows a short notice instead of opening.
  function enter(path: string, left: number | undefined, notice: string) {
    if (left === undefined) return;
    if (left > 0) {
      router.push(path);
      return;
    }
    showToast(notice);
  }

  function showToast(text: string) {
    setToast((t) => ({ id: t.id + 1, text }));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, text: "" })), 2400);
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await api("/api/account", { method: "DELETE" });
      clearAppState();
      router.replace("/login");
    } catch (e) {
      setDeleting(false);
      setConfirmDelete(false);
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  // The theme lives on <html data-theme>; layout.tsx applies the saved one before first paint.
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" });
    clearAppState();
    router.replace("/login");
  }

  return (
    <main className="home">
      <header className="home-head">
        {state?.user && (
          <div className="profile">
            <button className="avatar" aria-label="Profile" onClick={() => setMenuOpen(!menuOpen)}>
              {state.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.user.avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                (state.user.name[0] || "?").toUpperCase()
              )}
            </button>
            {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
            {menuOpen && (
              <div className="profile-menu">
                <p className="profile-name">{state.user.name}</p>
                {state.user.isStaff && <Link href="/staff">Staff</Link>}
                <Link href="/terms">Terms of Service</Link>
                <Link href="/privacy">Privacy Policy</Link>
                <button onClick={toggleDark}>{dark ? "Light mode" : "Dark mode"}</button>
                <button onClick={signOut}>Sign out</button>
                <button
                  className="danger"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                >
                  Delete account
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {state && <RemovalNotice removed={state.removed} />}

      <div className="shelves">
        <section className="shelf">
          <div className="shelf-items">
            <div className="daycal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="art" src="/art/calendar.png" alt="" draggable={false} />
              <div className="daycal-page" suppressHydrationWarning>
                <span className="daycal-month" suppressHydrationWarning>
                  {month}
                </span>
                <span className="daycal-day" suppressHydrationWarning>
                  {now.getDate()}
                </span>
                <span className="daycal-week" suppressHydrationWarning>
                  {weekday}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="shelf">
          <div className="shelf-items shelf-row">
            {slots.map((sticker, slot) =>
              sticker ? (
                <button
                  key={slot}
                  className="slot slot-sticker"
                  aria-label={`Sticker ${sticker.name}`}
                  onClick={() => setShown({ sticker, drawn: true })}
                >
                  <StickerCard sticker={sticker} />
                </button>
              ) : (
                <button
                  key={slot}
                  className="slot"
                  aria-label="Open a snack"
                  data-spin={opening === slot}
                  onClick={() => openBread(slot)}
                >
                  {hints && slot === drawn.length && <span className="hint">Open one</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="art" src={`/art/bread-${looks[slot % looks.length]}.png`} alt="" draggable={false} />
                </button>
              ),
            )}
            {state && breadsLeft === 0 && (
              <p className="shelf-note">Make a sticker to get another snack</p>
            )}
          </div>
        </section>

        <section className="shelf">
          <div className="shelf-items">
            <button
              className="frame"
              aria-label="Your latest sticker"
              onClick={() =>
                framed
                  ? setShown({ sticker: framed, drawn: false })
                  : state && showToast("The newest sticker you make goes in this frame.")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="art" src="/art/frame.png" alt="" draggable={false} />
              <div className="frame-inside">{framed && <StickerCard sticker={framed} />}</div>
            </button>

            <button className="shelf-item" aria-label="Sticker album" onClick={() => router.push("/album")}>
              {hints && <span className="hint">Your album</span>}
              <AlbumArt />
            </button>
            <button
              className="shelf-item"
              aria-label="Make a sticker"
              onClick={() =>
                enter(
                  "/create",
                  state?.createsLeft,
                  "No sticker chances left today. Come back tomorrow!",
                )
              }
            >
              {hints && <span className="hint">Make a sticker</span>}
              <CameraArt />
            </button>
          </div>
        </section>
      </div>

      {showCoffee && <Coffee url={SUPPORT_URL} />}

      {toast.text && (
        <p key={toast.id} className="toast" role="status">
          {toast.text}
        </p>
      )}

      {confirmDelete && (
        <div className="modal" onClick={() => !deleting && setConfirmDelete(false)}>
          <div className="modal-content card stack" onClick={(e) => e.stopPropagation()}>
            <h2>Delete your account?</h2>
            <p className="note">
              Your album, draws and remaining chances are erased and cannot be recovered. Stickers
              you made stay in tibu for others to collect, no longer linked to you.
            </p>
            <div className="actions" style={{ marginTop: 0 }}>
              <button className="btn btn-danger" disabled={deleting} onClick={deleteAccount}>
                {deleting ? "Deleting..." : "Delete account"}
              </button>
              <button
                className="btn btn-ghost"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {shown && (
        <StickerDetail sticker={shown.sticker} report={shown.drawn} onClose={() => setShown(null)} />
      )}
    </main>
  );
}
