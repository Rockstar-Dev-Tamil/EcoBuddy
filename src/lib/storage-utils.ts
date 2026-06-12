export const STORAGE_KEYS = {
  PROFILE: "ecobuddy_profile",
  PLANET: "ecobuddy_planet",
  LOGS: "ecobuddy_logs",
  CHALLENGES: "ecobuddy_challenges",
  ACHIEVEMENTS: "ecobuddy_achievements",
  CHATS: "ecobuddy_chats",
  GROUPS: "ecobuddy_groups",
};

export const isBrowser = typeof window !== "undefined";

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

export const setStorageItem = <T>(key: string, value: T): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Local storage set error:", error);
  }
};
