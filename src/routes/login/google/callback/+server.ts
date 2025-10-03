import { google } from "$lib/server/oauth";
// IMPORT the raw MySQL pool client
import { dbPool } from "$lib/server/db/index";
// IMPORT the manually defined types
import type { User } from "$lib/server/db/types";
// REMOVE: import { db } from "$lib/server/db/db";
// REMOVE: import * as table from "$lib/server/db/types";
// REMOVE: import { eq } from "drizzle-orm"; 

import { redirect, isRedirect } from "@sveltejs/kit"; 
import { generateSessionToken, createSession, setSessionTokenCookie } from "$lib/server/auth"; 
import { encodeBase32LowerCase } from "@oslojs/encoding";
import type { RequestEvent } from "@sveltejs/kit"; 

export async function GET(event: RequestEvent) {
    try {
        const code = event.url.searchParams.get("code");
        // NOTE: The state parameter check should also be here, but we'll stick to fixing the database part.
        const codeVerifier = event.cookies.get("google_code_verifier");

        // 1️⃣ Check required parameters
        if (!code || !codeVerifier) {
            event.cookies.set("google_code_verifier", "", { path: "/", maxAge: 0 });
            throw redirect(302, "/auth/login");
        }

        // 2️⃣ Exchange authorization code for tokens
        const tokens = await google.validateAuthorizationCode(code, codeVerifier);

        // Remove verifier cookie after use
        event.cookies.set("google_code_verifier", "", { path: "/", maxAge: 0 });

        // 3️⃣ Fetch Google user info using the access token
        const accessToken = tokens.accessToken(); 
        const googleUser = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
        }).then(res => res.json());

        if (!googleUser.email) throw new Error("Failed to fetch Google user email");

        // 4️⃣ Check if user already exists
        // --- RAW MySQL IMPLEMENTATION START ---
        let existingUser: User | undefined;
        try {
            const [rows] = await dbPool.execute(
                `SELECT * FROM user WHERE email = ?`,
                [googleUser.email]
            );
            existingUser = (rows as User[])[0];
        } catch (error) {
            console.error('Failed to query user by email:', error);
            throw new Error('Database query error');
        }
        // --- RAW MySQL IMPLEMENTATION END ---

        let userId: string;
        
        if (existingUser) {
            userId = existingUser.id;
        } else {
            // 5️⃣ Create new user
            userId = encodeBase32LowerCase(crypto.getRandomValues(new Uint8Array(15)));
            // Simple approach to generate a default username
            const username = googleUser.name ? googleUser.name.replace(/\s+/g, "_").toLowerCase() : null;

            // --- RAW MySQL IMPLEMENTATION START ---
            try {
                 await dbPool.execute(
                    `INSERT INTO user (id, username, email, password_hash)
                     VALUES (?, ?, ?, ?)`,
                    [userId, username, googleUser.email, null] // passwordHash is explicitly null for OAuth users
                );
            } catch (error) {
                console.error('Failed to insert new user:', error);
                throw new Error('Database insertion error');
            }
            // --- RAW MySQL IMPLEMENTATION END ---
        }

        // 6️⃣ Create a session using the custom function (already converted to MySQL)
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, userId);

        // 7️⃣ Set session cookie using the custom function
        setSessionTokenCookie(event, sessionToken, session.expiresAt);

        // 8️⃣ Redirect to authenticated page
        throw redirect(302, "/dashboard");

    } catch (err) {
        // 🚨 FIX: If the error is an intended redirect, re-throw it so SvelteKit handles it
        if (isRedirect(err)) {
            throw err;
        }
        
        console.error("Google OAuth callback failed with unexpected error:", err);
        throw redirect(302, "/auth/login"); 
    }
}