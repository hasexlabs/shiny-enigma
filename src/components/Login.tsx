import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";

export default function Login() {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(email);
      alert("Password reset email sent! Check your inbox.");
      setShowReset(false);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">HASEX CORE</h1>
          <p className="text-[#888] text-center mb-8">
            {showReset ? "Reset your password" : "Sign in to your account"}
          </p>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {!showReset ? (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-[#e0e0e0] transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1a1a1a]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#0a0a0a] text-[#888]">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg py-3 px-4 text-[#e2e2e2] placeholder-[#666] focus:outline-none focus:border-[#00f0ff] transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg py-3 px-4 text-[#e2e2e2] placeholder-[#666] focus:outline-none focus:border-[#00f0ff] transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00f0ff] text-black font-semibold py-3 px-4 rounded-lg hover:bg-[#00d0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <button
                  onClick={() => setShowReset(true)}
                  className="text-[#00f0ff] hover:underline text-sm"
                >
                  Forgot your password?
                </button>
                <div className="text-[#888] text-sm">
                  Don't have an account?{" "}
                  <button
                    onClick={() => window.location.href = "/signup"}
                    className="text-[#00f0ff] hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <label htmlFor="reset-email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg py-3 px-4 text-[#e2e2e2] placeholder-[#666] focus:outline-none focus:border-[#00f0ff] transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00f0ff] text-black font-semibold py-3 px-4 rounded-lg hover:bg-[#00d0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {loading ? "Sending..." : "Send reset email"}
              </button>

              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full bg-[#1a1a1a] text-[#e2e2e2] font-semibold py-3 px-4 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
