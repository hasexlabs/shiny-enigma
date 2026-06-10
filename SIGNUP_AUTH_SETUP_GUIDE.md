# Signup Auth Setup Guide

## ✅ **Current Auth Implementation**

The signup auth is already fully implemented using **Supabase Authentication**.

---

## 📋 **How Signup Works (Current Setup)**

### **1. Signup Component** (`src/components/Signup.tsx`)

The signup page has:
- Email/password signup form
- Google OAuth button
- Form validation (password matching, minimum length)
- Error display

**Flow:**
```typescript
User enters email, password, display name
  ↓
Clicks "Sign up" button
  ↓
Calls signUp(email, password, displayName) from AuthContext
  ↓
AuthContext calls signUpWithEmail() from supabase.ts
  ↓
Supabase creates user account
  ↓
User profile saved to 'profiles' table
  ↓
User redirected or logged in
```

---

### **2. AuthContext** (`src/contexts/AuthContext.tsx`)

Provides auth methods:
- `signUp(email, password, displayName)` - Email/password signup
- `signInWithGoogle()` - Google OAuth
- `signIn(email, password)` - Login
- `signOut()` - Logout
- `resetPassword(email)` - Password reset

---

### **3. Supabase Client** (`src/lib/supabase.ts`)

Handles Supabase API calls:
- `signUpWithEmail()` - Creates user in Supabase Auth
- `saveUserProfile()` - Saves user to 'profiles' table
- `signInWithGoogle()` - Handles Google OAuth redirect
- Session management with localStorage persistence

---

## 🔧 **Required Setup (Environment Variables)**

You need to configure your `.env` file with Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**How to get these:**

1. Go to https://supabase.com
2. Create a new project or select existing
3. Go to Project Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## 🗄️ **Database Setup Required**

The app requires a `profiles` table in Supabase:

```sql
create table profiles (
  id uuid references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  last_login_at timestamp with time zone,
  updated_at timestamp with time zone,
  primary key (id)
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policy
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);
```

**Location:** `supabase-schema.sql` already has this schema.

---

## 🌐 **Google OAuth Setup**

To enable Google sign-up:

1. In Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Set redirect URL: `https://your-domain.com/auth/callback`
5. For local development: `http://localhost:3000/auth/callback`

---

## 📧 **Email Confirmation**

Supabase can send email confirmation. To disable (for development):

1. Supabase Dashboard → Authentication → Providers → Email
2. Toggle **Confirm email** to OFF
3. Users can sign up without email verification

---

## 🎯 **Testing Signup Flow**

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click "Sign up" link on login page
4. Enter:
   - Email: `test@example.com`
   - Password: `test123456` (6+ characters)
   - Display Name: `Test User` (optional)
5. Click "Sign up" button
6. Should redirect to app or login page

---

## 🔍 **Troubleshooting**

### **Signup button not working:**
- Check browser console for errors
- Verify Supabase URL and keys in `.env`
- Check Supabase Dashboard → Auth Logs
- Verify 'profiles' table exists

### **Google sign-up not working:**
- Ensure Google provider is enabled in Supabase
- Check redirect URLs match your domain
- Verify Google OAuth credentials are valid

### **After signup, user not logged in:**
- Supabase requires email confirmation by default
- Disable email confirmation in Supabase settings for testing
- Or check your email for confirmation link

---

## 📝 **Current Auth State**

- ✅ Signup component implemented
- ✅ Login component implemented
- ✅ Google OAuth implemented
- ✅ Supabase client configured
- ✅ AuthContext provides auth methods
- ✅ Profile creation on signup
- ⚠️ Requires Supabase credentials in `.env`
- ⚠️ Requires database schema in Supabase

---

## 🚀 **Next Steps to Enable Auth**

1. **Get Supabase credentials** and add to `.env`
2. **Run the SQL schema** in Supabase SQL Editor
3. **Enable email provider** in Supabase (already enabled by default)
4. **Optional:** Enable Google OAuth with credentials
5. **Test signup flow**

---

## 🎨 **Customizing Signup**

To customize the signup page, edit `src/components/Signup.tsx`:
- Change styling
- Add more fields
- Add terms of service checkbox
- Add phone number field
- Add custom validation

---

## 🔐 **Security Notes**

- **Anon key** is safe for client-side use (restricted by RLS)
- **Service role key** should NEVER be in `.env` (server-side only)
- **RLS policies** protect your data
- **Email confirmation** recommended for production
- **Password strength** requires 6+ characters (can increase)

---

## 📚 **Reference**

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Supabase SQL Schema: `supabase-schema.sql`
- Auth Implementation: `src/contexts/AuthContext.tsx`
- Signup Component: `src/components/Signup.tsx`
- Supabase Client: `src/lib/supabase.ts`