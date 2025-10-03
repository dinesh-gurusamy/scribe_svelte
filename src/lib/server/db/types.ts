// Type definition for the 'user' table rows
export type User = {
    // Corresponds to id: varchar('id', { length: 255 }).primaryKey(),
    id: string;

    // Corresponds to username: varchar('username', { length: 255 }),
    // Note: Drizzle makes it optional, but if your app logic assumes it, adjust as needed.
    username: string | null;

    // Corresponds to passwordHash: varchar('password_hash', { length: 255 }),
    passwordHash: string | null;

    // Corresponds to email: varchar('email', { length: 255 }).unique().notNull(),
    email: string;
    
    // Add any other columns you defined (e.g., age: number | null)
    // age?: number | null; 
};

// Type definition for the 'session' table rows
export type Session = {
    // Corresponds to id: varchar('id', { length: 255 }).primaryKey(),
    id: string;

    // Corresponds to userId: varchar('user_id', { length: 255 }).notNull(),
    userId: string;

    // Corresponds to expiresAt: datetime('expires_at').notNull()
    // MySQL DATETIME columns are typically returned as JavaScript Date objects by mysql2.
    expiresAt: Date; 
};