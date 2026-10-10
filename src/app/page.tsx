"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
// How many breads and stickers the home row holds.
const SHOWN = 3;

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


  const showCoffee =
    Boolean(SUPPORT_URL && state) &&
    (SUPPORT_COUNTRIES.length === 0 || SUPPORT_COUNTRIES.includes(state?.country ?? ""));

  // The home row has three fixed spots. A spot holds a bagged bread while there are draws
  // left for it; opening one puts the drawn sticker in that same spot.
  const drawn = state?.drawnToday ?? [];
  const breadsLeft = !state ? 0 : state.unlimited ? STAFF_BREADS : state.drawsLeft;
  const [opening, setOpening] = useState<number | null>(null);
  // The bread pictures in a random order, so neighbors never match.
  const [looks] = useState(() =>
    Array.from({ length: BREADS }, (_, i) => i + 1).sort(() => Math.random() - 0.5),
  );
  // spotOf[i] is the spot the i-th sticker drawn today came out of. Remembered on this
  // device for the day; stickers drawn elsewhere fill the spots from the left.
  const spotsKey = state ? `spots:${state.date}` : "";
  const [saved, setSaved] = useState<number[]>([]);
  useEffect(() => {
    if (!spotsKey) return;
    try {
      const value = JSON.parse(localStorage.getItem(spotsKey) || "[]");
      if (Array.isArray(value)) setSaved(value.filter((n) => Number.isInteger(n)));
    } catch {}
  }, [spotsKey]);
  const spotOf = drawn.map((_, i) => (saved[i] >= 0 && saved[i] < SHOWN ? saved[i] : i % SHOWN));
  // How many stickers stay on the row: the spots no bread is waiting for. Staff never run
  // out of breads, so they keep just their newest one.
  const keep = Math.min(drawn.length, state?.unlimited ? 1 : SHOWN - Math.min(SHOWN, breadsLeft));
  const spots: (Sticker | "bread" | null)[] = Array(SHOWN).fill(null);
  let kept = 0;
  for (let i = drawn.length - 1; i >= 0 && kept < keep; i--) {
    if (spots[spotOf[i]] === null) {
      spots[spotOf[i]] = drawn[i];
      kept++;
    }
  }
  let breads = Math.min(SHOWN, breadsLeft);
  for (let spot = 0; spot < SHOWN && breads > 0; spot++) {
    if (spots[spot] === null) {
      spots[spot] = "bread";
      breads--;
    }
  }
  const firstBread = spots.indexOf("bread");
  // A spot gets a different bread picture each time a new one lands there.
  const look = (spot: number) =>
    looks[(spot + SHOWN * spotOf.filter((s) => s === spot).length) % looks.length];

  async function openBread(spot: number) {
    if (opening !== null) return;
    setOpening(spot);
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
      const next = [...spotOf, spot];
      try {
        localStorage.setItem(spotsKey, JSON.stringify(next));
      } catch {}
      await refresh();
      setSaved(next);
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
          <div className="shelf-items shelf-row">
            {spots.map((item, spot) =>
              item === null ? (
                <span key={spot} className="slot" />
              ) : item === "bread" ? (
                <button
                  key={spot}
                  className="slot"
                  aria-label="Open a snack"
                  data-spin={opening === spot}
                  onClick={() => openBread(spot)}
                >
                  {hints && spot === firstBread && <span className="hint">Open me</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="art" src={`/art/bread-${look(spot)}.png`} alt="" draggable={false} />
                </button>
              ) : (
                <button
                  key={spot}
                  className="slot slot-sticker"
                  aria-label={`Sticker ${item.name}`}
                  onClick={() => setShown({ sticker: item, drawn: true })}
                >
                  <StickerCard sticker={item} />
                </button>
              ),
            )}
          </div>
          {state && breadsLeft === 0 && (
            <p className="shelf-note">Make a sticker to get another snack</p>
          )}
        </section>
      </div>

      <div className="home-actions">
        <button className="btn btn-ghost" onClick={() => router.push("/album")}>
          Album
        </button>
        <button
          className="btn"
          onClick={() =>
            state && !state.makingOpen
              ? showToast("Today's stickers are all made. Making opens again tomorrow.")
              : enter(
                  "/create",
                  state?.createsLeft,
                  "No sticker chances left today. Come back tomorrow!",
                )
          }
        >
          Make
        </button>
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
