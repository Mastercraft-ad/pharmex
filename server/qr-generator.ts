import QRCode from "qrcode";
import { mkdir } from "fs/promises";
import { join } from "path";

const QR_CODE_DIR = join(process.cwd(), "uploads", "qrcodes");

// Ensure QR code directory exists
export async function ensureQRCodeDir() {
  try {
    await mkdir(QR_CODE_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating QR code directory:", error);
  }
}

/**
 * Generate QR code for a drug batch
 * @param serialId - The unique serial ID of the batch
 * @param verificationUrl - Base URL for verification (optional)
 * @returns Path to the generated QR code
 */
export async function generateQRCode(
  serialId: string,
  verificationUrl?: string
): Promise<string> {
  await ensureQRCodeDir();

  // QR data contains either just the serial ID or full verification URL
  const qrData = verificationUrl
    ? `${verificationUrl}/verify?id=${serialId}`
    : serialId;

  const fileName = `${serialId}.png`;
  const filePath = join(QR_CODE_DIR, fileName);

  try {
    await QRCode.toFile(filePath, qrData, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 400,
      margin: 2,
    });

    // Return the web-accessible path
    return `/uploads/qrcodes/${fileName}`;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as base64 data URL
 */
export async function generateQRCodeDataURL(serialId: string): Promise<string> {
  try {
    return await QRCode.toDataURL(serialId, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
    });
  } catch (error) {
    console.error("Error generating QR code data URL:", error);
    throw new Error("Failed to generate QR code");
  }
}
