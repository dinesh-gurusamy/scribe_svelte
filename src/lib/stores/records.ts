import { writable } from 'svelte/store';
import * as RecordsService from '$lib/services/records';

// ASSUMED IMPORTS: Replace with the actual path to your types file
// Strongly typed store
export const records = writable<RecordItem[]>([]);

// Load all records
export async function loadRecords(): Promise<void> {
    // The service must be updated to fetch records by the current user's ID
    const data: RecordItem[] = await RecordsService.getAllRecords();
    records.set(data);
}

// Update a field action
export async function setFieldAction(field_id: number, action: 'YES' | 'NO'): Promise<void> {
    // 1. Update the database
    await RecordsService.updateFieldAction(field_id, action);

    // 2. Update the store (no logic change needed here, as the user_id is immutable)
    records.update((rs) =>
        rs.map((r: RecordItem) => ({ // Ensure 'r' is typed as RecordItem
            ...r,
            fields: r.fields.map((f: Field) => // Ensure 'f' is typed as Field
                f.field_id === field_id ? { ...f, field_action: action } : f
            ),
        }))
    );
}