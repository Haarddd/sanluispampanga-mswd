"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function fetchUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return null;
  }

  // Fetch address
  const { data: address, error: addressError } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (addressError) {
    console.error("Error fetching address:", addressError);
  }

  // Fetch digital ID
  const { data: digitalId, error: digitalIdError } = await supabase
    .from("digital_ids")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (digitalIdError) {
    console.error("Error fetching digital ID:", digitalIdError);
  }

  // Fetch id documents
  const { data: idDocument, error: docError } = await supabase
    .from("id_documents")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (docError) {
    console.error("Error fetching id document:", docError);
  }

  return JSON.parse(
    JSON.stringify({
      profile: profile || null,
      address: address || null,
      digitalId: digitalId || null,
      idDocument: idDocument || null,
    })
  );
}

export async function updateProfileLanguage(language: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ language_preference: language })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating language:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function updateProfileNotifications(smsNotifications: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ sms_notifications: smsNotifications })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating notifications:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
