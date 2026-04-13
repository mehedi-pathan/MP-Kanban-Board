-- Simplify the tasks table by replacing multiple assigned_user columns with a single column
-- First, drop the old columns if they exist
ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_user_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_user_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_user_color;

-- Add a simple assigned_user column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasks' AND column_name = 'assigned_user') THEN
    ALTER TABLE tasks ADD COLUMN assigned_user TEXT DEFAULT '';
  END IF;
END $$;
