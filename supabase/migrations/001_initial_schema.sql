-- HASEX Authentication System Database Schema
-- This migration sets up the initial database structure for user management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  
  PRIMARY KEY (user_id, role_id)
);

-- Create auth_audit_log table (GDPR compliance)
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table (for existing chat functionality)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  sender_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_email TEXT,
  sender_display_name TEXT,
  sender_photo_url TEXT,
  text TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON public.auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Insert default roles
INSERT INTO public.roles (name, description, permissions) VALUES
  ('user', 'Regular user with standard access', '{"read_own": true, "write_own": true}'::jsonb),
  ('admin', 'Administrator with full access', '{"read_all": true, "write_all": true, "manage_users": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Operator')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (
    NEW.id,
    (SELECT id FROM public.roles WHERE name = 'user')
  )
  ON CONFLICT DO NOTHING;
  
  -- Log signup event
  INSERT INTO public.auth_audit_log (user_id, action, metadata)
  VALUES (
    NEW.id,
    'signup',
    jsonb_build_object('email', NEW.email, 'provider', NEW.raw_app_meta_data->>'provider')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = (SELECT id FROM public.roles WHERE name = 'admin')
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = (SELECT id FROM public.roles WHERE name = 'admin')
    )
  );

CREATE POLICY "Admins can assign roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = (SELECT id FROM public.roles WHERE name = 'admin')
    )
  );

-- RLS Policies for auth_audit_log
CREATE POLICY "Users can view own audit logs"
  ON public.auth_audit_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.auth_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = (SELECT id FROM public.roles WHERE name = 'admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.auth_audit_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for chat_messages
CREATE POLICY "Authenticated users can view messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_uid);
