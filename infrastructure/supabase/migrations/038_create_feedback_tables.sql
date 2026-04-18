-- Feedback system: bidirectional chat between users and admin

CREATE TABLE feedback_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category        text NOT NULL CHECK (category IN ('bug', 'mejora', 'pricing', 'otro')),
  subject         text NOT NULL,
  status          text NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'en_revision', 'resuelto', 'cerrado')),
  priority        text DEFAULT 'medio' CHECK (priority IN ('critico', 'alto', 'medio', 'bajo')),
  page_url        text,
  user_plan       text,
  user_persona    text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE feedback_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL REFERENCES feedback_tickets(id) ON DELETE CASCADE,
  sender_type     text NOT NULL CHECK (sender_type IN ('user', 'admin', 'ai_analyst')),
  content         text NOT NULL,
  image_urls      jsonb DEFAULT '[]',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_feedback_tickets_user ON feedback_tickets(user_id, created_at DESC);
CREATE INDEX idx_feedback_tickets_status ON feedback_tickets(status, category);
CREATE INDEX idx_feedback_messages_ticket ON feedback_messages(ticket_id, created_at);

ALTER TABLE feedback_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

-- Users can view/create their own tickets
CREATE POLICY "Users manage own tickets"
  ON feedback_tickets FOR ALL
  USING (auth.uid() = user_id);

-- Users can view/create messages on their own tickets
CREATE POLICY "Users manage own ticket messages"
  ON feedback_messages FOR ALL
  USING (
    ticket_id IN (SELECT id FROM feedback_tickets WHERE user_id = auth.uid())
  );

-- Admins can view/manage all tickets
CREATE POLICY "Admins manage all tickets"
  ON feedback_tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('financial_admin', 'super_admin')
    )
  );

-- Admins can view/manage all messages
CREATE POLICY "Admins manage all messages"
  ON feedback_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('financial_admin', 'super_admin')
    )
  );
