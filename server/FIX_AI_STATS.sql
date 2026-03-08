-- RUN THIS IN SUPABASE SQL EDITOR

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ai_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast counting
CREATE INDEX IF NOT EXISTS idx_ai_conversations_agency ON ai_conversations(agency_id);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency AI Policy" ON ai_conversations
    FOR ALL
    TO authenticated
    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
