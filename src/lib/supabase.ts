import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('HASEX_OS [CONFIG ERROR] // Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Error handling helper
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export async function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const { data: { session } } = await supabase.auth.getSession();
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: session?.user?.id,
      email: session?.user?.email,
    },
    operationType,
    path
  };
  console.error("Supabase Error Detailed Matrix: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==================== AUTHENTICATION FUNCTIONS ====================

// Email/Password Sign Up
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || "Operator",
        },
      },
    });

    if (error) throw error;

    // Create user profile in database
    if (data.user) {
      await saveUserProfile(data.user.id, email, displayName || "Operator");
    }

    return data.user;
  } catch (error: any) {
    console.error("HASEX_OS [AUTH ERROR] // Sign up failed:", error);
    throw error;
  }
}

// Email/Password Sign In
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update last login
    if (data.user) {
      await updateLastLogin(data.user.id);
    }

    return data.user;
  } catch (error: any) {
    console.error("HASEX_OS [AUTH ERROR] // Sign in failed:", error);
    throw error;
  }
}

// Google OAuth Sign In
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        skipBrowserRedirect: false,
      },
    });

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error("HASEX_OS [AUTH ERROR] // Google sign in failed:", error);
    throw error;
  }
}

// Send Password Reset Email
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error("HASEX_OS [AUTH ERROR] // Password reset failed:", error);
    throw error;
  }
}

// User logout
export async function logoutUserSession() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("HASEX_OS [AUTH ERROR] // Logout process broken:", error);
    throw error;
  }
}

// Get Current User
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Listen to Auth State Changes
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

// Check if Email is Verified
export async function checkEmailVerified(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email_confirmed_at ? true : false;
}

// Portal-specific Google Sign In (for LandingPortal)
export async function signInWithGooglePortal() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error("HASEX_OS [AUTH ERROR] // Google portal sign in failed:", error);
    throw error;
  }
}

// Auth state change listener (for LandingPortal compatibility)
export function onAuthStateChanged(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

// Export auth object for compatibility (wrapper around Supabase auth)
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
    return data.subscription;
  },
  signInWithPopup: async () => {
    return await signInWithGooglePortal();
  },
  signOut: async () => {
    return await supabase.auth.signOut();
  }
};

// Save user profile to database
export async function saveUserProfile(userId: string, email: string, displayName: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: displayName,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) throw error;
  } catch (error) {
    await handleSupabaseError(error, OperationType.WRITE, `profiles/${userId}`);
  }
}

// Update last login timestamp
export async function updateLastLogin(userId: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    await handleSupabaseError(error, OperationType.UPDATE, `profiles/${userId}`);
  }
}

// Stream and monitor incoming messages
export function subscribeToMainChatChannel(onMessagesUpdate: (messages: any[]) => void, onError: (err: any) => void) {
  return supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(100)
    .then(async ({ data, error }) => {
      if (error) {
        await handleSupabaseError(error, OperationType.LIST, "chat_messages");
        onError(error);
        return;
      }
      onMessagesUpdate(data || []);
    });
}

// Send real-time chat message
export async function transmitChatMessage(text: string, fileData?: { url: string; name: string } | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Cannot dispatch messages anonymously. Authenticate first.");
  }

  const messageId = Math.random().toString(36).substring(2, 11).toUpperCase();
  const path = `chat_messages/${messageId}`;

  const messagePayload: any = {
    id: messageId,
    sender_uid: user.id,
    sender_email: user.email || "",
    sender_display_name: user.user_metadata?.display_name || "Operator",
    sender_photo_url: user.user_metadata?.avatar_url || "",
    text: text,
    created_at: new Date().toISOString()
  };

  if (fileData) {
    messagePayload.file_url = fileData.url;
    messagePayload.file_name = fileData.name;
  }

  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert(messagePayload);

    if (error) throw error;
  } catch (err) {
    await handleSupabaseError(err, OperationType.CREATE, path);
  }
}

// Upload chat attachment to Supabase Storage
export async function uploadChatAttachment(file: File): Promise<{ url: string; name: string }> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `chat_attachments/${Date.now()}_${cleanName}`;

  try {
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(storagePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(storagePath);

    return { url: publicUrl, name: file.name };
  } catch (err) {
    console.warn("HASEX_OS [STORAGE WARN] // Primary cloud upload failed, utilizing Base64 local vector format fallback:", err);
    
    // Return Base64 representation as a completely reliable and offline-resistant fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve({ url: reader.result, name: file.name });
        } else {
          reject(new Error("File conversion buffer corrupted."));
        }
      };
      reader.onerror = () => reject(new Error("FileReader process read failure."));
      reader.readAsDataURL(file);
    });
  }
}
