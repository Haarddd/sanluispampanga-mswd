"use server";

import { createClient } from "@/lib/supabase/server";

export async function loginAdmin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  // 1. Sign in with password using Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // 2. Check if user is in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (adminError || !adminUser) {
      // If not an admin, sign out immediately
      await supabase.auth.signOut();
      return {
        error:
          "Access denied: You are not authorized to access the Admin Dashboard.",
      };
    }
  }

  return { success: true };
}
