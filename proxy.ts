import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Cheap pre-render gate: no session cookie, no app. The (root) layout re-checks the
// session server-side, so this only saves a render — it is not the security boundary.
export function proxy(request: NextRequest) {
    if (!getSessionCookie(request)) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)',
    ],
};
