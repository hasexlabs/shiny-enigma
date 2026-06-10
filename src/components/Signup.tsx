import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName || undefined);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-lg flex items-center justify-center">
              <span className="text-[#00f0ff] text-2xl font-bold">H</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">HASEX CORE</h1>
          <p className="text-[#888] text-sm">Enter your credentials to create your account</p>
        </div>

        <div className="bg-[#0a0a0a]/80 backdrop-blur-sm border border-[#1a1a1a] rounded-2xl p-8 shadow-2xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/20 border border-red-800/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Google Sign Up Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-[#e5e5e5] transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-white/5"
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
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1a1a1a]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#0a0a0a]/80 text-[#666]">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-[#e2e2e2] mb-2">
                Display Name
              </label>
              <div className="relative">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3.5 px-4 text-[#e2e2e2] placeholder-[#666] focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all duration-200"
                  placeholder="Operator"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#e2e2e2] mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3.5 px-4 text-[#e2e2e2] placeholder-[#666] focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all duration-200"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#e2e2e2] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3.5 px-4 text-[#e2e2e2] placeholder-[#666] focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-[#666] text-xs mt-1.5">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#e2e2e2] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3.5 px-4 text-[#e2e2e2] placeholder-[#666] focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00f0ff] text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-[#00d0e0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00f0ff]/20 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <div className="text-[#888] text-sm">
              Already have an account?{" "}
              <button
                onClick={() => window.location.href = "/login"}
                className="text-[#00f0ff] font-medium hover:underline transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
