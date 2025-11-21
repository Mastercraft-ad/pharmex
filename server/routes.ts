import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import {
  generateToken,
  hashPassword,
  comparePassword,
  authenticate,
  requireRole,
  generateNonce,
  verifyWalletSignature,
  createAuthMessage,
  type AuthRequest,
} from "./auth";
import {
  generateWalletAddress,
  registerBatch,
  recordTransfer,
  initiateRecall,
  generateMetadataHash,
} from "./blockchain";
import { generateQRCode, ensureQRCodeDir } from "./qr-generator";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure upload directories exist
  await ensureQRCodeDir();

  // Serve uploads directory
  app.use("/uploads", express.static("uploads"));

  // ============ Authentication Routes ============

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, role, companyName, licenseNumber } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and generate wallet address
      const passwordHash = await hashPassword(password);
      const walletAddress = generateWalletAddress();

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        role,
        companyName,
        licenseNumber,
        walletAddress,
      });

      // Generate token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUserLogin(user.id);

      // Generate token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  // Get current user
  app.get(
    "/api/auth/me",
    authenticate as any,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          walletAddress: user.walletAddress,
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // ============ Wallet Authentication Routes ============

  // Get nonce for wallet authentication
  app.post("/api/auth/wallet/nonce", async (req, res) => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      // Generate a new nonce
      const nonce = generateNonce();

      // Check if user exists
      const existingUser = await storage.getUserByWalletAddress(walletAddress);
      
      if (existingUser) {
        // Update nonce for existing user
        await storage.updateUserNonce(walletAddress, nonce);
      } else {
        // Store nonce for new user in pending_nonces table
        await storage.storePendingNonce(walletAddress, nonce);
      }

      // Create the message to sign
      const message = createAuthMessage(nonce, walletAddress);

      res.json({ 
        nonce, 
        message,
        isNewUser: !existingUser 
      });
    } catch (error: any) {
      console.error("Nonce generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate nonce" });
    }
  });

  // Register with wallet
  app.post("/api/auth/wallet/register", async (req, res) => {
    try {
      const { walletAddress, signature, message, role, companyName, licenseNumber } = req.body;

      // Validate required fields
      if (!walletAddress || !signature || !message || !role || !companyName || !licenseNumber) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByWalletAddress(walletAddress);
      if (existingUser) {
        return res.status(400).json({ message: "Wallet already registered" });
      }

      // CRITICAL: Get the stored pending nonce for this wallet
      const storedNonce = await storage.getPendingNonce(walletAddress);
      if (!storedNonce) {
        return res.status(401).json({ message: "Please request a new authentication nonce" });
      }

      // Extract nonce from message
      const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/);
      if (!nonceMatch || !nonceMatch[1]) {
        return res.status(401).json({ message: "Invalid message format" });
      }
      
      const providedNonce = nonceMatch[1];
      
      // CRITICAL: Verify the nonce matches the stored pending nonce (prevents replay attacks)
      if (providedNonce !== storedNonce) {
        return res.status(401).json({ message: "Invalid or expired nonce" });
      }

      // Verify the complete message format
      const expectedMessage = createAuthMessage(storedNonce, walletAddress);
      if (message !== expectedMessage) {
        return res.status(401).json({ message: "Invalid authentication message" });
      }

      // Verify signature
      const isValidSignature = verifyWalletSignature(walletAddress, message, signature);
      if (!isValidSignature) {
        return res.status(401).json({ message: "Invalid signature" });
      }

      // CRITICAL: Delete the pending nonce immediately to prevent replay
      await storage.deletePendingNonce(walletAddress);

      // Create user with a NEW nonce (different from the one used for registration)
      const user = await storage.createUser({
        walletAddress: walletAddress.toLowerCase(),
        role,
        companyName,
        licenseNumber,
        nonce: generateNonce(), // Generate new nonce for next login
        verified: true, // Auto-verify wallet users
      });

      // Update last login
      await storage.updateUserLogin(user.id);

      // Generate token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          role: user.role,
          companyName: user.companyName,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      console.error("Wallet registration error:", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  // Login with wallet
  app.post("/api/auth/wallet/login", async (req, res) => {
    try {
      const { walletAddress, signature, message } = req.body;

      // Validate required fields
      if (!walletAddress || !signature || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Find user
      const user = await storage.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(401).json({ message: "Wallet not registered" });
      }

      // CRITICAL: Verify that the message contains the stored nonce
      if (!user.nonce) {
        return res.status(401).json({ message: "Please request a new authentication nonce" });
      }

      // Extract nonce from message
      const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/);
      if (!nonceMatch || !nonceMatch[1]) {
        return res.status(401).json({ message: "Invalid message format" });
      }
      
      const providedNonce = nonceMatch[1];
      
      // Verify the nonce matches the stored nonce (prevents replay attacks)
      if (providedNonce !== user.nonce) {
        return res.status(401).json({ message: "Invalid or expired nonce" });
      }

      // Verify the complete message format
      const expectedMessage = createAuthMessage(user.nonce, walletAddress);
      if (message !== expectedMessage) {
        return res.status(401).json({ message: "Invalid authentication message" });
      }

      // Verify signature
      const isValidSignature = verifyWalletSignature(walletAddress, message, signature);
      if (!isValidSignature) {
        return res.status(401).json({ message: "Invalid signature" });
      }

      // CRITICAL: Generate new nonce IMMEDIATELY to prevent replay attacks
      await storage.updateUserNonce(walletAddress, generateNonce());

      // Update last login
      await storage.updateUserLogin(user.id);

      // Generate token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      console.error("Wallet login error:", error);
      res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  // ============ Manufacturer Routes ============

  // Register new batch
  app.post(
    "/api/batches/register",
    authenticate as any,
    requireRole("manufacturer") as any,
    async (req: AuthRequest, res) => {
      try {
        const {
          drugName,
          batchNumber,
          quantity,
          productionDate,
          expiryDate,
          manufacturingLocation,
        } = req.body;

        const manufacturerId = req.user!.id;
        const user = await storage.getUser(manufacturerId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Generate unique serial ID
        const year = new Date().getFullYear();
        const uniqueId = randomUUID().substring(0, 8).toUpperCase();
        const serialId = `DRUG-${year}-${uniqueId}`;

        // Create metadata
        const metadata = {
          drugName,
          batchNumber,
          quantity,
          productionDate,
          expiryDate,
          manufacturingLocation,
          manufacturer: user.companyName,
          walletAddress: user.walletAddress,
        };

        // Generate metadata hash
        const metadataHash = generateMetadataHash(metadata);

        // Register on blockchain (simulated)
        const blockchainTx = registerBatch(
          serialId,
          metadataHash,
          user.walletAddress
        );

        // Generate QR code
        const qrCodePath = await generateQRCode(serialId);

        // Create batch in database
        const batch = await storage.createBatch({
          serialId,
          drugName,
          batchNumber,
          quantity,
          manufacturerId,
          productionDate: new Date(productionDate),
          expiryDate: new Date(expiryDate),
          manufacturingLocation,
          metadataHash,
          blockchainTxHash: blockchainTx.txHash,
          qrCodePath,
          currentOwnerId: manufacturerId,
        });

        // Persist blockchain event for immutability
        await storage.createBlockchainEvent({
          txHash: blockchainTx.txHash,
          eventType: "batch_registration",
          serialId,
          fromAddress: user.walletAddress,
          toAddress: user.walletAddress,
          data: JSON.stringify({
            drugName,
            batchNumber,
            quantity,
            metadataHash,
            timestamp: blockchainTx.timestamp,
          }),
        });

        res.json({
          ...batch,
          blockchainTx: {
            hash: blockchainTx.txHash,
            timestamp: blockchainTx.timestamp,
          },
        });
      } catch (error: any) {
        console.error("Batch registration error:", error);
        res
          .status(500)
          .json({ message: error.message || "Failed to register batch" });
      }
    }
  );

  // Get manufacturer statistics
  app.get(
    "/api/batches/statistics",
    authenticate as any,
    requireRole("manufacturer") as any,
    async (req: AuthRequest, res) => {
      try {
        const stats = await storage.getManufacturerStats(req.user!.id);
        res.json(stats);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Get recent batches
  app.get(
    "/api/batches/recent",
    authenticate as any,
    requireRole("manufacturer") as any,
    async (req: AuthRequest, res) => {
      try {
        const batches = await storage.getRecentBatches(req.user!.id, 5);
        res.json(batches);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Get all batches for manufacturer
  app.get(
    "/api/batches",
    authenticate as any,
    requireRole("manufacturer") as any,
    async (req: AuthRequest, res) => {
      try {
        const batches = await storage.getBatchesByManufacturer(req.user!.id);
        res.json(batches);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Get batch by serial ID
  app.get(
    "/api/batches/:serialId",
    authenticate as any,
    async (req: AuthRequest, res) => {
      try {
        const batch = await storage.getBatchBySerialId(req.params.serialId);
        if (!batch) {
          return res.status(404).json({ message: "Batch not found" });
        }

        // Get transfer history
        const transfers = await storage.getTransfersBySerialId(batch.serialId);

        res.json({ batch, transfers });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Initiate transfer
  app.post(
    "/api/batches/:serialId/transfer",
    authenticate as any,
    async (req: AuthRequest, res) => {
      try {
        const { recipientEmail, quantity, location, notes } = req.body;
        const serialId = req.params.serialId;
        const senderId = req.user!.id;

        // Get batch
        const batch = await storage.getBatchBySerialId(serialId);
        if (!batch) {
          return res.status(404).json({ message: "Batch not found" });
        }

        // Verify sender owns the batch
        if (batch.currentOwnerId !== senderId) {
          return res.status(403).json({ message: "You do not own this batch" });
        }

        // Get recipient
        const recipient = await storage.getUserByEmail(recipientEmail);
        if (!recipient) {
          return res
            .status(404)
            .json({ message: "Recipient not found" });
        }

        // Get sender
        const sender = await storage.getUser(senderId);
        if (!sender) {
          return res.status(404).json({ message: "Sender not found" });
        }

        // Determine transfer type
        const transferType =
          sender.role === "manufacturer" && recipient.role === "distributor"
            ? "manufacturer_to_distributor"
            : sender.role === "distributor" && recipient.role === "pharmacy"
            ? "distributor_to_pharmacy"
            : sender.role === "pharmacy" && recipient.role === "consumer"
            ? "pharmacy_to_consumer"
            : "other";

        // Record transfer on blockchain
        const blockchainTx = recordTransfer(
          serialId,
          sender.walletAddress,
          recipient.walletAddress,
          transferType
        );

        // Create transfer record
        const transfer = await storage.createTransfer({
          serialId,
          senderId,
          recipientId: recipient.id,
          senderRole: sender.role,
          recipientRole: recipient.role,
          quantity,
          transferType,
          blockchainTxHash: blockchainTx.txHash,
          location,
          notes,
        });

        // Persist blockchain event for immutability
        await storage.createBlockchainEvent({
          txHash: blockchainTx.txHash,
          eventType: "transfer",
          serialId,
          fromAddress: sender.walletAddress,
          toAddress: recipient.walletAddress,
          data: JSON.stringify({
            transferType,
            quantity,
            location,
            timestamp: blockchainTx.timestamp,
          }),
        });

        res.json(transfer);
      } catch (error: any) {
        console.error("Transfer error:", error);
        res.status(500).json({ message: error.message || "Transfer failed" });
      }
    }
  );

  // ============ Distributor Routes ============

  // Get distributor statistics
  app.get(
    "/api/distributor/statistics",
    authenticate as any,
    requireRole("distributor") as any,
    async (req: AuthRequest, res) => {
      try {
        const stats = await storage.getDistributorStats(req.user!.id);
        res.json(stats);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Get pending incoming transfers
  app.get(
    "/api/distributor/incoming",
    authenticate as any,
    requireRole("distributor") as any,
    async (req: AuthRequest, res) => {
      try {
        const transfers = await storage.getPendingTransfersForRecipient(
          req.user!.id
        );
        res.json(transfers);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Accept transfer
  app.post(
    "/api/distributor/accept/:transferId",
    authenticate as any,
    requireRole("distributor") as any,
    async (req: AuthRequest, res) => {
      try {
        const transfer = await storage.getTransferById(req.params.transferId);
        if (!transfer) {
          return res.status(404).json({ message: "Transfer not found" });
        }

        if (transfer.recipientId !== req.user!.id) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Update transfer status
        await storage.updateTransferStatus(
          transfer.id,
          "accepted",
          new Date()
        );

        // Update batch owner
        await storage.updateBatchOwner(transfer.serialId, req.user!.id);

        // Record acceptance on blockchain
        const blockchainTx = recordTransfer(
          transfer.serialId,
          transfer.blockchainTxHash,
          user.walletAddress,
          "transfer_accepted"
        );

        // Persist blockchain event
        await storage.createBlockchainEvent({
          txHash: blockchainTx.txHash,
          eventType: "transfer",
          serialId: transfer.serialId,
          fromAddress: transfer.blockchainTxHash,
          toAddress: user.walletAddress,
          data: JSON.stringify({
            action: "accepted",
            originalTransferHash: transfer.blockchainTxHash,
            timestamp: blockchainTx.timestamp,
          }),
        });

        res.json({ message: "Transfer accepted successfully" });
      } catch (error: any) {
        res
          .status(500)
          .json({ message: error.message || "Failed to accept transfer" });
      }
    }
  );

  // Reject transfer
  app.post(
    "/api/distributor/reject/:transferId",
    authenticate as any,
    requireRole("distributor") as any,
    async (req: AuthRequest, res) => {
      try {
        const transfer = await storage.getTransferById(req.params.transferId);
        if (!transfer) {
          return res.status(404).json({ message: "Transfer not found" });
        }

        if (transfer.recipientId !== req.user!.id) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        await storage.updateTransferStatus(transfer.id, "rejected");
        res.json({ message: "Transfer rejected" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // ============ Pharmacy Routes ============

  // Get pharmacy statistics
  app.get(
    "/api/pharmacy/statistics",
    authenticate as any,
    requireRole("pharmacy") as any,
    async (req: AuthRequest, res) => {
      try {
        const stats = await storage.getPharmacyStats(req.user!.id);
        res.json(stats);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Verify drug (pharmacy)
  app.post(
    "/api/pharmacy/verify",
    authenticate as any,
    requireRole("pharmacy") as any,
    async (req: AuthRequest, res) => {
      try {
        const { serialId } = req.body;

        const batch = await storage.getBatchBySerialId(serialId);
        if (!batch) {
          // Log failed verification
          await storage.createVerificationLog({
            serialId,
            verifierRole: "pharmacy",
            verifierUserId: req.user!.id,
            result: "counterfeit",
          });

          return res.json({
            result: "counterfeit",
            message: "This product is not registered in the system",
          });
        }

        // Check for recalls
        const recall = await storage.getRecallBySerialId(serialId);

        // Check expiry
        const isExpired = new Date(batch.expiryDate) < new Date();

        let result: "authentic" | "warning" | "counterfeit" = "authentic";
        let message = "This product is verified authentic";

        if (recall) {
          result = "warning";
          message = `WARNING: This product has been recalled. Reason: ${recall.reason}`;
        } else if (isExpired) {
          result = "warning";
          message = "WARNING: This product has expired";
        }

        // Log verification
        await storage.createVerificationLog({
          serialId,
          verifierRole: "pharmacy",
          verifierUserId: req.user!.id,
          result,
        });

        // Get transfer history
        const transfers = await storage.getTransfersBySerialId(serialId);

        res.json({
          result,
          message,
          batch,
          transfers,
          recall,
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Get pending incoming transfers for pharmacy
  app.get(
    "/api/pharmacy/incoming",
    authenticate as any,
    requireRole("pharmacy") as any,
    async (req: AuthRequest, res) => {
      try {
        const transfers = await storage.getPendingTransfersForRecipient(
          req.user!.id
        );
        res.json(transfers);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Accept transfer (pharmacy)
  app.post(
    "/api/pharmacy/accept/:transferId",
    authenticate as any,
    requireRole("pharmacy") as any,
    async (req: AuthRequest, res) => {
      try {
        const transfer = await storage.getTransferById(req.params.transferId);
        if (!transfer) {
          return res.status(404).json({ message: "Transfer not found" });
        }

        if (transfer.recipientId !== req.user!.id) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        await storage.updateTransferStatus(
          transfer.id,
          "accepted",
          new Date()
        );
        await storage.updateBatchOwner(transfer.serialId, req.user!.id);

        // Record acceptance on blockchain
        const blockchainTx = recordTransfer(
          transfer.serialId,
          transfer.blockchainTxHash,
          user.walletAddress,
          "transfer_accepted"
        );

        // Persist blockchain event
        await storage.createBlockchainEvent({
          txHash: blockchainTx.txHash,
          eventType: "transfer",
          serialId: transfer.serialId,
          fromAddress: transfer.blockchainTxHash,
          toAddress: user.walletAddress,
          data: JSON.stringify({
            action: "accepted",
            originalTransferHash: transfer.blockchainTxHash,
            timestamp: blockchainTx.timestamp,
          }),
        });

        res.json({ message: "Transfer accepted successfully" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // ============ Public Verification Routes ============

  // Public verification (no auth required)
  app.post("/api/verify/public", async (req, res) => {
    try {
      const { serialId } = req.body;

      const batch = await storage.getBatchBySerialId(serialId);
      if (!batch) {
        await storage.createVerificationLog({
          serialId,
          result: "unknown",
        });

        return res.json({
          result: "unknown",
          message: "This product is not found in our system",
        });
      }

      // Check for recalls
      const recall = await storage.getRecallBySerialId(serialId);

      // Check expiry
      const isExpired = new Date(batch.expiryDate) < new Date();

      let result: "authentic" | "warning" | "counterfeit" = "authentic";
      let message = "This product is verified authentic";

      if (recall) {
        result = "warning";
        message = `WARNING: This product has been recalled. Reason: ${recall.reason}`;
      } else if (isExpired) {
        result = "warning";
        message = "WARNING: This product has expired";
      }

      // Log verification
      await storage.createVerificationLog({
        serialId,
        result,
      });

      res.json({
        result,
        message,
        batch: {
          drugName: batch.drugName,
          batchNumber: batch.batchNumber,
          productionDate: batch.productionDate,
          expiryDate: batch.expiryDate,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Report suspicious product
  app.post("/api/verify/report", async (req, res) => {
    try {
      const { serialId, reason, description, location } = req.body;

      await storage.createSuspiciousReport({
        serialId,
        reason,
        description,
        location,
      });

      res.json({ message: "Report submitted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
