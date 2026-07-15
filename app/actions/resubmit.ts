"use server";
 
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitResubmission(formData: FormData) {
  const supabase = await createClient();
 
  const {
    data: { user },
  } = await supabase.auth.getUser();
 
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get resubmitted fields from formData
  const fullName = formData.get("fullName") as string | null;
  const street = formData.get("street") as string | null;
  const barangay = formData.get("barangay") as string | null;
  const latitudeRaw = formData.get("latitude") as string | null;
  const longitudeRaw = formData.get("longitude") as string | null;
  const pin = formData.get("pin") as string | null;

  const idFrontFile = formData.get("idFrontFile") as File | null;
  const idBackFile = formData.get("idBackFile") as File | null;

  const resubmittedData: Record<string, any> = {};

  if (fullName !== null && fullName !== undefined) resubmittedData.full_name = fullName.trim();
  if (street !== null && street !== undefined) resubmittedData.street = street.trim();
  if (barangay !== null && barangay !== undefined) resubmittedData.barangay = barangay.trim();
  if (latitudeRaw) resubmittedData.latitude = parseFloat(latitudeRaw);
  if (longitudeRaw) resubmittedData.longitude = parseFloat(longitudeRaw);
  if (pin) resubmittedData.pin = pin;

  // Upload functions helper
  const uploadDocument = async (file: File, typeSuffix: string) => {
    if (!file || file.size === 0) return null;
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}_resubmit_${typeSuffix}.${fileExt}`;
 
    const { error: uploadError } = await supabase.storage
      .from("id-documents")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });
 
    if (uploadError) {
      console.error(`Upload error (${typeSuffix}):`, uploadError);
      return null;
    }
 
    const {
      data: { publicUrl },
    } = supabase.storage.from("id-documents").getPublicUrl(filePath);
 
    return publicUrl;
  };

  const uploadPromises: Promise<any>[] = [];
  if (idFrontFile && idFrontFile.size > 0) {
    uploadPromises.push(uploadDocument(idFrontFile, "front").then(url => {
      if (url) resubmittedData.id_front_url = url;
    }));
  }
  if (idBackFile && idBackFile.size > 0) {
    uploadPromises.push(uploadDocument(idBackFile, "back").then(url => {
      if (url) resubmittedData.id_back_url = url;
    }));
  }

  await Promise.all(uploadPromises);

  // 1. Insert into resubmissions table
  const { error: insertError } = await supabase
    .from("resubmissions")
    .insert({
      user_id: user.id,
      resubmitted_data: resubmittedData,
      status: "PENDING"
    });

  if (insertError) {
    console.error("Resubmission insert error:", insertError);
    return { error: insertError.message };
  }

  // 2. Set profile status to PENDING_ADMIN_REVIEW
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      verification_status: "PENDING_ADMIN_REVIEW",
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile status update error:", profileError);
    return { error: profileError.message };
  }

  revalidatePath("/verification-pending");
  return { success: true };
}
