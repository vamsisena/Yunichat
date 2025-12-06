-- Add voiceUrl and voiceDuration columns to messages table for voice message support
ALTER TABLE messages ADD COLUMN voice_url VARCHAR(500);
ALTER TABLE messages ADD COLUMN voice_duration INTEGER;

-- Create message_reactions table for emoji reactions
CREATE TABLE message_reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message_reactions_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT unique_message_user_emoji UNIQUE (message_id, user_id, emoji)
);

-- Create indexes for better query performance
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_message_reactions_emoji ON message_reactions(emoji);
