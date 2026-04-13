-- Make assigned user fields optional
ALTER TABLE public.tasks ALTER COLUMN assigned_user_id DROP NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN assigned_user_name DROP NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN assigned_user_color DROP NOT NULL;

-- Set default empty values
ALTER TABLE public.tasks ALTER COLUMN assigned_user_id SET DEFAULT '';
ALTER TABLE public.tasks ALTER COLUMN assigned_user_name SET DEFAULT '';
ALTER TABLE public.tasks ALTER COLUMN assigned_user_color SET DEFAULT '';
