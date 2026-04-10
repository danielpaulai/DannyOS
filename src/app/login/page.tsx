"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Bot, Zap, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setMessage("Check your email for a confirmation link.");
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — PP brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#0a0a0a] text-white">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e90d41] text-white font-extrabold text-sm"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              PP
            </div>
            <span
              className="text-lg font-bold"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              Daniel OS
            </span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest text-[#e90d41] mb-3"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              Purely Personal
            </p>
            <h2
              className="text-4xl font-extrabold leading-tight"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              Your executive
              <br />
              operating system.
            </h2>
          </div>
          <div className="w-16 h-0.5 bg-[#e90d41]" />
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 shrink-0">
                <Bot className="h-4 w-4 text-[#e90d41]" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
                  8 Specialist Agents
                </p>
                <p className="text-xs text-[#999999]">
                  CRM, meetings, content, research, memory — each doing one job well
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 shrink-0">
                <Zap className="h-4 w-4 text-[#e90d41]" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
                  One Command Center
                </p>
                <p className="text-xs text-[#999999]">
                  One inbox, one approval center, one source of truth
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 shrink-0">
                <Shield className="h-4 w-4 text-[#e90d41]" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
                  Human in the Loop
                </p>
                <p className="text-xs text-[#999999]">
                  Agents draft, you approve — nothing goes out without your say
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#444444]">
          Built with Next.js, Supabase, and Prisma
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-[#f5f6f7]">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e90d41] text-white font-extrabold text-lg"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              PP
            </div>
            <h1
              className="mt-4 text-2xl font-bold"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              Daniel OS
            </h1>
            <p className="mt-1 text-sm text-[#666666]">
              Sign in to your command center
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block">
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-[#666666]">
              Sign in to continue
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#eaeced] bg-white px-4 py-3 text-sm font-medium hover:bg-[#f5f6f7] transition-all duration-150"
            style={{ fontFamily: "'Rethink Sans', sans-serif" }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
            <ArrowRight className="h-4 w-4 ml-auto text-[#b8bec1]" />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#eaeced]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#f5f6f7] px-3 text-[#999999]">or use email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#d1d5d8] bg-white px-4 py-2.5 text-sm transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#d1d5d8] bg-white px-4 py-2.5 text-sm transition-all"
                placeholder="Min 6 characters"
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-sm text-[#e90d41] bg-[#fdf0f3] border border-[#e90d41]/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#e90d41] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d40b3a] transition-all disabled:opacity-50 shadow-brand"
              style={{ fontFamily: "'Rethink Sans', sans-serif" }}
            >
              {loading
                ? "Loading..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-[#999999]">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-[#e90d41] font-semibold hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-[#e90d41] font-semibold hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
