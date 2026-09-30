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
  soilReportRequestedDate: timestamp("soil_report_requested_date"),
  soilReportExpectedDate: timestamp("soil_report_expected_date"),
  soilReportActualDate: timestamp("soil_report_actual_date"),
  soilReportLab: varchar("soil_report_lab", { length: 255 }),
  soilReportRequired: varchar("soil_report_required", { length: 20 }).notNull().default("Required"),
  siteProgressPercent: integer("site_progress_percent").notNull().default(0),
});

export const constructionStages = pgTable("construction_stages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  stageName: varchar("stage_name", { length: 100 }).notNull(),
  weight: integer("weight").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'done' | 'active' | 'pending'
  subPercent: integer("sub_percent").notNull().default(0), // 0-100, only meaningful when status = 'active'
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

// Sequential numbering per document type, per year — prevents duplicate/skipped invoice numbers
export const documentCounters = pgTable("document_counters", {
  id: serial("id").primaryKey(),
  docType: varchar("doc_type", { length: 20 }).notNull(), // 'INV' | 'RV' | 'TAX'
  year: integer("year").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
});

export const financeDocuments = pgTable("finance_documents", {
  id: serial("id").primaryKey(),
  docNumber: varchar("doc_number", { length: 50 }).notNull().unique(), // e.g. UBEC/INV/2026/0001
  docType: varchar("doc_type", { length: 20 }).notNull(), // 'invoice' | 'receipt_voucher' | 'tax_invoice'
  projectId: integer("project_id"), // optional link to a project
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientAddress: text("client_address").notNull().default(""),
  clientTrn: varchar("client_trn", { length: 50 }).notNull().default(""),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  subtotal: integer("subtotal").notNull().default(0), // stored in fils (AED cents) to avoid float rounding
  vatPercent: integer("vat_percent").notNull().default(5),
  vatAmount: integer("vat_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // 'draft' | 'sent' | 'paid' | 'cancelled'
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default(""), // for receipt vouchers
  notes: text("notes").notNull().default(""),
  createdBy: varchar("created_by", { length: 255 }).notNull().default("Admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  projectDetails: text("project_details").notNull().default(""),
});

export const financeDocumentItems = pgTable("finance_document_items", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0), // fils
  amount: integer("amount").notNull().default(0), // fils
  sortOrder: integer("sort_order").notNull().default(0),
});
