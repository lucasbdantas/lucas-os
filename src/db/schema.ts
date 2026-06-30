import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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

export const taskRecurrenceTypeEnum = pgEnum("task_recurrence_type", [
  "none",
  "daily",
  "weekly",
  "monthly",
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

export const pendingCaptureSourceEnum = pgEnum("pending_capture_source", [
  "manual",
  "web",
  "ios_shortcut",
  "android_shortcut",
  "voice",
  "email",
  "webhook",
]);

export const pendingCaptureStatusEnum = pgEnum("pending_capture_status", [
  "pending",
  "resolved",
  "dismissed",
  "expired",
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
    uniqueIndex("projects_user_domain_name_unique").on(
      table.userId,
      table.domainId,
      table.name,
    ),
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
    recurrenceType: taskRecurrenceTypeEnum("recurrence_type")
      .notNull()
      .default("none"),
    recurrenceInterval: integer("recurrence_interval").notNull().default(1),
    recurrenceAnchorDate: date("recurrence_anchor_date"),
    recurrenceEndDate: date("recurrence_end_date"),
    recurrenceParentId: uuid("recurrence_parent_id").references(
      (): AnyPgColumn => tasks.id,
      { onDelete: "set null" },
    ),
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
    index("tasks_recurrence_parent_idx").on(table.recurrenceParentId),
    index("tasks_user_recurrence_idx").on(
      table.userId,
      table.recurrenceType,
      table.recurrenceParentId,
    ),
    uniqueIndex("tasks_user_recurrence_parent_due_open_unique")
      .on(table.userId, table.recurrenceParentId, table.dueDate)
      .where(
        sql`${table.recurrenceParentId} is not null and ${table.dueDate} is not null and ${table.status} in ('todo', 'doing', 'waiting')`,
      ),
    check(
      "tasks_recurrence_interval_positive",
      sql`${table.recurrenceInterval} >= 1`,
    ),
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

export const pendingCaptures = pgTable(
  "pending_captures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    rawText: text("raw_text").notNull(),
    source: pendingCaptureSourceEnum("source").notNull().default("manual"),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    parsedIntent: jsonb("parsed_intent")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    candidates: jsonb("candidates")
      .$type<unknown[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: pendingCaptureStatusEnum("status").notNull().default("pending"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pending_captures_user_status_captured_idx").on(
      table.userId,
      table.status,
      table.capturedAt,
    ),
    index("pending_captures_user_captured_idx").on(
      table.userId,
      table.capturedAt,
    ),
  ],
);

export const captureTokens = pgTable(
  "capture_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    tokenHash: text("token_hash").notNull(),
    tokenPrefix: varchar("token_prefix", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("capture_tokens_token_hash_unique").on(table.tokenHash),
    index("capture_tokens_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("capture_tokens_user_active_idx").on(table.userId, table.revokedAt),
  ],
);
