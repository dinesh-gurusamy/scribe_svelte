import { google } from "$lib/server/oauth";
import { redirect } from "@sveltejs/kit";
// Import necessary utility functions from 'arctic' or 'oslo/oauth2'
import { generateState, generateCodeVerifier } from "arctic"; 
// NOTE: If the above import fails, you might need to install 'oslo' and use:
// import { generateState, generateCodeVerifier } from "oslo/oauth2"; 

export async function GET({ cookies }) {
  // 1. Generate the security parameters
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  
  // 2. Define the required scopes (Google needs these for login)
  const scopes = ["openid", "profile", "email"]; // 'openid' is standard for OIDC, 'profile' and 'email' fetch user data

  // 3. Call the function with all 3 required arguments
  //    The signature you have returns the URL directly, so we capture it as 'url'
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);

  // 4. Store state and codeVerifier in HTTP-only cookies
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Best practice
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax" as const, // Fix from previous step
  };
  
  cookies.set("google_oauth_state", state, cookieOptions);
  cookies.set("google_code_verifier", codeVerifier, cookieOptions);

  // 5. Throw the redirect
  throw redirect(302, url.toString());
}