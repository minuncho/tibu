"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlbumArt, CameraArt, EmptyStickerArt, GachaArt } from "@/components/Art";
import { Coffee } from "@/components/Coffee";
import { RemovalNotice } from "@/components/RemovalNotice";
import { StickerCard } from "@/components/Sticker";
import { StickerDetail } from "@/components/StickerDetail";
import { clearAppState, useAppState } from "@/components/useAppState";
import { api } from "@/lib/api";
import { SUPPORT_COUNTRIES, SUPPORT_URL } from "@/lib/legal";
import { markHomeSeen } from "@/lib/nav";

export default function HomePage() {
  const router = useRouter();
  const { state } = useAppState();
  const [showLatest, setShowLatest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // id restarts the fade animation when the same notice is shown again
  const [toast, setToast] = useState({ id: 0, text: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(markHomeSeen, []);

  const now = new Date();
  const date = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const day = now.toLocaleDateString("en-US", { weekday: "long" });

  const latest = state?.latest ?? null;
  const showCoffee =
    Boolean(SUPPORT_URL && state) &&
    (SUPPORT_COUNTRIES.length === 0 || SUPPORT_COUNTRIES.includes(state?.country ?? ""));

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

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" });
    clearAppState();
    router.replace("/login");
  }

  return (
    <main className="home">
      <header className="home-head">
        <h1 className="home-date" suppressHydrationWarning>
          {date}
        </h1>
        <p className="home-day" suppressHydrationWarning>
          {day}
        </p>
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

      <div className="grid">
        <button
          className="tile"
          aria-label="Draw a sticker"
          onClick={() =>
            enter("/draw", state?.drawsLeft, "No draws left today. Make a sticker to earn one!")
          }
        >
          <GachaArt />
        </button>

        <button
          className="tile"
          aria-label="Make a sticker"
          onClick={() =>
            enter(
              "/create",
              state?.createsLeft,
              "No sticker chances left today. Come back tomorrow!",
            )
          }
        >
          <CameraArt />
        </button>

        <button className="tile" aria-label="Sticker album" onClick={() => router.push("/album")}>
          <AlbumArt />
        </button>

        <button
          className="tile tile-latest"
          aria-label="Latest sticker"
          disabled={!latest}
          onClick={() => setShowLatest(true)}
        >
          {latest ? <StickerCard sticker={latest} /> : <EmptyStickerArt />}
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
              you made stay in Tibu for others to collect, no longer linked to you.
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

      {showLatest && latest && (
        <StickerDetail sticker={latest} onClose={() => setShowLatest(false)} />
      )}
    </main>
  );
}
