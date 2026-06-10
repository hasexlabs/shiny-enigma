import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    // Supabase handles the session automatically from URL parameters
    // Just redirect to home with skip flag
    window.location.href = "/?skip_landing=true";
  }, []);

  return null;
}
