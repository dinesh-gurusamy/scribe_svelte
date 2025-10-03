import type { RequestHandler } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit"; // Import redirect for unauthorized users
import { dbPool } from "$lib/server/db/index";

// The RequestHandler function must accept the 'event' object from SvelteKit
export const PUT: RequestHandler = async (event) => {
    // 1. Get authenticated User ID and request body
    const userId = event.locals.user?.id;
    const { field_id, field_action } = await event.request.json();

    // Check authentication first
    if (!userId) {
        throw redirect(302, '/auth/login');
    }

    // 2. Validate input
    if (typeof field_id !== 'number' || (field_action !== 'YES' && field_action !== 'NO')) {
        return new Response(JSON.stringify({ message: "Invalid input data." }), { status: 400 });
    }

    try {
        // 3. Execute the secure UPDATE query
        // CRITICAL CHANGE: JOIN with 'records' table and check 'user_id'
        const [result] = await dbPool.execute(
            `
            UPDATE record_fields rf
            INNER JOIN records r ON rf.record_id = r.record_id
            SET rf.field_action = ?
            WHERE rf.field_id = ? AND r.user_id = ?
            `,
            [field_action, field_id, userId] // Parameters are field_action, field_id, userId
        );
        
        const updateResult = result as { affectedRows: number };

        // 4. Check if a row was actually updated
        if (updateResult.affectedRows === 0) {
            // This happens if the field_id doesn't exist OR if it exists but belongs to another user
            return new Response(JSON.stringify({ success: false, message: "Field not found or unauthorized." }), { status: 403 });
        }

        return new Response(JSON.stringify({ success: true, message: "Field updated successfully." }), { status: 200 });

    } catch (error) {
        console.error('Error updating field action:', error);
        return new Response(JSON.stringify({ success: false, message: "Server failed to process update." }), { status: 500 });
    }
};