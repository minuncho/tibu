"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CameraArt } from "@/components/Art";
import { SpeechBubble, StickerCard } from "@/components/Sticker";
import { DownloadButton, StickerView } from "@/components/StickerDetail";
import { TopBar } from "@/components/TopBar";
import { useAppState } from "@/components/useAppState";
import { api, postJson } from "@/lib/api";
import { shrinkPhoto } from "@/lib/render";
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
  const { state, refresh } = useAppState();
  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
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

  useEffect(() => {
    const saved = sessionStorage.getItem(PENDING_KEY);
    if (saved) setGeneration(JSON.parse(saved));
  }, []);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const small = await shrinkPhoto(file);
      setPhoto(small);
      setPreview(URL.createObjectURL(small));
    } catch {
      setError("Could not read that photo. Try another one.");
    }
  }

  async function convert() {
    if (!photo) return;
    setBusy(true);
    setError("");
    try {
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
          <p className="bonus">+1 bonus draw for today</p>
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
            <div className="picker">
              <div className="spinner" />
            </div>
            <p className="note">Drawing your pet in three styles. This can take a minute...</p>
          </>
        ) : (
          <>
            <button className="picker" aria-label="Choose a photo" onClick={() => fileInput.current?.click()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {preview ? <img src={preview} alt="" /> : <CameraArt />}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <p className="note">
              {preview ? "Tap the photo to change it" : "Tap to add a photo of your pet"}
            </p>
            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={!photo || left === 0} onClick={convert}>
              Convert photo
            </button>
            {state?.bannedUntil ? (
              <p className="error">
                One of your stickers was removed after a report. You can make stickers again on{" "}
                {new Date(state.bannedUntil).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
                .
              </p>
            ) : (
              state && (
                <p className="note">
                  {left} of {CREATES_PER_DAY} chances left today
                </p>
              )
            )}
          </>
        )}
      </div>
    </main>
  );
}
