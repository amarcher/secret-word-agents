/** Room code alphabet. Excludes I, O, 0, 1 to avoid confusion when read aloud. */
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 4;

/** Inactive rooms older than this are swept by the room manager. */
export const ROOM_INACTIVITY_TIMEOUT = 30 * 60 * 1000;

/** Max length for a player's codename. */
export const MAX_NAME_LENGTH = 24;
