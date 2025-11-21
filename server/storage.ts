import {
  users,
  pendingNonces,
  drugBatches,
  transfers,
  verificationLogs,
  recalls,
  suspiciousReports,
  blockchainEvents,
  type User,
  type InsertUser,
  type DrugBatch,
  type InsertDrugBatch,
  type Transfer,
  type InsertTransfer,
  type VerificationLog,
  type InsertVerificationLog,
  type Recall,
  type InsertRecall,
  type SuspiciousReport,
  type InsertSuspiciousReport,
  type BlockchainEvent,
  type InsertBlockchainEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLogin(id: string): Promise<void>;
  updateUserNonce(walletAddress: string, nonce: string): Promise<void>;
  
  // Pending nonce operations
  storePendingNonce(walletAddress: string, nonce: string): Promise<void>;
  getPendingNonce(walletAddress: string): Promise<string | undefined>;
  deletePendingNonce(walletAddress: string): Promise<void>;

  // Drug batch operations
  createBatch(batch: InsertDrugBatch): Promise<DrugBatch>;
  getBatchBySerialId(serialId: string): Promise<DrugBatch | undefined>;
  getBatchesByManufacturer(manufacturerId: string, limit?: number): Promise<DrugBatch[]>;
  updateBatchStatus(serialId: string, status: string): Promise<void>;
  updateBatchOwner(serialId: string, ownerId: string): Promise<void>;
  getRecentBatches(manufacturerId: string, limit?: number): Promise<DrugBatch[]>;

  // Transfer operations
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransfersBySerialId(serialId: string): Promise<Transfer[]>;
  getTransferById(id: string): Promise<Transfer | undefined>;
  updateTransferStatus(
    id: string,
    status: string,
    acceptedDate?: Date
  ): Promise<void>;
  getPendingTransfersForRecipient(recipientId: string): Promise<Transfer[]>;
  getTransfersBySender(senderId: string): Promise<Transfer[]>;

  // Verification operations
  createVerificationLog(log: InsertVerificationLog): Promise<VerificationLog>;
  getVerificationsByBatch(serialId: string): Promise<VerificationLog[]>;
  getVerificationsByUser(userId: string): Promise<VerificationLog[]>;

  // Recall operations
  createRecall(recall: InsertRecall): Promise<Recall>;
  getRecallBySerialId(serialId: string): Promise<Recall | undefined>;
  getActiveRecalls(): Promise<Recall[]>;
  resolveRecall(id: string): Promise<void>;

  // Suspicious report operations
  createSuspiciousReport(report: InsertSuspiciousReport): Promise<SuspiciousReport>;
  getSuspiciousReportsByBatch(serialId: string): Promise<SuspiciousReport[]>;

  // Blockchain event operations
  createBlockchainEvent(event: InsertBlockchainEvent): Promise<BlockchainEvent>;
  getBlockchainEventsBySerialId(serialId: string): Promise<BlockchainEvent[]>;
  getBlockchainEventByTxHash(txHash: string): Promise<BlockchainEvent | undefined>;

  // Statistics operations
  getManufacturerStats(manufacturerId: string): Promise<{
    totalBatches: number;
    activeBatches: number;
    transferredBatches: number;
    recalledBatches: number;
  }>;
  getDistributorStats(distributorId: string): Promise<{
    totalInventory: number;
    pendingIncoming: number;
    totalTransfers: number;
    acceptedTransfers: number;
  }>;
  getPharmacyStats(pharmacyId: string): Promise<{
    totalVerifications: number;
    authenticCount: number;
    suspiciousCount: number;
    inventoryCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress.toLowerCase()));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserNonce(walletAddress: string, nonce: string): Promise<void> {
    await db
      .update(users)
      .set({ nonce })
      .where(eq(users.walletAddress, walletAddress.toLowerCase()));
  }

  // Pending nonce operations
  async storePendingNonce(walletAddress: string, nonce: string): Promise<void> {
    await db
      .insert(pendingNonces)
      .values({ walletAddress: walletAddress.toLowerCase(), nonce })
      .onConflictDoUpdate({
        target: pendingNonces.walletAddress,
        set: { nonce, createdAt: new Date() },
      });
  }

  async getPendingNonce(walletAddress: string): Promise<string | undefined> {
    const [result] = await db
      .select()
      .from(pendingNonces)
      .where(eq(pendingNonces.walletAddress, walletAddress.toLowerCase()));
    return result?.nonce;
  }

  async deletePendingNonce(walletAddress: string): Promise<void> {
    await db
      .delete(pendingNonces)
      .where(eq(pendingNonces.walletAddress, walletAddress.toLowerCase()));
  }

  // Drug batch operations
  async createBatch(insertBatch: InsertDrugBatch): Promise<DrugBatch> {
    const [batch] = await db.insert(drugBatches).values(insertBatch).returning();
    return batch;
  }

  async getBatchBySerialId(serialId: string): Promise<DrugBatch | undefined> {
    const [batch] = await db
      .select()
      .from(drugBatches)
      .where(eq(drugBatches.serialId, serialId));
    return batch || undefined;
  }

  async getBatchesByManufacturer(
    manufacturerId: string,
    limit?: number
  ): Promise<DrugBatch[]> {
    const query = db
      .select()
      .from(drugBatches)
      .where(eq(drugBatches.manufacturerId, manufacturerId))
      .orderBy(desc(drugBatches.createdAt));

    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async updateBatchStatus(serialId: string, status: string): Promise<void> {
    await db
      .update(drugBatches)
      .set({ status, updatedAt: new Date() })
      .where(eq(drugBatches.serialId, serialId));
  }

  async updateBatchOwner(serialId: string, ownerId: string): Promise<void> {
    await db
      .update(drugBatches)
      .set({ currentOwnerId: ownerId, updatedAt: new Date() })
      .where(eq(drugBatches.serialId, serialId));
  }

  async getRecentBatches(manufacturerId: string, limit = 5): Promise<DrugBatch[]> {
    return await db
      .select()
      .from(drugBatches)
      .where(eq(drugBatches.manufacturerId, manufacturerId))
      .orderBy(desc(drugBatches.createdAt))
      .limit(limit);
  }

  // Transfer operations
  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const [transfer] = await db
      .insert(transfers)
      .values(insertTransfer)
      .returning();
    return transfer;
  }

  async getTransfersBySerialId(serialId: string): Promise<Transfer[]> {
    return await db
      .select()
      .from(transfers)
      .where(eq(transfers.serialId, serialId))
      .orderBy(transfers.transferDate);
  }

  async getTransferById(id: string): Promise<Transfer | undefined> {
    const [transfer] = await db
      .select()
      .from(transfers)
      .where(eq(transfers.id, id));
    return transfer || undefined;
  }

  async updateTransferStatus(
    id: string,
    status: string,
    acceptedDate?: Date
  ): Promise<void> {
    await db
      .update(transfers)
      .set({
        status,
        ...(acceptedDate && { acceptedDate }),
      })
      .where(eq(transfers.id, id));
  }

  async getPendingTransfersForRecipient(recipientId: string): Promise<Transfer[]> {
    return await db
      .select()
      .from(transfers)
      .where(
        and(eq(transfers.recipientId, recipientId), eq(transfers.status, "pending"))
      )
      .orderBy(desc(transfers.transferDate));
  }

  async getTransfersBySender(senderId: string): Promise<Transfer[]> {
    return await db
      .select()
      .from(transfers)
      .where(eq(transfers.senderId, senderId))
      .orderBy(desc(transfers.transferDate));
  }

  // Verification operations
  async createVerificationLog(
    insertLog: InsertVerificationLog
  ): Promise<VerificationLog> {
    const [log] = await db
      .insert(verificationLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getVerificationsByBatch(serialId: string): Promise<VerificationLog[]> {
    return await db
      .select()
      .from(verificationLogs)
      .where(eq(verificationLogs.serialId, serialId))
      .orderBy(desc(verificationLogs.verifiedAt));
  }

  async getVerificationsByUser(userId: string): Promise<VerificationLog[]> {
    return await db
      .select()
      .from(verificationLogs)
      .where(eq(verificationLogs.verifierUserId, userId))
      .orderBy(desc(verificationLogs.verifiedAt));
  }

  // Recall operations
  async createRecall(insertRecall: InsertRecall): Promise<Recall> {
    const [recall] = await db.insert(recalls).values(insertRecall).returning();
    return recall;
  }

  async getRecallBySerialId(serialId: string): Promise<Recall | undefined> {
    const [recall] = await db
      .select()
      .from(recalls)
      .where(and(eq(recalls.serialId, serialId), eq(recalls.active, true)));
    return recall || undefined;
  }

  async getActiveRecalls(): Promise<Recall[]> {
    return await db
      .select()
      .from(recalls)
      .where(eq(recalls.active, true))
      .orderBy(desc(recalls.initiatedAt));
  }

  async resolveRecall(id: string): Promise<void> {
    await db
      .update(recalls)
      .set({ active: false, resolvedAt: new Date() })
      .where(eq(recalls.id, id));
  }

  // Suspicious report operations
  async createSuspiciousReport(
    insertReport: InsertSuspiciousReport
  ): Promise<SuspiciousReport> {
    const [report] = await db
      .insert(suspiciousReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getSuspiciousReportsByBatch(
    serialId: string
  ): Promise<SuspiciousReport[]> {
    return await db
      .select()
      .from(suspiciousReports)
      .where(eq(suspiciousReports.serialId, serialId))
      .orderBy(desc(suspiciousReports.reportedAt));
  }

  // Blockchain event operations
  async createBlockchainEvent(
    insertEvent: InsertBlockchainEvent
  ): Promise<BlockchainEvent> {
    const [event] = await db
      .insert(blockchainEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getBlockchainEventsBySerialId(serialId: string): Promise<BlockchainEvent[]> {
    return await db
      .select()
      .from(blockchainEvents)
      .where(eq(blockchainEvents.serialId, serialId))
      .orderBy(blockchainEvents.timestamp);
  }

  async getBlockchainEventByTxHash(
    txHash: string
  ): Promise<BlockchainEvent | undefined> {
    const [event] = await db
      .select()
      .from(blockchainEvents)
      .where(eq(blockchainEvents.txHash, txHash));
    return event || undefined;
  }

  // Statistics operations
  async getManufacturerStats(manufacturerId: string) {
    const batches = await db
      .select()
      .from(drugBatches)
      .where(eq(drugBatches.manufacturerId, manufacturerId));

    const totalBatches = batches.length;
    const activeBatches = batches.filter((b) => b.status === "active").length;
    const transferredBatches = batches.filter((b) => b.status === "transferred")
      .length;
    const recalledBatches = batches.filter((b) => b.status === "recalled").length;

    return {
      totalBatches,
      activeBatches,
      transferredBatches,
      recalledBatches,
    };
  }

  async getDistributorStats(distributorId: string) {
    const ownedBatches = await db
      .select()
      .from(drugBatches)
      .where(eq(drugBatches.currentOwnerId, distributorId));

    const pendingTransfers = await db
      .select()
      .from(transfers)
      .where(
        and(
          eq(transfers.recipientId, distributorId),
          eq(transfers.status, "pending")
        )
      );

    const allTransfers = await db
      .select()
      .from(transfers)
      .where(eq(transfers.senderId, distributorId));

    const acceptedTransfers = allTransfers.filter(
      (t) => t.status === "accepted"
    ).length;

    return {
      totalInventory: ownedBatches.length,
      pendingIncoming: pendingTransfers.length,
      totalTransfers: allTransfers.length,
      acceptedTransfers,
    };
  }

  async getPharmacyStats(pharmacyId: string) {
    const verifications = await db
      .select()
      .from(verificationLogs)
      .where(eq(verificationLogs.verifierUserId, pharmacyId));

    const inventory = await db
      .select()
      .from(drugBatches)
      .where(eq(drugBatches.currentOwnerId, pharmacyId));

    const totalVerifications = verifications.length;
    const authenticCount = verifications.filter(
      (v) => v.result === "authentic"
    ).length;
    const suspiciousCount = verifications.filter(
      (v) => v.result === "counterfeit" || v.result === "warning"
    ).length;

    return {
      totalVerifications,
      authenticCount,
      suspiciousCount,
      inventoryCount: inventory.length,
    };
  }
}

export const storage = new DatabaseStorage();
