import { pgTable, serial, text, timestamp, varchar, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  approved: integer("approved").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  projectNo: varchar("project_no", { length: 100 }).notNull(),
  plotNo: varchar("plot_no", { length: 100 }).notNull(),
  projectLocation: varchar("project_location", { length: 255 }).notNull().default("Abu Dhabi"),
  noc: varchar("noc", { length: 50 }).notNull().default("Pending"),
  perspective3d: varchar("perspective_3d", { length: 50 }).notNull().default("Pending"),
  architecture: varchar("architecture", { length: 50 }).notNull().default("Pending"),
  structure: varchar("structure", { length: 50 }).notNull().default("Pending"),
  status: varchar("status", { length: 100 }).notNull().default("In Progress"),
  contractor: varchar("contractor", { length: 255 }).notNull().default(""),
  remarks: text("remarks").notNull().default(""),
  archived: integer("archived").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastEditedBy: varchar("last_edited_by", { length: 255 }).notNull().default("Admin"),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  field: varchar("field", { length: 100 }).notNull(),
  oldValue: text("old_value").notNull().default(""),
  newValue: text("new_value").notNull().default(""),
  editedBy: varchar("edited_by", { length: 255 }).notNull().default("Admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
