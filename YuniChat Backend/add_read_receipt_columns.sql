-- Migration script to add read receipt columns to messages table
-- Run this script to update existing database schema

-- Add is_read column (default false for existing messages)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

-- Add read_at column (nullable for messages that haven't been read yet)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Create index on is_read for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Create composite index for room_id and is_read for efficient filtering
CREATE INDEX IF NOT EXISTS idx_messages_room_is_read ON messages(room_id, is_read);

-- Display summary
SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_read = true THEN 1 END) as read_messages,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages
FROM messages;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Read receipt columns added successfully!';
    RAISE NOTICE 'All existing messages are marked as unread (is_read = false)';
    RAISE NOTICE 'Indexes created for optimal performance';
END $$;
