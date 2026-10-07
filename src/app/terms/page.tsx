import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/Legal";
import { LEGAL } from "@/lib/legal";
import { BASE_DRAWS_PER_DAY, CREATES_PER_DAY, PENALTY_DAYS } from "@/lib/types";

export const metadata: Metadata = { title: `Terms of Service - ${LEGAL.appName}` };

export default function TermsPage() {
  const app = LEGAL.appName;
  return (
    <LegalPage title="Terms of Service">
      <p>
        {app} lets you turn a photo of your pet into a sticker and collect stickers made by other
        pet owners around the world. By signing in you agree to these terms.
      </p>

      <h2>1. Your account</h2>
      <p>
        You sign in with a Google account. You must be at least {LEGAL.minimumAge} years old. You
        are responsible for what happens under your account.
      </p>

      <h2>2. Making and drawing stickers</h2>
      <ul>
        <li>
          You can convert up to {CREATES_PER_DAY} photos per day. A chance is used when the
          conversion runs, even if you do not finish the sticker.
        </li>
        <li>
          You get {BASE_DRAWS_PER_DAY} draw per day, plus one for each sticker you finish that day.
          Unused daily draws expire at midnight in your time zone.
        </li>
        <li>Draws are random. Every available sticker made by someone else has the same chance.</li>
        <li>We may change these limits at any time.</li>
      </ul>

      <h2>3. What you upload</h2>
      <p>You keep the rights to your photos, sticker names and messages. You promise that:</p>
      <ul>
        <li>the photo is of a pet, and you have the right to use it;</li>
        <li>it does not show people, and contains no personal information;</li>
        <li>
          the image, name and message are not sexual, violent, hateful, harassing, illegal, or
          advertising.
        </li>
      </ul>
      <p>
        Finished stickers are public. Anyone using {app} may draw your sticker, see its name,
        message and country flag, keep it in their album, and save it as an image. You give us
        permission to store, display and distribute your stickers inside {app} for that purpose,
        and to show them when presenting the service.
      </p>

      <h2>4. AI conversion</h2>
      <p>
        Photos are converted by an AI image model run by a third party. Results can be inaccurate
        or unexpected, and we do not guarantee how a sticker will look.
      </p>

      <h2>5. Reports and penalties</h2>
      <ul>
        <li>You can report a sticker you have drawn. Our staff review every report by hand.</li>
        <li>
          If a report is upheld, the sticker is removed from the draw pool and from all albums, its
          maker cannot make stickers for {PENALTY_DAYS} days, and each person who reported it
          receives a bonus draw.
        </li>
        <li>If a report is not upheld, nothing is refunded.</li>
        <li>
          We may also remove content or suspend accounts for breaking these terms, or for abusing
          reports.
        </li>
      </ul>

      <h2>6. The service</h2>
      <p>
        {app} is provided as it is, without warranties. It may change, be interrupted, or shut
        down, and stickers or albums may be lost. To the extent the law allows, we are not liable
        for indirect or consequential losses arising from your use of {app}.
      </p>

      <h2>7. Leaving</h2>
      <p>
        You can stop using {app} at any time, and delete your account from the profile menu.
        Deleting your account erases your album, your draws and your remaining chances.{" "}
        <strong>Stickers you made are not deleted:</strong> they stay in {app}, can still be drawn
        and kept by others, and are no longer linked to your account.
      </p>

      <h2>8. Changes and law</h2>
      <p>
        We may update these terms and will change the date above when we do. Continuing to use{" "}
        {app} means you accept the new terms. These terms are governed by the laws of{" "}
        {LEGAL.governingLaw}.
      </p>
      <p>
        See also our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
