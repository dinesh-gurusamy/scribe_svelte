import type { RequestEvent } from '@sveltejs/kit';
// REMOVE: import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
// Import the raw MySQL pool client
import { dbPool } from '$lib/server/db/index'; 

// Import the manually defined types from the previous step
import type { Session, User } from '$lib/server/db/types'; 

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

/**
 * Generates a cryptographically secure, URL-safe session token.
 */
export function generateSessionToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const token = encodeBase64url(bytes);
    return token;
}

/**
 * Creates a new session in the database.
 */
export async function createSession(token: string, userId: string): Promise<Session> {
    // Hash the token to get the sessionId stored in the database
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const expiresAt = new Date(Date.now() + DAY_IN_MS * 30);

    const session: Session = {
        id: sessionId,
        userId,
        expiresAt
    };

    // RAW MySQL: INSERT query
    await dbPool.execute(
        `INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)`,
        [session.id, session.userId, session.expiresAt]
    );
    
    return session;
}

/**
 * Validates a session token, retrieves user data, and handles session expiration/renewal.
 */
export async function validateSessionToken(token: string): Promise<{ session: Session | null, user: Omit<User, 'passwordHash'> | null }> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

    // RAW MySQL: SELECT with INNER JOIN
    // Selects session data and specific user data (id, username)
    const [rows] = await dbPool.execute(
        `SELECT
            s.id AS session_id, s.user_id, s.expires_at,
            u.id AS user_id, u.username
         FROM
            session s
         INNER JOIN
            user u ON s.user_id = u.id
         WHERE
            s.id = ?`,
        [sessionId]
    );

    // Casting the result to match the expected structure
    const resultRow = (rows as any[])[0] as {
        session_id: string;
        user_id: string; // The user's ID
        expires_at: Date;
        username: string | null;
    } | undefined;

    if (!resultRow) {
        return { session: null, user: null };
    }
    
    // Map the flat result row back to structured objects
    const session: Session = {
        id: resultRow.session_id,
        userId: resultRow.user_id,
        expiresAt: resultRow.expires_at // mysql2/promise typically returns DATETIME as Date objects
    };
    
    // We only return user id and username as per the original Drizzle query
    const user: Omit<User, 'passwordHash'> = { 
        id: resultRow.user_id, 
        username: resultRow.username,
        email: 'N/A' // NOTE: Email is missing in the SELECT and would need to be added if required
    };

    const sessionExpired = Date.now() >= session.expiresAt.getTime();
    if (sessionExpired) {
        // RAW MySQL: DELETE query
        await dbPool.execute(`DELETE FROM session WHERE id = ?`, [session.id]);
        return { session: null, user: null };
    }

    const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
    if (renewSession) {
        session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
        
        // RAW MySQL: UPDATE query
        await dbPool.execute(
            `UPDATE session SET expires_at = ? WHERE id = ?`, 
            [session.expiresAt, session.id]
        );
    }

    return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

/**
 * Deletes a session from the database.
 */
export async function invalidateSession(sessionId: string): Promise<void> {
    // RAW MySQL: DELETE query
    await dbPool.execute(`DELETE FROM session WHERE id = ?`, [sessionId]);
}

/**
 * Sets the session token cookie in the SvelteKit response.
 */
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
    event.cookies.set(sessionCookieName, token, {
        expires: expiresAt,
        path: '/',
        httpOnly: true, // Recommended for security
        secure: process.env.NODE_ENV === 'production', // Recommended for security
        sameSite: 'lax' // Recommended for security
    });
}

/**
 * Deletes the session token cookie.
 */
export function deleteSessionTokenCookie(event: RequestEvent): void {
    event.cookies.delete(sessionCookieName, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
}