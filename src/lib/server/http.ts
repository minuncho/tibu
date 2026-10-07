import { NextResponse } from "next/server";
import { getUser, type User } from "./auth";

// An error whose message is safe and useful to show to the user.
export class PublicError extends Error {}

export function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

// Wraps a route handler that needs a signed-in user.
export function withUser(handler: (req: Request, user: User) => Promise<Response>) {
  return async (req: Request) => {
    const user = await getUser();
    if (!user) return fail(401, "Please sign in");
    try {
      return await handler(req, user);
    } catch (e) {
      // Internal error text can contain secrets (e.g. a request header), so it stays in the server log.
      console.error(e);
      return fail(500, e instanceof PublicError ? e.message : "Something went wrong. Please try again.");
    }
  };
}
