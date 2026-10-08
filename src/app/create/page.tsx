"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CameraArt } from "@/components/Art";
import { Cropper, type CropperHandle } from "@/components/Cropper";
import { SpeechBubble, StickerCard } from "@/components/Sticker";
import { DownloadButton, StickerView } from "@/components/StickerDetail";
import { TopBar } from "@/components/TopBar";
import { WaitingStickers } from "@/components/WaitingStickers";
import { useAppState } from "@/components/useAppState";
import { api, postJson } from "@/lib/api";
import { cameFromHome } from "@/lib/nav";
import {
  BUBBLE_MAX,
  COUNTRY_CODES,
  CREATES_PER_DAY,
  NAME_MAX,
  STYLE_LABEL,
  flagEmoji,
  type Candidate,
  type Sticker,
  type StickerStyle,
} from "@/lib/types";

type Generation = { generationId: string; candidates: Candidate[] };

// A converted photo that has not become a sticker yet survives leaving the page,
// because its daily chance is already spent.
const PENDING_KEY = "pendingGeneration";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: regionNames.of(code) || code })).sort(
  (a, b) => a.name.localeCompare(b.name),
);

const count = (text: string) => [...text.trim()].length;

export default function CreatePage() {
  const router = useRouter();
  const { state, refresh } = useAppState();
  const fileInput = useRef<HTMLInputElement>(null);
  const cropper = useRef<CropperHandle>(null);
  // object URL of the photo being cropped
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [style, setStyle] = useState<StickerStyle | null>(null);
  const [name, setName] = useState("");
  const [bubble, setBubble] = useState("");
  const [pickedCountry, setPickedCountry] = useState<string | null>(null);
  // Until the owner picks, preselect the detected country.
  const country = pickedCountry ?? state?.country ?? "";
  const [done, setDone] = useState<Sticker | null>(null);
  // Staff only: make a throwaway sticker that is not saved and takes no number. On by default.
  const [testOnly, setTestOnly] = useState(true);
  const isStaff = Boolean(state?.user?.isStaff);

  useEffect(() => {
    // Opening this address directly (a bookmark, a typed link, a refresh) starts at home instead.
    // An unfinished sticker is kept and comes back when the camera is tapped.
    if (!cameFromHome()) {
      router.replace("/");
      return;
    }
    const saved = sessionStorage.getItem(PENDING_KEY);
    if (saved) setGeneration(JSON.parse(saved));
  }, [router]);

  if (!cameFromHome()) return null;

  function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (source) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file));
  }

  async function convert() {
    if (!cropper.current) return;
    setBusy(true);
    setError("");
    try {
      // Only the square the owner framed is uploaded.
      const photo = await cropper.current.crop();
      const form = new FormData();
      form.set("photo", photo, "pet.jpg");
      const result = await api<Generation>("/api/generate", { method: "POST", body: form });
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(result));
      setGeneration(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function make() {
    if (!generation || !style) return;
    setBusy(true);
    setError("");
    try {
      const { sticker } = await postJson<{ sticker: Sticker }>("/api/stickers", {
        generationId: generation.generationId,
        test: isStaff && testOnly,
        style,
        name,
        bubble,
        country,
      });
      sessionStorage.removeItem(PENDING_KEY);
      setDone(sticker);
      refresh().catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main>
        <TopBar title="Sticker ready!" />
        <div className="card stack">
          <StickerView sticker={done} />
          <p className="bonus">
            {done.serialNo < 0
              ? "Test sticker: not saved, no number used"
              : "+1 bonus draw for today"}
          </p>
          <div className="actions" style={{ marginTop: 0 }}>
            <DownloadButton sticker={done} />
            <Link className="btn btn-ghost" href="/draw">
              Go draw
            </Link>
            <Link className="btn btn-ghost" href="/">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (generation) {
    const chosen = generation.candidates.find((c) => c.style === style);
    const ready = style && country && count(name) >= 1 && count(bubble) >= 1;
    return (
      <main>
        <TopBar title="Make a sticker" />
        <div className="card stack">
          <p className="note">Pick the look you like best</p>
          <div className="candidates">
            {generation.candidates.map((c) => (
              <button
                key={c.style}
                className="candidate"
                data-on={c.style === style}
                onClick={() => setStyle(c.style)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.url} alt="" />
                {STYLE_LABEL[c.style]}
              </button>
            ))}
          </div>
          {state && !state.aiEnabled && (
            <p className="note">AI conversion is off (no OpenAI key), so all three show your photo.</p>
          )}

          {chosen && (
            <>
              <div className="sticker-view">
                <SpeechBubble text={bubble.trim() || "..."} />
                <div className="sticker-view-card">
                  <StickerCard sticker={{
                      serialNo: null,
                      name: name.trim(),
                      imageUrl: chosen.url,
                      country: country || null,
                    }} />
                </div>
              </div>

              <label className="field">
                <span className="field-head">
                  <span>Sticker name</span>
                  <span>
                    {count(name)}/{NAME_MAX}
                  </span>
                </span>
                <input
                  value={name}
                  maxLength={NAME_MAX}
                  placeholder="Your pet's name"
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-head">
                  <span>Country</span>
                </span>
                <select value={country} onChange={(e) => setPickedCountry(e.target.value)}>
                  <option value="" disabled>
                    Choose a country
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {flagEmoji(c.code)} {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-head">
                  <span>Speech bubble</span>
                  <span>
                    {count(bubble)}/{BUBBLE_MAX}
                  </span>
                </span>
                <textarea
                  value={bubble}
                  rows={2}
                  maxLength={BUBBLE_MAX}
                  placeholder="What does your pet say to whoever draws it?"
                  onChange={(e) => setBubble(e.target.value.replace(/\n/g, " "))}
                />
              </label>
            </>
          )}

          {isStaff && chosen && (
            <label className="check">
              <input
                type="checkbox"
                checked={testOnly}
                onChange={(e) => setTestOnly(e.target.checked)}
              />
              Test only (not saved, no number)
            </label>
          )}
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={!ready || busy} onClick={make}>
            {busy ? "Making..." : "Make sticker"}
          </button>
        </div>
      </main>
    );
  }

  const left = state?.createsLeft ?? 0;
  return (
    <main>
      <TopBar title="Make a sticker" />
      <div className="card stack">
        {busy ? (
          <>
            <div className="spinner" />
            <p className="note">Drawing your pet in three styles. This can take a minute...</p>
            <WaitingStickers />
          </>
        ) : (
          <>
            {source ? (
              <Cropper ref={cropper} src={source} />
            ) : (
              <button
                className="picker"
                aria-label="Choose a photo"
                onClick={() => fileInput.current?.click()}
              >
                <CameraArt />
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pick(e.target.files?.[0])}
            />
            {source ? (
              <>
                <p className="note">Drag to move, pinch or slide to zoom</p>
                <button className="link" onClick={() => fileInput.current?.click()}>
                  Choose another photo
                </button>
              </>
            ) : (
              <p className="note">Tap to add a photo of your pet</p>
            )}
            <p className="rule">Pet photos only. Anything else may be removed without notice.</p>
            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={!source || left === 0} onClick={convert}>
              Convert photo
            </button>
            {state && (
              <p className="note">
                {state.unlimited
                  ? "Staff account: no daily limit"
                  : `${left} of ${CREATES_PER_DAY} chances left today`}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
