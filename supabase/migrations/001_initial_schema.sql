-- ============================================================
-- LaneFly: Initial Schema
-- ============================================================

-- Enums
CREATE TYPE board_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE card_status AS ENUM ('active', 'done');

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  storage_used BIGINT NOT NULL DEFAULT 0,
  storage_quota BIGINT NOT NULL DEFAULT 104857600, -- 100 MB
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Boards
-- ============================================================
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  background TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_boards_owner ON boards(owner_id);

-- ============================================================
-- Board Members (junction with role)
-- ============================================================
CREATE TABLE board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role board_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, user_id)
);

CREATE INDEX idx_board_members_user ON board_members(user_id);
CREATE INDEX idx_board_members_board ON board_members(board_id);

-- ============================================================
-- Board Favorites
-- ============================================================
CREATE TABLE board_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, user_id)
);

-- ============================================================
-- Columns
-- ============================================================
CREATE TABLE columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_columns_board ON columns(board_id);
CREATE INDEX idx_columns_position ON columns(board_id, position);

-- ============================================================
-- Cards
-- ============================================================
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status card_status NOT NULL DEFAULT 'active',
  position FLOAT NOT NULL DEFAULT 0,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  archived_with_column BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_cards_column ON cards(column_id);
CREATE INDEX idx_cards_board ON cards(board_id);
CREATE INDEX idx_cards_assignee ON cards(assignee_id);
CREATE INDEX idx_cards_position ON cards(column_id, position);

-- ============================================================
-- Labels
-- ============================================================
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_labels_board ON labels(board_id);

-- ============================================================
-- Card Labels (junction)
-- ============================================================
CREATE TABLE card_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (card_id, label_id)
);

-- ============================================================
-- Checklists
-- ============================================================
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklists_card ON checklists(card_id);

-- ============================================================
-- Checklist Items
-- ============================================================
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  position FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);

-- ============================================================
-- Attachments
-- ============================================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_card ON attachments(card_id);

-- ============================================================
-- Activity Log (immutable)
-- ============================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_board ON activity_log(board_id, created_at DESC);
CREATE INDEX idx_activity_card ON activity_log(card_id) WHERE card_id IS NOT NULL;

-- ============================================================
-- Notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- Triggers: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_columns_updated_at
  BEFORE UPDATE ON columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Trigger: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Boards
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view boards"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = boards.id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Board admins can update boards"
  ON boards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = boards.id
        AND board_members.user_id = auth.uid()
        AND board_members.role = 'admin'
    )
  );

CREATE POLICY "Board admins can delete boards"
  ON boards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = boards.id
        AND board_members.user_id = auth.uid()
        AND board_members.role = 'admin'
    )
  );

-- Board Members
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view membership"
  ON board_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_members.board_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Board admins can manage members"
  ON board_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id -- self-insert when creating board
    OR EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_members.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
    )
  );

CREATE POLICY "Board admins can update member roles"
  ON board_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_members.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
    )
  );

CREATE POLICY "Board admins can remove members"
  ON board_members FOR DELETE
  USING (
    auth.uid() = user_id -- users can leave boards
    OR EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_members.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
    )
  );

-- Board Favorites
ALTER TABLE board_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own favorites"
  ON board_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Columns
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view columns"
  ON columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = columns.board_id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can create columns"
  ON columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = columns.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors and admins can update columns"
  ON columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = columns.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete columns"
  ON columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = columns.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role = 'admin'
    )
  );

-- Cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view cards"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = cards.board_id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can create cards"
  ON cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = cards.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors and admins can update cards"
  ON cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = cards.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete cards"
  ON cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = cards.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role = 'admin'
    )
  );

-- Labels
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view labels"
  ON labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = labels.board_id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can manage labels"
  ON labels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = labels.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

-- Card Labels
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view card labels"
  ON card_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE cards.id = card_labels.card_id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can manage card labels"
  ON card_labels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE cards.id = card_labels.card_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

-- Checklists
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view checklists"
  ON checklists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE cards.id = checklists.card_id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can manage checklists"
  ON checklists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE cards.id = checklists.card_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

-- Checklist Items
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view checklist items"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM checklists
      JOIN cards ON cards.id = checklists.card_id
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE checklists.id = checklist_items.checklist_id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can manage checklist items"
  ON checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM checklists
      JOIN cards ON cards.id = checklists.card_id
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE checklists.id = checklist_items.checklist_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

-- Attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view attachments"
  ON attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE cards.id = attachments.card_id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can upload attachments"
  ON attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploader_id
    AND EXISTS (
      SELECT 1 FROM cards
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE cards.id = attachments.card_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and uploaders can delete attachments"
  ON attachments FOR DELETE
  USING (
    auth.uid() = uploader_id
    OR EXISTS (
      SELECT 1 FROM cards
      JOIN board_members ON board_members.board_id = cards.board_id
      WHERE cards.id = attachments.card_id
        AND board_members.user_id = auth.uid()
        AND board_members.role = 'admin'
    )
  );

-- Activity Log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view activity"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = activity_log.board_id
        AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can create activity entries"
  ON activity_log FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = activity_log.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
