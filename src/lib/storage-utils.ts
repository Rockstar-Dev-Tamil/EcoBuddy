/**
 * storage-utils.ts
 *
 * Safe client-side utility functions to read/write serialized state
 * to localStorage, handling SSR environments without crashing.
 */

/**
 * Storage key constants used to index user profile and game data.
 */
export const STORAGE_KEYS = {
  PROFILE: "ecobuddy_profile",
  PLANET: "ecobuddy_planet",
  LOGS: "ecobuddy_logs",
  CHALLENGES: "ecobuddy_challenges",
  ACHIEVEMENTS: "ecobuddy_achievements",
  CHATS: "ecobuddy_chats",
  GROUPS: "ecobuddy_groups",
} as const;

/**
 * Boolean flag indicating whether the execution context is inside a web browser.
 */
export const isBrowser = typeof window !== "undefined";

/**
 * Safely retrieves and parses an item from localStorage.
 *
 * @template T - The expected return type.
 * @param key - The localStorage index key.
 * @param defaultValue - Fallback value if item is not found or fails to parse.
 * @returns The parsed item or default fallback.
 */
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!isBrowser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Local storage error:", error);
    return defaultValue;
  }
};

/**
 * Safely serializes and writes an item to localStorage.
 *
 * @template T - The type of value being stored.
 * @param key - The localStorage index key.
 * @param value - The value to store.
 */
export const setStorageItem = <T>(key: string, value: T): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Local storage set error:", error);
  }
};
