import { pgTable, uuid, varchar} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name: varchar('first_name', { length: 24 }).notNull(),
  last_name: varchar('last_name', { length: 24 }).notNull(),
  email: varchar('email', { length: 64 }).notNull(),
});
