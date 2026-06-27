import { promises as fs } from 'fs';
import path from 'path';

export const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Allowed file types
export const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

// Max file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Save uploaded file to local storage
 */
export async function saveFile(file: File, userId: string): Promise<{
  url: string;
  filename: string;
  size: number;
  type: string;
}> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: PDF, JPG, PNG, DOC, DOCX, TXT`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Create unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileExtension = file.name.split('.').pop() || 'file';
  const filename = `${userId}-${timestamp}-${randomString}.${fileExtension}`;

  // Ensure uploads directory exists
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  // Save file
  const filePath = path.join(UPLOADS_DIR, filename);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, fileBuffer);

  // Return file info
  return {
    url: `/uploads/${filename}`,
    filename: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Delete file from local storage
 */
export async function deleteFile(filename: string): Promise<void> {
  try {
    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error if file doesn't exist
  }
}

/**
 * Get file info
 */
export async function getFileInfo(filename: string): Promise<{
  exists: boolean;
  size?: number;
} | null> {
  try {
    const filePath = path.join(UPLOADS_DIR, filename);
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
    };
  } catch (error) {
    return { exists: false };
  }
}
