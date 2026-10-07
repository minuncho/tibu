import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/Legal";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: `Privacy Policy - ${LEGAL.appName}` };

export default function PrivacyPage() {
  const app = LEGAL.appName;
  return (
    <LegalPage title="Privacy Policy">
      <p>This page explains what {app} collects, why, and who else handles it.</p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Google account details:</strong> your name, email address, profile picture and an
          account ID, received when you sign in with Google.
        </li>
        <li>
          <strong>Pet photos:</strong> the photo you upload is sent to an AI image service to be
          converted. We store the converted images, not the original photo.
        </li>
        <li>
          <strong>Sticker details:</strong> the name, message and country you choose.
        </li>
        <li>
          <strong>Activity:</strong> which stickers you made and drew and when, reports you sent,
          and any bonus draws on your account.
        </li>
        <li>
          <strong>Technical data:</strong> your time zone and device language region, used to work
          out your local day and to suggest a country. An approximate country from your IP address
          may be used for the same suggestion. These are not stored with your account.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>to sign you in and show your profile;</li>
        <li>to make, store and display stickers and albums;</li>
        <li>to apply daily limits and bonus draws;</li>
        <li>to review reports and keep the service safe.</li>
      </ul>
      <p>We do not sell your data and we do not show ads.</p>

      <h2>3. What other people can see</h2>
      <p>
        Your finished stickers (image, name, message, country flag and number) are public to
        everyone using {app}. Your Google name, email and profile picture are not shown to other
        users. Staff can see reported stickers when reviewing them.
      </p>

      <h2>4. Services that process data for us</h2>
      <ul>
        <li>
          <strong>Google</strong> — sign-in.
        </li>
        <li>
          <strong>Supabase</strong> — account, database and image storage.
        </li>
        <li>
          <strong>OpenAI</strong> — converts uploaded pet photos into sticker images.
        </li>
        <li>
          <strong>Vercel</strong> — hosts the website.
        </li>
      </ul>
      <p>These providers may process data on servers outside your country.</p>

      <h2>5. Cookies</h2>
      <p>
        We use only the cookies needed to keep you signed in, and short-lived browser storage to
        resume a sticker you have not finished. There are no advertising or analytics cookies.
      </p>

      <h2>6. How long we keep it</h2>
      <p>
        We keep your account data and converted images (including the styles you did not pick)
        until you delete your account. Deleting your account removes your Google details, your
        album and activity, and converted images that never became a sticker.{" "}
        <strong>Stickers you made are kept</strong> (image, name, message, country and number).
        They remain public in {app} but are no longer linked to you.
      </p>

      <h2>7. Your choices</h2>
      <p>
        You can delete your account yourself from the profile menu, and ask to see or correct
        your data by emailing us. Images that others already saved to their devices cannot be
        recalled.
      </p>

      <h2>8. Children</h2>
      <p>
        {app} is not for children under {LEGAL.minimumAge}. If you believe a child has signed up,
        contact us and we will remove the account.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy and will change the date above when we do. See also our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
