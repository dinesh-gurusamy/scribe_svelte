import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
// REMOVE: import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
// FIX: Import raw MySQL pool client and User type
import { dbPool } from '$lib/server/db/index'; 
import type { User } from '$lib/server/db/types'; 
// REMOVE: import { db } from '$lib/server/db';
// REMOVE: import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        throw redirect(302, '/dashboard');
    }
    return {};
};

export const actions: Actions = {
    login: async (event) => {
        const formData = await event.request.formData();
        const email = formData.get('email');
        const password = formData.get('password');

        if (!validateEmail(email)) {
            return fail(400, { message: 'Invalid email address format.' });
        }
        if (!validatePassword(password)) {
            return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
        }

        // --- RAW MySQL IMPLEMENTATION START ---
        let existingUser: User | undefined;
        try {
            // Execute the raw SELECT query
            const [rows] = await dbPool.execute(
                `SELECT * FROM user WHERE email = ?`, 
                [email]
            );
            
            // Cast the result rows to the User type array and get the first element
            existingUser = (rows as User[])[0];
            
        } catch (error) {
            console.error('Database query failed during login:', error);
            // Fail safely if there's a database error
            return fail(500, { message: 'A server error occurred during login.' });
        }
        // --- RAW MySQL IMPLEMENTATION END ---

        if (!existingUser) {
            return fail(400, { message: 'Incorrect email or password' });
        }

        // 3. Verify the password against the stored hash
        // CRITICAL FIX: The column is 'password_hash' in SQL, so the User type must use it.
        if (!existingUser.password_hash) { 
             return fail(500, { message: 'User account is improperly set up (missing password hash).' });
        }
        
        // CRITICAL FIX: Use existingUser.password_hash (snake_case)
        const validPassword = await verify(existingUser.password_hash, password as string, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });
        
        if (!validPassword) {
            return fail(400, { message: 'Incorrect email or password' });
        }

        // 4. Create and set session on successful login
        const sessionToken = auth.generateSessionToken();
        const session = await auth.createSession(sessionToken, existingUser.id);
        auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

        // Success is returned to the client to trigger the client-side redirect
        return { success: true };
    }
};

/**
 * Validates the email to ensure it's a string and has a basic email structure.
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