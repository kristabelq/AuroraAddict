import { prisma } from "./prisma";

/**
 * Generates a username from a name by:
 * 1. Converting to lowercase
 * 2. Removing special characters
 * 3. Replacing spaces with empty string or underscores
 * 4. If taken, appending a random 3-digit number
 */
export async function generateUsername(name: string): Promise<string> {
  // Clean the name to create a base username
  let baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove special characters and spaces
    .substring(0, 20); // Limit length

  if (!baseUsername) {
    baseUsername = "user";
  }

  // Check if base username is available
  let username = baseUsername;
  let isAvailable = await isUsernameAvailable(username);

  // If taken, try adding random 3-digit numbers
  let attempts = 0;
  while (!isAvailable && attempts < 10) {
    const randomDigits = Math.floor(100 + Math.random() * 900); // 3-digit number (100-999)
    username = `${baseUsername}${randomDigits}`;
    isAvailable = await isUsernameAvailable(username);
    attempts++;
  }

  // If still not available after 10 attempts, add timestamp
  if (!isAvailable) {
    username = `${baseUsername}${Date.now().toString().slice(-6)}`;
  }

  return username;
}

/**
 * Checks if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!username || username.length < 3) {
    return false;
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  return !existingUser;
}

/**
 * Validates username format
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username) {
    return { valid: false, error: "Username is required" };
  }

  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (username.length > 20) {
    return { valid: false, error: "Username must be at most 20 characters" };
  }

  // Only allow lowercase letters, numbers, and underscores
  if (!/^[a-z0-9_]+$/.test(username)) {
    return {
      valid: false,
      error: "Username can only contain lowercase letters, numbers, and underscores",
    };
  }

  return { valid: true };
}
