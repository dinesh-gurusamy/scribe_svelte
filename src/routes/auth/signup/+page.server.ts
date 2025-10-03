import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
// IMPORT the raw MySQL pool client
import { dbPool } from '$lib/server/db/index'; 
// REMOVE: import { db } from '$lib/server/db/db';
// We use the imported types, not the Drizzle table schema objects
// REMOVE: import * as table from '$lib/server/db/types'; 
import type { Actions, PageServerLoad } from './$types';


export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        return redirect(302, '/dashboard');
    }
    return {};
};

export const actions: Actions = {
    
    register: async (event) => {
        const formData = await event.request.formData();
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        if (!validateUsername(username)) {
            return fail(400, { message: 'Invalid username' });
        }
        if (!validateEmail(email)) { // Add validation for email
             return fail(400, { message: 'Invalid email address format.' });
        }
        if (!validatePassword(password)) {
            return fail(400, { message: 'Invalid password' });
        }

        const userId = generateUserId();
        const passwordHash = await hash(password as string, {
            // recommended minimum parameters
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });

        try {
            // --- RAW MySQL IMPLEMENTATION START ---
            
            // Execute the raw INSERT query
            await dbPool.execute(
                `INSERT INTO user 
                 (id, username, password_hash, email) 
                 VALUES (?, ?, ?, ?)`,
                [userId, username, passwordHash, email]
            );

            // --- RAW MySQL IMPLEMENTATION END ---

            const sessionToken = auth.generateSessionToken();
            const session = await auth.createSession(sessionToken, userId);
            auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
            return { success: true };
        } catch (error) {
             // Handle the case where the email is already in use (UNIQUE constraint violation)
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY') {
                return fail(400, { message: 'Email address already in use.' });
            }
            console.error('Registration error:', error);
            return fail(500, { message: 'An unexpected error occurred during registration.' });
        }
        
    }
};

/**
 * Generates a unique, base32-encoded user ID.
 */
function generateUserId(): string {
    // ID with 120 bits of entropy
    const bytes = crypto.getRandomValues(new Uint8Array(15));
    const id = encodeBase32LowerCase(bytes);
    return id;
}

/**
 * Validates the username format.
 */
function validateUsername(username: unknown): username is string {
    return (
        typeof username === 'string' &&
        username.length >= 3 &&
        username.length <= 31 &&
        /^[a-z0-9_-]+$/.test(username)
    );
}

/**
 * Validates the email format.
 */
function validateEmail(email: unknown): email is string {
     return (
        typeof email === 'string' &&
        email.length <= 255 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    );
}

/**
 * Validates the password string length.
 */
function validatePassword(password: unknown): password is string {
    return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}