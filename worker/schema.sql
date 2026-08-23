CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  publisher_hash TEXT NOT NULL,
  viewer_hash TEXT NOT NULL,
  command_hash TEXT NOT NULL,
  state_ciphertext TEXT,
  state_updated_at INTEGER,
  command_ciphertext TEXT,
  command_updated_at INTEGER,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_channels_expires_at ON channels(expires_at);
