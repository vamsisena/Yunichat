-- Add read receipt columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Create index on is_read for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Update existing messages to mark them as unread
UPDATE messages SET is_read = false WHERE is_read IS NULL;

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
