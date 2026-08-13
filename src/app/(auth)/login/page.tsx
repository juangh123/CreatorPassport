"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/auth/callback" }
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Sign up successful! Please check your email.");
    }
    setLoading(false);
  };

  return (
    <div className="vercel-card p-8 max-w-md mx-auto mt-12">
      <h2 className="text-2xl font-semibold mb-6 text-center text-white">Login or Sign Up</h2>
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#888]">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md bg-[#111] border-[#333] text-white shadow-sm focus:border-white focus:ring-white sm:text-sm p-2 border transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#888]">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md bg-[#111] border-[#333] text-white shadow-sm focus:border-white focus:ring-white sm:text-sm p-2 border transition-colors"
          />
        </div>
        <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full justify-center py-2 px-4 vercel-button-primary disabled:opacity-50"
            >
              {loading ? "Loading..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full justify-center py-2 px-4 bg-[#333] text-white rounded-md hover:bg-[#444] transition-colors disabled:opacity-50"
            >
              Sign Up
            </button>
        </div>
      </form>
    </div>
  );
}
