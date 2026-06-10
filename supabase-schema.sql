-- HASEX OS Supabase Database Schema
-- This file sets up the complete database structure for authentication, user profiles, and chat functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== PROFILES TABLE ====================
-- This table stores additional user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT profiles_email_key UNIQUE (email)
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- ==================== FUNCTION: AUTOMATICALLY CREATE PROFILE ON USER SIGNUP ====================
-- This function creates a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', 'Operator'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== FUNCTION: UPDATE UPDATED_AT TIMESTAMP ====================
-- This function automatically updates the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== CHAT MESSAGES TABLE ====================
-- This table stores chat messages between users
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    sender_uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    sender_display_name TEXT NOT NULL,
    sender_photo_url TEXT,
    text TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT chat_messages_id_check CHECK (char_length(id) >= 10)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS chat_messages_sender_uid_idx ON public.chat_messages(sender_uid);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at DESC);

-- ==================== STORAGE BUCKETS ====================
-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ==================== STORAGE POLICIES ====================
-- Policy: Allow authenticated users to upload attachments
CREATE POLICY "Authenticated users can upload attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'chat-attachments' AND
        auth.role() = 'authenticated'
    );

-- Policy: Allow public access to view attachments
CREATE POLICY "Public can view attachments"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'chat-attachments');

-- Policy: Allow users to delete their own attachments
CREATE POLICY "Users can delete own attachments"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'chat-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ==================== ROW LEVEL SECURITY (RLS) POLICIES ====================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    TO public
    USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile (handled by trigger mainly)
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Enable RLS on chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view chat messages
CREATE POLICY "Chat messages are viewable by everyone"
    ON public.chat_messages FOR SELECT
    TO public
    USING (true);

-- Policy: Authenticated users can insert chat messages
CREATE POLICY "Authenticated users can insert messages"
    ON public.chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_uid);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
    ON public.chat_messages FOR DELETE
    TO authenticated
    USING (auth.uid() = sender_uid);

-- ==================== USER SESSIONS TABLE (OPTIONAL) ====================
-- This table can be used to track user sessions and activity
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== EVALUATIONS TABLE ====================
-- This table stores onboarding evaluation results
CREATE TABLE IF NOT EXISTS public.evaluations (
    id TEXT PRIMARY KEY,
    device_uid TEXT,
    email TEXT,
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB,
    scores JSONB,
    overall_score NUMERIC,
    summary TEXT,
    strengths TEXT[],
    weaknesses TEXT[],
    blind_spots TEXT[],
    next_actions TEXT[],
    appraisal_report TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    skipped BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS evaluations_uid_idx ON public.evaluations(uid);
CREATE INDEX IF NOT EXISTS evaluations_device_uid_idx ON public.evaluations(device_uid);

-- ==================== CHAT HISTORIES TABLE ====================
-- This table stores chat history logs
CREATE TABLE IF NOT EXISTS public.chat_histories (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT,
    title TEXT,
    messages_json TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_histories_user_id_idx ON public.chat_histories(user_id);
CREATE INDEX IF NOT EXISTS chat_histories_timestamp_idx ON public.chat_histories(timestamp DESC);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_last_activity_idx ON public.user_sessions(last_activity_at DESC);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
    ON public.user_sessions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON public.user_sessions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON public.user_sessions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Enable RLS on evaluations table
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluations"
    ON public.evaluations FOR SELECT
    TO authenticated
    USING (auth.uid() = uid);

CREATE POLICY "Users can insert own evaluations"
    ON public.evaluations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update own evaluations"
    ON public.evaluations FOR UPDATE
    TO authenticated
    USING (auth.uid() = uid);

-- Enable RLS on chat_histories table
ALTER TABLE public.chat_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat histories"
    ON public.chat_histories FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat histories"
    ON public.chat_histories FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat histories"
    ON public.chat_histories FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ==================== HELPER FUNCTIONS ====================

-- Function to get user profile with email verification status
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    username TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.username,
        p.bio,
        p.created_at,
        p.updated_at,
        p.last_login_at,
        a.email_confirmed_at
    FROM public.profiles p
    LEFT JOIN auth.users a ON p.id = a.id
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search users by email or username
CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.username
    FROM public.profiles p
    WHERE 
        p.email ILIKE '%' || search_term || '%' OR
        p.username ILIKE '%' || search_term || '%' OR
        p.full_name ILIKE '%' || search_term || '%'
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== GRANT PERMISSIONS ====================
-- Grant necessary permissions to service role
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(TEXT) TO authenticated;

-- ==================== COMPLETION ====================
-- Database schema setup complete
-- Tables created: profiles, chat_messages, user_sessions
-- Storage bucket: chat-attachments
-- Triggers: Automatic profile creation, updated_at timestamps
-- RLS policies: Configured for secure data access
