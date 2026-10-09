import { redirect } from "next/navigation";

// Drawing happens on the home shelf now; old links to this address land there.
export default function DrawPage() {
  redirect("/");
}
