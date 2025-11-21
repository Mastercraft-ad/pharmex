import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles in the pharmaceutical supply chain
export const userRoleEnum = ["manufacturer", "distributor", "pharmacy", "consumer"] as const;
export type UserRole = typeof userRoleEnum[number];

// Batch status options
export const batchStatusEnum = ["active", "transferred", "recalled", "expired"] as const;
export type BatchStatus = typeof batchStatusEnum[number];

// Transfer status options
export const transferStatusEnum = ["pending", "accepted", "rejected"] as const;
export type TransferStatus = typeof transferStatusEnum[number];

// Verification result options
export const verificationResultEnum = ["authentic", "counterfeit", "unknown", "warning"] as const;
export type VerificationResult = typeof verificationResultEnum[number];

// Pending wallet nonces - temporary storage for authentication nonces
export const pendingNonces = pgTable("pending_nonces", {
  walletAddress: text("wallet_address").primaryKey(),
  nonce: text("nonce").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Users table - stores all platform users (manufacturers, distributors, pharmacies)
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(), // Optional for wallet-only authentication
  passwordHash: text("password_hash"), // Optional for wallet-only authentication
  role: text("role").notNull(), // manufacturer, distributor, pharmacy
  companyName: text("company_name").notNull(),
  licenseNumber: text("license_number").notNull(),
  country: text("country").notNull().default("Nigeria"),
  walletAddress: text("wallet_address").unique(), // Optional - Ethereum wallet address for wallet-only auth
  nonce: text("nonce"), // Random nonce for wallet authentication
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Drug batches table - all registered pharmaceutical products
export const drugBatches = pgTable("drug_batches", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  serialId: text("serial_id").notNull().unique(), // Format: DRUG-YEAR-UUID
  drugName: text("drug_name").notNull(),
  batchNumber: text("batch_number").notNull(),
  quantity: integer("quantity").notNull(),
  manufacturerId: varchar("manufacturer_id", { length: 36 }).notNull().references(() => users.id),
  productionDate: timestamp("production_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  manufacturingLocation: text("manufacturing_location").notNull(),
  metadataHash: text("metadata_hash").notNull(), // SHA-256 hash of metadata
  blockchainTxHash: text("blockchain_tx_hash").notNull(), // Transaction hash from blockchain simulation
  qrCodePath: text("qr_code_path"), // Path to QR code image
  status: text("status").notNull().default("active"), // active, transferred, recalled, expired
  currentOwnerId: varchar("current_owner_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Transfers table - tracks all batch transfers in the supply chain
export const transfers = pgTable("transfers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  serialId: text("serial_id").notNull().references(() => drugBatches.serialId),
  senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id),
  recipientId: varchar("recipient_id", { length: 36 }).notNull().references(() => users.id),
  senderRole: text("sender_role").notNull(),
  recipientRole: text("recipient_role").notNull(),
  quantity: integer("quantity").notNull(),
  transferType: text("transfer_type").notNull(), // manufacturer_to_distributor, distributor_to_pharmacy, pharmacy_to_consumer
  blockchainTxHash: text("blockchain_tx_hash").notNull(),
  location: text("location").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  transferDate: timestamp("transfer_date").notNull().defaultNow(),
  acceptedDate: timestamp("accepted_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Verification logs - every verification attempt is logged
export const verificationLogs = pgTable("verification_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  serialId: text("serial_id").notNull(),
  verifierRole: text("verifier_role"), // manufacturer, distributor, pharmacy, consumer (null for public)
  verifierUserId: varchar("verifier_user_id", { length: 36 }).references(() => users.id),
  result: text("result").notNull(), // authentic, counterfeit, unknown, warning
  ipAddress: text("ip_address"),
  location: text("location"),
  deviceInfo: text("device_info"),
  verifiedAt: timestamp("verified_at").notNull().defaultNow(),
});

// Recalls table - drug recall information
export const recalls = pgTable("recalls", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  serialId: text("serial_id").notNull().references(() => drugBatches.serialId),
  reason: text("reason").notNull(),
  initiatorId: varchar("initiator_id", { length: 36 }).notNull().references(() => users.id),
  blockchainTxHash: text("blockchain_tx_hash").notNull(),
  active: boolean("active").notNull().default(true),
  initiatedAt: timestamp("initiated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Suspicious reports - for pharmacy/consumer reporting
export const suspiciousReports = pgTable("suspicious_reports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  serialId: text("serial_id").notNull(),
  reporterRole: text("reporter_role"),
  reporterUserId: varchar("reporter_user_id", { length: 36 }).references(() => users.id),
  reason: text("reason").notNull(),
  description: text("description"),
  location: text("location"),
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
});

// Blockchain events table - immutable audit trail of all blockchain transactions
export const blockchainEvents = pgTable("blockchain_events", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  txHash: text("tx_hash").notNull().unique(),
  eventType: text("event_type").notNull(), // batch_registration, transfer, recall
  serialId: text("serial_id").notNull(),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  data: text("data").notNull(), // JSON-stringified event data
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address").optional(),
  passwordHash: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(userRoleEnum),
  companyName: z.string().min(1, "Company name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  nonce: z.string().optional(),
}).omit({ id: true, createdAt: true, lastLogin: true, verified: true });

export const insertDrugBatchSchema = createInsertSchema(drugBatches, {
  serialId: z.string().regex(/^DRUG-\d{4}-.+$/, "Invalid serial ID format"),
  drugName: z.string().min(1, "Drug name is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  productionDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  manufacturingLocation: z.string().min(1, "Manufacturing location is required"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTransferSchema = createInsertSchema(transfers, {
  quantity: z.number().int().positive("Quantity must be positive"),
  location: z.string().min(1, "Location is required"),
}).omit({ id: true, createdAt: true, transferDate: true, acceptedDate: true });

export const insertVerificationLogSchema = createInsertSchema(verificationLogs, {
  serialId: z.string().min(1, "Serial ID is required"),
  result: z.enum(verificationResultEnum),
}).omit({ id: true, verifiedAt: true });

export const insertRecallSchema = createInsertSchema(recalls, {
  serialId: z.string().min(1, "Serial ID is required"),
  reason: z.string().min(1, "Reason is required"),
}).omit({ id: true, initiatedAt: true, resolvedAt: true });

export const insertSuspiciousReportSchema = createInsertSchema(suspiciousReports, {
  serialId: z.string().min(1, "Serial ID is required"),
  reason: z.string().min(1, "Reason is required"),
}).omit({ id: true, reportedAt: true });

export const insertBlockchainEventSchema = createInsertSchema(blockchainEvents, {
  txHash: z.string().min(1, "Transaction hash is required"),
  eventType: z.string().min(1, "Event type is required"),
  serialId: z.string().min(1, "Serial ID is required"),
  data: z.string().min(1, "Event data is required"),
}).omit({ id: true, timestamp: true });

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DrugBatch = typeof drugBatches.$inferSelect;
export type InsertDrugBatch = z.infer<typeof insertDrugBatchSchema>;

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;

export type VerificationLog = typeof verificationLogs.$inferSelect;
export type InsertVerificationLog = z.infer<typeof insertVerificationLogSchema>;

export type Recall = typeof recalls.$inferSelect;
export type InsertRecall = z.infer<typeof insertRecallSchema>;

export type SuspiciousReport = typeof suspiciousReports.$inferSelect;
export type InsertSuspiciousReport = z.infer<typeof insertSuspiciousReportSchema>;

export type BlockchainEvent = typeof blockchainEvents.$inferSelect;
export type InsertBlockchainEvent = z.infer<typeof insertBlockchainEventSchema>;
