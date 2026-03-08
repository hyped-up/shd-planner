/**
 * Google OAuth2 initiation route.
 * Redirects the user to Google's consent screen with drive.file scope.
 */

import { NextResponse } from "next/server";

// Google OAuth2 authorization endpoint
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  // Validate required environment variables
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI." },
      { status: 500 }
    );
  }

  // Generate a random state parameter for CSRF protection
  const state = crypto.randomUUID();

  // Build the OAuth2 authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  // Store state in a cookie for verification in the callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
