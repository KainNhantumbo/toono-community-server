import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

//  enums
export const user_role_enum = pgEnum('user_role', ['USER', 'ADMIN']);

// main level tables
export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  name: varchar('name', { length: 64 }).notNull(),
  user_name: varchar('user_name', { length: 32 }).default('').notNull(),
  biography: varchar('biography', { length: 128 }).default('').notNull(),
  work: varchar('work', { length: 256 }).default('').notNull(),
  education: varchar('education', { length: 256 }).default('').notNull(),
  learning: varchar('learning', { length: 256 }).default('').notNull(),
  available: varchar('available', { length: 256 }).default('').notNull(),
  location: varchar('location', { length: 128 }).default('').notNull(),
  birthday: date('birthday').default(''),
  email: varchar('email', { length: 64 }).notNull().unique(),
  password: varchar('password').notNull(),
  role: user_role_enum('role').default('USER').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const post = pgTable('post', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  title: varchar('title', { length: 256 }).default('').notNull(),
  content: text('content').default('').notNull(),
  public: boolean('public').default(true).notNull(),
  tags: varchar('tags', { length: 16 }).array(4),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  user_id: uuid('user_id')
    .references(() => user.id)
    .notNull()
});

// secondary level tables (dependents)
export const user_profile_image = pgTable('user_profile_image', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  public_id: varchar('public_id').notNull(),
  url: varchar('url').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  user_id: uuid('user_id')
    .references(() => user.id)
    .notNull()
});

export const post_cover_image = pgTable('post_cover_image', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  public_id: varchar('public_id').notNull(),
  url: varchar('url').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  post_id: uuid('post_id')
    .references(() => post.id)
    .notNull()
});

export const network_urls = pgTable('network_urls', {
  id: uuid('id').primaryKey().defaultRandom(),
  website: varchar('website', { length: 128 }).default(''),
  github: varchar('github', { length: 128 }).default(''),
  facebook: varchar('facebook', { length: 128 }).default(''),
  instagram: varchar('instagram', { length: 128 }).default(''),
  linkedin: varchar('linkedin', { length: 128 }).default(''),
  user_id: uuid('user_id')
    .references(() => user.id)
    .notNull()
});

export const claps = pgTable('claps', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .references(() => user.id)
    .notNull(),
  post_id: uuid('post_id')
    .references(() => post.id)
    .notNull()
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  content: varchar('content', { length: 512 }).notNull(),
  parent_comment: uuid('parent_comment').references(() => comments.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  user_id: uuid('user_id')
    .references(() => user.id)
    .notNull(),
  post_id: uuid('post_id')
    .references(() => post.id)
    .notNull()
});

// table relations
export const userRelations = relations(user, ({ one, many }) => ({
  posts: many(post),
  profileImage: one(user_profile_image),
  network: one(network_urls)
}));

export const postRelations = relations(post, ({ one, many }) => ({
  user: one(user, {
    fields: [post.user_id],
    references: [user.id]
  }),
  claps: many(claps),
  coverImage: one(post_cover_image)
}));

export const userProfileImageRelations = relations(user_profile_image, ({ one }) => ({
  user: one(user, {
    fields: [user_profile_image.user_id],
    references: [user.id]
  })
}));

export const postCoverImageRelations = relations(post_cover_image, ({ one }) => ({
  post: one(post, {
    fields: [post_cover_image.post_id],
    references: [post.id]
  })
}));

export const clapsRelations = relations(claps, ({ one }) => ({
  post: one(post, {
    fields: [claps.post_id],
    references: [post.id]
  }),
  user: one(user, {
    fields: [claps.user_id],
    references: [user.id]
  })
}));

export const networkUrlsRelations = relations(network_urls, ({ one }) => ({
  user: one(user, { fields: [network_urls.user_id], references: [user.id] })
}));
