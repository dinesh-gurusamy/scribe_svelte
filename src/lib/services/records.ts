
export async function getAllRecords(): Promise<RecordItem[]> {
    const res = await fetch('/api/records');
    const data = await res.json();
    return data as RecordItem[];
}

export async function updateFieldAction(field_id: number, action: 'YES' | 'NO'): Promise<void> {
    await fetch('/api/fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_id, field_action: action }),
    });
}
