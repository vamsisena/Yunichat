-- Add CHAT_VOICE to file_metadata category check constraint
-- This migration updates the database to support voice messages

-- First, drop the existing constraint
ALTER TABLE file_metadata DROP CONSTRAINT IF EXISTS file_metadata_category_check;

-- Recreate the constraint with CHAT_VOICE included
ALTER TABLE file_metadata ADD CONSTRAINT file_metadata_category_check 
CHECK (category IN ('AVATAR', 'CHAT_ATTACHMENT', 'CHAT_VOICE', 'USER_FILE', 'SYSTEM'));

-- Verify the constraint was added
SELECT con.conname as constraint_name, 
       pg_get_constraintdef(con.oid) as constraint_def
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'file_metadata' 
  AND con.conname = 'file_metadata_category_check';
