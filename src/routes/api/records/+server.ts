import type { RequestHandler } from "@sveltejs/kit";
// 🚨 Ensure redirect is imported for unauthenticated requests
import { redirect } from "@sveltejs/kit";
import { dbPool } from "$lib/server/db/index";

// The RequestHandler function must accept the 'event' object from SvelteKit
export const GET: RequestHandler = async (event) => {
    // 1. Get the authenticated user's ID from event.locals
    const userId = event.locals.user?.id;

    // Check if user is authenticated. If not, redirect them to the login page.
    if (!userId) {
        // Use throw redirect(302, '/...') to stop execution and send HTTP redirect
        throw redirect(302, '/auth/login');
    }

    // 2. Filter the main records query by user_id
    try {
        const [recordsResult] = await dbPool.execute(
            'SELECT * FROM records WHERE user_id = ? ORDER BY record_id ASC',
            [userId] // Pass the userId as a parameter
        );
        const records = recordsResult as any[];

        // Extract all unique record IDs belonging to the current user
        const recordIds = records.map(r => r.record_id);

        // If no records exist, return an empty array immediately
        if (recordIds.length === 0) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        // Convert the array of IDs into a comma-separated string for the SQL IN clause
        const idsString = recordIds.join(',');

        // 3. Fetch related fields and images for the retrieved records
        const [fieldsResult] = await dbPool.query(
            `SELECT * FROM record_fields WHERE record_id IN (${idsString})`
        );
        const fields = fieldsResult as any[];

        // Fetch Main Images
        const [imagesResult] = await dbPool.query(
            `SELECT * FROM record_images WHERE record_id IN (${idsString})`
        );
        let images = imagesResult as any[]; // Use 'let' so we can modify it

        // 🚨 NEW STEP: Fetch Additional Images for all fetched main images
        const mainImageIds = images.map(i => i.image_id).join(',');

        if (mainImageIds.length > 0) {
            const [additionalImagesResult] = await dbPool.query(
                `SELECT * FROM additional_images WHERE parent_image_id IN (${mainImageIds})`
            );
            const additionalImages = additionalImagesResult as any[];

            // 4. Organize Additional Images into a map for fast lookup
            const additionalImagesMap = new Map<number, any[]>();
            for (const aImg of additionalImages) {
                const parentId = aImg.parent_image_id;
                if (!additionalImagesMap.has(parentId)) {
                    additionalImagesMap.set(parentId, []);
                }
                additionalImagesMap.get(parentId)!.push(aImg);
            }

            // 5. Inject Additional Images into the Main Images array
            images = images.map(i => ({
                ...i,
                additional_images: additionalImagesMap.get(i.image_id) || []
            }));
        } else {
            // Initialize all images with an empty additional_images array if no main images were found.
            images = images.map(i => ({ ...i, additional_images: [] }));
        }

        // 6. Combine data (records, fields, and enriched images)
        const data = records.map(r => ({
            ...r,
            fields: fields.filter(f => f.record_id === r.record_id),
            images: images.filter(i => i.record_id === r.record_id)
        }));

        return new Response(JSON.stringify(data), { status: 200 });

    } catch (error) {
        // Log the error for server-side debugging
        console.error('Error fetching user records:', error);
        // Return a generic error response
        return new Response(JSON.stringify({ message: 'Failed to fetch records due to a server error.' }), { status: 500 });
    }
};