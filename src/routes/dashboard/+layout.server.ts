import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
// REMOVE: import { getRequestEvent } from '$app/server'; // Not needed in load/actions

import type { Actions, LayoutServerLoad } from './$types';
import type { User } from '$lib/server/db/types'; // Import the User type

// --- MODIFIED load FUNCTION ---
export const load: LayoutServerLoad = async (event) => {
    // Pass the event directly to the authentication check
    const user = requireLogin(event); 
    return { user };
};


/**
 * Checks if a user is logged in via event.locals and redirects if not.
 * * @param event The SvelteKit RequestEvent from load or action.
 * @returns The authenticated user object.
 */
function requireLogin(event: Parameters<LayoutServerLoad>[0]): User {
    // Access locals directly from the event object
    const { locals } = event; 

    if (!locals.user) {
        // Throw a redirect to stop execution and send the user to the login page
        throw redirect(302, '/auth/login');
    }

    // locals.user must be of the User type we defined previously
    return locals.user as User; 
}