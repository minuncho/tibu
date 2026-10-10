import { NextResponse } from "next/server";
import { getUser, type User } from "./auth";

// An error whose message is safe and useful to show to the user. code lets a client in
// another language (the Toss app) show its own wording for a known situation.
export class PublicError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function fail(status: number, error: string, code?: string) {
  return NextResponse.json(code ? { error, code } : { error }, { status });
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
      return e instanceof PublicError
        ? fail(500, e.message, e.code)
        : fail(500, "Something went wrong. Please try again.");
    }
  };
}
