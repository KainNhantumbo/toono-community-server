import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

//  enums
export const user_role_enum = pgEnum("user_role", ["USER", "ADMIN"]);

// main level tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  user_name: varchar("user_name", { length: 32 }).default("").notNull(),
  biography: varchar("biography", { length: 128 }).default("").notNull(),
  work: varchar("work", { length: 256 }).default("").notNull(),
  education: varchar("education", { length: 256 }).default("").notNull(),
  learning: varchar("learning", { length: 256 }).default("").notNull(),
  available: varchar("available", { length: 256 }).default("").notNull(),
  location: varchar("location", { length: 128 }).default("").notNull(),
  birthday: date("birthday"),
  email: varchar("email", { length: 64 }).notNull().unique(),
  role: user_role_enum("role").default("USER").notNull(),
  password: varchar("password").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  title: varchar("title", { length: 256 }).default("").notNull(),
  slug: varchar("slug", { length: 736 }).default("").notNull().unique(),
  content: text("content").default("").notNull(),
  public: boolean("public").default(true).notNull(),
  tags: varchar("tags", { length: 16 }).array(4),
  visits: integer("visits").default(0).notNull(),
  words: integer("words").default(0).notNull(),
  read_time: varchar("read_time").default("").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
});

// secondary level tables (dependents)
export const user_profile_image = pgTable("user_profile_image", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  public_id: varchar("public_id").notNull(),
  url: varchar("url").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
});

export const post_cover_image = pgTable("post_cover_image", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  public_id: varchar("public_id").notNull(),
  url: varchar("url").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  post_id: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull()
});

export const network_urls = pgTable("network_urls", {
  id: uuid("id").primaryKey().defaultRandom(),
  website: varchar("website", { length: 128 }).default(""),
  github: varchar("github", { length: 128 }).default(""),
  facebook: varchar("facebook", { length: 128 }).default(""),
  instagram: varchar("instagram", { length: 128 }).default(""),
  linkedin: varchar("linkedin", { length: 128 }).default(""),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
});

export const claps = pgTable("claps", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  post_id: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull()
});

export const comment = pgTable("comment", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  content: varchar("content", { length: 512 }).notNull(),
  parent_comment: uuid("parent_comment"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  post_id: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull()
});

// table relations
export const userRelations = relations(users, ({ one, many }) => ({
  posts: many(posts),
  profile_image: one(user_profile_image),
  network: one(network_urls)
}));

// self relation
export const commentsRelations = relations(comment, ({ one, many }) => ({
  sub_comments: many(comment, { relationName: "subComments" }),
  parent_comment: one(comment, {
    relationName: "subComments",
    fields: [comment.parent_comment],
    references: [comment.id]
  }),
  post_id: one(posts, {
    fields: [comment.post_id],
    references: [posts.id]
  })
}));

export const postRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.user_id],
    references: [users.id]
  }),
  claps: many(claps),
  coverImage: one(post_cover_image),
  comments: many(comment)
}));

export const userProfileImageRelations = relations(user_profile_image, ({ one }) => ({
  user: one(users, {
    fields: [user_profile_image.user_id],
    references: [users.id]
  })
}));

export const postCoverImageRelations = relations(post_cover_image, ({ one }) => ({
  post: one(posts, {
    fields: [post_cover_image.post_id],
    references: [posts.id]
  })
}));

export const clapsRelations = relations(claps, ({ one }) => ({
  post: one(posts, {
    fields: [claps.post_id],
    references: [posts.id]
  }),
  user: one(users, {
    fields: [claps.user_id],
    references: [users.id]
  })
}));

export const networkUrlsRelations = relations(network_urls, ({ one }) => ({
  user: one(users, { fields: [network_urls.user_id], references: [users.id] })
}));
