-- Create messages table for secure, immutable messaging
CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  sender_id varchar NOT NULL REFERENCES users(id),
  receiver_id varchar NOT NULL REFERENCES users(id),
  subject text,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp,
  -- Immutable audit fields - CANNOT be changed after creation
  created_at timestamp DEFAULT now() NOT NULL,
  -- Hash of message content for integrity verification (court admissibility)
  content_hash text NOT NULL,
  -- IP address for audit trail
  sender_ip text
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = false;

-- Add comment for documentation
COMMENT ON TABLE messages IS 'Secure, immutable messages between co-parents. Cannot be edited or deleted once created for court admissibility.';
COMMENT ON COLUMN messages.content_hash IS 'SHA-256 hash of message content + sender + timestamp for integrity verification';
COMMENT ON COLUMN messages.sender_ip IS 'IP address of sender for audit trail';
