import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "doing",
  "waiting",
  "done",
  "canceled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const taskEnergyEnum = pgEnum("task_energy_required", [
  "low",
  "medium",
  "high",
]);

export const taskSourceEnum = pgEnum("task_source", [
  "manual",
  "voice",
  "email",
  "observation",
  "import",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "waiting",
  "completed",
  "paused",
  "canceled",
]);

export const projectTypeEnum = pgEnum("project_type", [
  "deadline",
  "ongoing",
  "seasonal",
  "learning",
  "administrative",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "unread",
  "read",
  "dismissed",
]);

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 32 }),
    icon: varchar("icon", { length: 64 }),
    isSystem: boolean("is_system").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("domains_user_name_unique").on(table.userId, table.name),
    index("domains_user_active_idx").on(table.userId, table.active),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("active"),
    type: projectTypeEnum("type").notNull().default("deadline"),
    targetDate: date("target_date"),
    startDate: date("start_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cadenceExpected: varchar("cadence_expected", { length: 120 }),
    failureMode: text("failure_mode"),
    successDefinition: text("success_definition"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("projects_user_status_idx").on(table.userId, table.status),
    index("projects_domain_idx").on(table.domainId),
  ],
);

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    status: taskStatusEnum("status").notNull().default("todo"),
    weight: integer("weight").notNull().default(1),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("milestones_project_idx").on(table.projectId),
    index("milestones_user_status_idx").on(table.userId, table.status),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    parentTaskId: uuid("parent_task_id").references(
      (): AnyPgColumn => tasks.id,
      { onDelete: "cascade" },
    ),
    title: varchar("title", { length: 220 }).notNull(),
    notes: text("notes"),
    status: taskStatusEnum("status").notNull().default("todo"),
    dueDate: date("due_date"),
    dueTime: time("due_time"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    energyRequired: taskEnergyEnum("energy_required"),
    context: varchar("context", { length: 80 }),
    recurrenceRule: text("recurrence_rule"),
    reminderOffsets: jsonb("reminder_offsets")
      .$type<number[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    source: taskSourceEnum("source").notNull().default("manual"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tasks_user_status_idx").on(table.userId, table.status),
    index("tasks_due_date_idx").on(table.userId, table.dueDate),
    index("tasks_domain_idx").on(table.domainId),
    index("tasks_project_idx").on(table.projectId),
    index("tasks_parent_task_idx").on(table.parentTaskId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 80 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body"),
    status: notificationStatusEnum("status").notNull().default("unread"),
    sourceRef: varchar("source_ref", { length: 160 }),
    sourceUrl: text("source_url"),
    undoPayload: jsonb("undo_payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_status_idx").on(table.userId, table.status),
    index("notifications_created_at_idx").on(table.createdAt),
  ],
);

export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 120 }).notNull(),
    value: jsonb("value").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("app_settings_user_key_unique").on(table.userId, table.key),
  ],
);
