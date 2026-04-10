import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth callback — Supabase redirects here after Google login
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(origin);
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(`${origin}/login`);
}
