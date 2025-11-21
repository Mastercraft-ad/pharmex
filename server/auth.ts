import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ethers } from "ethers";
import { randomBytes } from "crypto";
import type { User } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Attach user info to request
    req.user = decoded as User;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

// Wallet authentication functions

/**
 * Generate a random nonce for wallet authentication
 */
export function generateNonce(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Verify a wallet signature
 * @param walletAddress - The claimed wallet address
 * @param message - The message that was signed
 * @param signature - The signature from MetaMask
 * @returns true if signature is valid for the wallet address
 */
export function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): boolean {
  try {
    // Recover the address that signed the message
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Create the authentication message for wallet signing
 * @param nonce - The nonce to include in the message
 * @param walletAddress - The wallet address
 * @returns The message to be signed
 */
export function createAuthMessage(nonce: string, walletAddress: string): string {
  return `Welcome to PharmaBlock Systems!

Please sign this message to authenticate your wallet.
This will not trigger any blockchain transaction or cost gas fees.

Wallet: ${walletAddress}
Nonce: ${nonce}

By signing, you confirm ownership of this wallet address.`;
}
