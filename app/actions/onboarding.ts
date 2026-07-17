"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const fullName = formData.get("fullName") as string;
  const birthdate = formData.get("birthdate") as string;
  const street = formData.get("street") as string;
  const barangay = formData.get("barangay") as string;
  const municipality = formData.get("municipality") as string;
  const province = formData.get("province") as string;
  const sex = formData.get("sex") as string;
  const civilStatus = formData.get("civilStatus") as string;
  const emergencyContactName = formData.get("emergencyContactName") as string;
  const emergencyContactNumber = formData.get("emergencyContactNumber") as string;
  const pin = formData.get("pin") as string;
  const latitudeRaw = formData.get("latitude") as string | null;
  const longitudeRaw = formData.get("longitude") as string | null;
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null;
  const idFrontFile = formData.get("idFrontFile") as File | null;
  const idBackFile = formData.get("idBackFile") as File | null;

  if (!fullName?.trim()) return { error: "Full name is required" };
  if (!birthdate) return { error: "Date of birth is required" };
  if (!pin || pin.length !== 6) return { error: "A 6-digit PIN is required" };

  // Calculate age dynamically
  let age: number | null = null;
  if (birthdate) {
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
  }

  // 1. Helper function to upload an ID document
  const uploadDocument = async (file: File, typeSuffix: string) => {
    if (!file || file.size === 0) return null;
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}_${typeSuffix}.${fileExt}`;

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

  const [idFrontUrl, idBackUrl] = await Promise.all([
    idFrontFile ? uploadDocument(idFrontFile, "front") : Promise.resolve(null),
    idBackFile ? uploadDocument(idBackFile, "back") : Promise.resolve(null),
  ]);

  if ((idFrontFile && !idFrontUrl) || (idBackFile && !idBackUrl)) {
    return { error: "Failed to upload ID images. Please try again." };
  }

  // 2. Update user profile
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      full_name: fullName.trim(),
      birthdate: birthdate,
      age: age,
      verification_status: "PENDING_ADMIN_REVIEW",
      login_pin: pin,
      sex: sex || null,
      civil_status: civilStatus || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_number: emergencyContactNumber || null,
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  // 3. Insert address
  if (street || barangay || municipality) {
    const { error: addressError } = await supabase
      .from("user_addresses")
      .insert({
        user_id: user.id,
        street,
        barangay,
        municipality,
        province,
        latitude,
        longitude,
      });

    if (addressError) console.error("Address error:", addressError);
  }

  // 4. Insert ID document records
  const insertDocs = [];
  if (idFrontUrl) {
    insertDocs.push({
      user_id: user.id,
      id_type: "SENIOR_CITIZEN_ID_FRONT",
      file_url: idFrontUrl,
      verification_status: "PENDING",
    });
  }
  if (idBackUrl) {
    insertDocs.push({
      user_id: user.id,
      id_type: "SENIOR_CITIZEN_ID_BACK",
      file_url: idBackUrl,
      verification_status: "PENDING",
    });
  }

  if (insertDocs.length > 0) {
    const { error: docError } = await supabase
      .from("id_documents")
      .insert(insertDocs);

    if (docError) console.error("Document error:", docError);
  }

  // 5. Set PIN as auth password
  const { error: passwordError } = await supabase.auth.updateUser({
    password: pin,
  });

  if (passwordError) {
    console.error("PIN error:", passwordError);
    // Non-fatal: profile is saved, PIN can be set later
  }

  redirect("/verification-pending");
}
