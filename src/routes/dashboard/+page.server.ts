import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types'; // Change LayoutServerLoad to PageServerLoad
import type { User } from '$lib/server/db/types';

// The load function should still be here if this is your page server file.
export const load: PageServerLoad = async (event) => {
    const user = requireLogin(event); 
    return { user };
};

// CRITICAL FIX: The action must be exported as 'actions' in a page server file 
// (or the closest parent page server file) for the form to find it.
export const actions: Actions = { 
    logout: async (event) => {
        // Check for session in locals (set by the SvelteKit hook)
        if (!event.locals.session) {
            // SvelteKit returns an error response object here
            return fail(401); 
        }
        
        await auth.invalidateSession(event.locals.session.id);
        auth.deleteSessionTokenCookie(event);

        // Throw a redirect for a clean navigation state
        throw redirect(302, '/auth/login'); 
    }
};

// ... (requireLogin function remains the same)

function requireLogin(event: Parameters<PageServerLoad>[0]): User {
    // Access locals directly from the event object
    const { locals } = event; 

    if (!locals.user) {
        // Throw a redirect to stop execution and send the user to the login page
        throw redirect(302, '/auth/login');
    }

    // locals.user must be of the User type we defined previously
    return locals.user as User; 
}