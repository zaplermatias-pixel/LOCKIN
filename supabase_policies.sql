-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Create a storage bucket for profile pictures if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'profile-pictures'

-- 1. Public Read Access
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'profile-pictures' );

-- 2. Authenticated Upload Access (Insert)
CREATE POLICY "Anyone with account can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'profile-pictures' AND auth.role() = 'authenticated' );

-- 3. Owner Update Access
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'profile-pictures' AND auth.uid() = owner );

-- 4. Owner Delete Access
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'profile-pictures' AND auth.uid() = owner );
