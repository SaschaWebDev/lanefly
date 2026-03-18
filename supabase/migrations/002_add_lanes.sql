-- Add lanes (horizontal swim-lane rows) to boards

CREATE TABLE lanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_lanes_board_position ON lanes(board_id, position);

-- Reuse the existing update_updated_at trigger function
CREATE TRIGGER set_lanes_updated_at
  BEFORE UPDATE ON lanes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE lanes ENABLE ROW LEVEL SECURITY;

-- Viewers+ can see lanes
CREATE POLICY "Members can view lanes"
  ON lanes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = lanes.board_id
        AND board_members.user_id = auth.uid()
    )
  );

-- Editors+ can create lanes
CREATE POLICY "Editors can create lanes"
  ON lanes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = lanes.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

-- Editors+ can update lanes
CREATE POLICY "Editors can update lanes"
  ON lanes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = lanes.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role IN ('admin', 'editor')
    )
  );

-- Admins can delete lanes
CREATE POLICY "Admins can delete lanes"
  ON lanes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = lanes.board_id
        AND board_members.user_id = auth.uid()
        AND board_members.role = 'admin'
    )
  );

-- Add lane_id to columns (nullable — existing columns have no lane)
ALTER TABLE columns ADD COLUMN lane_id UUID REFERENCES lanes(id) ON DELETE SET NULL;
CREATE INDEX idx_columns_lane ON columns(lane_id);
