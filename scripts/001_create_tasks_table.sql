-- Create tasks table for Kanban board
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'inprogress', 'done')),
  assigned_user_id TEXT NOT NULL,
  assigned_user_name TEXT NOT NULL,
  assigned_user_color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow all users to read all tasks (public board)
CREATE POLICY "Allow public read access" ON public.tasks
  FOR SELECT USING (true);

-- Allow all users to insert tasks
CREATE POLICY "Allow public insert access" ON public.tasks
  FOR INSERT WITH CHECK (true);

-- Allow all users to update tasks
CREATE POLICY "Allow public update access" ON public.tasks
  FOR UPDATE USING (true);

-- Allow all users to delete tasks
CREATE POLICY "Allow public delete access" ON public.tasks
  FOR DELETE USING (true);

-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS tasks_status_order_idx ON public.tasks (status, "order");

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
