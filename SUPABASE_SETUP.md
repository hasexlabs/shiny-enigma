# Supabase Database Setup Guide for HASEX OS

This guide will help you set up your Supabase database for authentication, user profiles, and chat functionality in HASEX OS.

## Prerequisites

- A Supabase account (free tier works)
- Basic understanding of SQL and database concepts

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: HASEX OS (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (usually 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (will be used as `VITE_SUPABASE_URL`)
   - **anon/public** key (will be used as `VITE_SUPABASE_ANON_KEY`)
   - **service_role** key (will be used as `SUPABASE_SERVICE_ROLE_KEY` - keep this secret!)

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholder values with your actual Supabase credentials:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key-here"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

## Step 4: Configure Google OAuth (Optional but Recommended)

### In Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Click on **Google**
3. Enable the provider
4. You'll need to set up OAuth credentials in Google Cloud Console:
   - **Authorized redirect URI**: `https://your-project-id.supabase.co/auth/v1/callback`
   - **Authorized JavaScript origins**: Your app URL

### In Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new OAuth 2.0 client ID
3. Set up the authorized origins and redirect URIs
4. Copy the **Client ID** and **Client Secret**
5. Paste them into the Supabase Google provider settings

## Step 5: Execute Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click "New Query"
4. Copy the contents of `supabase-schema.sql`
5. Paste it into the SQL Editor
6. Click "Run" to execute the schema

### Option B: Using Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

3. Execute the schema:
   ```bash
   supabase db push supabase-schema.sql
   ```

### Option C: Using psql (Command Line)

```bash
psql -h db.your-project-id.supabase.co -U postgres -d postgres < supabase-schema.sql
```

## Step 6: Verify Database Setup

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - `profiles`
   - `chat_messages`
   - `user_sessions`

3. Check **Storage**:
   - You should see the `chat-attachments` bucket

4. Test the setup by creating a test user:
   ```sql
   -- This will be handled automatically by the trigger when users sign up
   -- But you can verify the trigger works by checking the profiles table
   SELECT * FROM profiles;
   ```

## Step 7: Configure Email Templates (Optional)

Supabase provides default email templates, but you can customize them:

1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - Confirm signup
   - Reset password
   - Email change

## Step 8: Test Authentication Flow

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to the login page
3. Test email/password signup:
   - Enter email and password
   - Check if profile is automatically created in the `profiles` table
4. Test Google sign-in (if configured)
5. Test password reset functionality

## Database Schema Overview

### Tables Created:

1. **profiles** - Extended user information
   - `id` (UUID, linked to auth.users)
   - `email` (TEXT, unique)
   - `full_name` (TEXT)
   - `avatar_url` (TEXT)
   - `username` (TEXT, unique)
   - `bio` (TEXT)
   - `created_at`, `updated_at`, `last_login_at`

2. **chat_messages** - Chat functionality
   - `id` (TEXT, custom message ID)
   - `sender_uid` (UUID, references auth.users)
   - `sender_email`, `sender_display_name`, `sender_photo_url`
   - `text` (TEXT, message content)
   - `file_url`, `file_name`, `file_type` (for attachments)
   - `created_at`

3. **user_sessions** - Session tracking
   - `id` (UUID, auto-generated)
   - `user_id` (UUID, references auth.users)
   - `session_data` (JSONB)
   - `ip_address`, `user_agent`
   - `created_at`, `last_activity_at`

### Storage:

- **chat-attachments** bucket for file uploads
- Public access enabled for viewing
- Authenticated users can upload
- Users can delete their own attachments

### Automatic Features:

- **Profile Creation**: Automatically creates a profile when a user signs up
- **Timestamp Updates**: Automatically updates `updated_at` and `last_login_at`
- **Email Verification**: Integrated with Supabase auth system
- **Row Level Security**: Configured for secure data access

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure your `.env` file is configured correctly with VITE_ prefixed variables.

### Issue: Google OAuth not working

**Solution**: 
- Verify redirect URIs in both Google Cloud Console and Supabase
- Make sure your app URL matches exactly (including http/https)

### Issue: Profile not created after signup

**Solution**: 
- Check the trigger `on_auth_user_created` exists in your database
- Verify RLS policies allow profile creation

### Issue: Storage upload fails

**Solution**: 
- Ensure the `chat-attachments` bucket exists
- Check storage policies allow authenticated uploads
- Verify file size limits in Supabase settings

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use environment variables** for all sensitive data
3. **Enable Row Level Security** on all tables
4. **Review RLS policies** regularly
5. **Keep service role key secret** - never use it in client-side code
6. **Enable email verification** for user signup
7. **Use strong password policies** in Supabase auth settings

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review browser console for client-side errors
3. Verify database schema matches expected structure
4. Check environment variables are properly set

---

**Note**: This setup is designed for a Vite-based React application using Supabase for authentication and database operations.
