/**
 * Google OAuth2 callback route.
 * Exchanges the authorization code for access + refresh tokens
 * and stores them in httpOnly secure cookies.
 */

import { NextRequest, NextResponse } from "next/server";

// Google token exchange endpoint
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Cookie configuration for token storage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Access token expires in 1 hour
const ACCESS_TOKEN_MAX_AGE = 3600;

// Refresh token persists for 30 days
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 3600;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors from Google
  if (error) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/settings?error=${encodeURIComponent(error)}`
    );
  }

  // Validate the authorization code is present
  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  // Verify CSRF state parameter
  const storedState = request.cookies.get("google_oauth_state")?.value;
  if (!state || state !== storedState) {
    return NextResponse.json(
      { error: "Invalid state parameter. Possible CSRF attack." },
      { status: 403 }
    );
  }

  // Validate required environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      return NextResponse.redirect(
        `${appUrl}/settings?error=token_exchange_failed`
      );
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    // Redirect to settings page with success
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const response = NextResponse.redirect(
      `${appUrl}/settings?google=connected`
    );

    // Store access token in httpOnly cookie
    response.cookies.set("google_access_token", tokens.access_token, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    // Store refresh token if provided (only on first consent)
    if (tokens.refresh_token) {
      response.cookies.set("google_refresh_token", tokens.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });
    }

    // Store connection timestamp for display
    response.cookies.set("google_connected_at", new Date().toISOString(), {
      ...COOKIE_OPTIONS,
      httpOnly: false, // Allow client-side access for display
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Clear the OAuth state cookie
    response.cookies.delete("google_oauth_state");

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/settings?error=oauth_callback_failed`
    );
  }
}
