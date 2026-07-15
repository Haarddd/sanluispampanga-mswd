"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function fetchAnnouncements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
  return data || [];
}

export async function fetchBenefits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("benefits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching benefits:", error);
    return [];
  }
  return data || [];
}

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient();

  const titleEn = formData.get("titleEn") as string;
  const titleTl = formData.get("titleTl") as string;
  const descriptionEn = formData.get("descriptionEn") as string;
  const descriptionTl = formData.get("descriptionTl") as string;

  if (!titleEn || !descriptionEn) {
    return { error: "English Title and Description are required" };
  }

  const { error } = await supabase.from("announcements").insert({
    title_en: titleEn,
    title_tl: titleTl || titleEn,
    description_en: descriptionEn,
    description_tl: descriptionTl || descriptionEn,
  });

  if (error) {
    console.error("Error creating announcement:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/announcements");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting announcement:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/announcements");
  return { success: true };
}

export async function createBenefit(formData: FormData) {
  const supabase = await createClient();

  const nameEn = formData.get("nameEn") as string;
  const nameTl = formData.get("nameTl") as string;
  const descriptionEn = formData.get("descriptionEn") as string;
  const descriptionTl = formData.get("descriptionTl") as string;
  const status = formData.get("status") as string || "active";
  const detailsEn = formData.get("detailsEn") as string;
  const detailsTl = formData.get("detailsTl") as string;

  if (!nameEn || !descriptionEn) {
    return { error: "English Name and Description are required" };
  }

  const { error } = await supabase.from("benefits").insert({
    name_en: nameEn,
    name_tl: nameTl || nameEn,
    description_en: descriptionEn,
    description_tl: descriptionTl || descriptionEn,
    status,
    details_en: detailsEn,
    details_tl: detailsTl || detailsEn,
  });

  if (error) {
    console.error("Error creating benefit:", error);
    return { error: error.message };
  }

  revalidatePath("/benefits");
  return { success: true };
}

export async function deleteBenefit(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("benefits")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting benefit:", error);
    return { error: error.message };
  }

  revalidatePath("/benefits");
  return { success: true };
}
