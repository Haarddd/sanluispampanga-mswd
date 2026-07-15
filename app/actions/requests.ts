"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchMedicines() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("medicines")
    .select("id, name, generic_name, description, dosage_strength, unit, available_quantity")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching medicines:", error);
    return [];
  }

  return data || [];
}

export async function fetchUserRequests() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { medicineRequests: [], assistanceRequests: [] };
  }

  // Fetch medicine requests
  const { data: medicineRequests, error: medError } = await supabase
    .from("medicine_requests")
    .select("id, medicine_id, quantity, reason, prescription_url, status, pharmacist_notes, request_date, medicines(name, generic_name, unit)")
    .eq("user_id", user.id)
    .order("request_date", { ascending: false });

  if (medError) {
    console.error("Error fetching medicine requests:", medError);
  }

  // Fetch assistance requests
  const { data: assistanceRequests, error: assistError } = await supabase
    .from("assistance_requests")
    .select("id, category, description, urgency_level, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (assistError) {
    console.error("Error fetching assistance requests:", assistError);
  }

  // Format responses to match UI expectations
  const formattedMedicines = (medicineRequests || []).map((req: any) => ({
    id: req.id,
    medicineName: req.medicines?.name || "Unknown Medicine",
    genericName: req.medicines?.generic_name || "",
    quantity: req.quantity,
    unit: req.medicines?.unit || "tablets",
    requestDate: new Date(req.request_date).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    status: req.status.toLowerCase() as "pending" | "approved" | "completed" | "rejected",
    pharmacistNotes: req.pharmacist_notes || "",
    prescriptionUrl: req.prescription_url || "",
  }));

  const formattedAssistance = (assistanceRequests || []).map((req: any) => ({
    id: req.id,
    medicineName: 
      req.category === "medical" ? "Medical Support" :
      req.category === "transport" ? "Transportation Support" :
      req.category === "healthcare" ? "Healthcare Support" :
      req.category === "social" ? "Social / Community Support" :
      req.category === "other" ? "Other Support" : "Food / Financial Assistance",
    genericName: req.description,
    quantity: 1,
    unit: "request",
    requestDate: new Date(req.created_at).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    status: req.status.toLowerCase() as "pending" | "approved" | "completed" | "rejected",
    pharmacistNotes: "",
  }));

  return {
    medicineRequests: formattedMedicines,
    assistanceRequests: formattedAssistance,
  };
}

export async function submitMedicineRequest(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const medicineId = formData.get("medicineId") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const notes = formData.get("notes") as string | null;
  const prescriptionFile = formData.get("prescriptionFile") as File | null;

  if (!medicineId) {
    return { error: "Medicine ID is required" };
  }

  let prescriptionUrl = null;
  if (prescriptionFile && prescriptionFile.size > 0) {
    const fileExt = prescriptionFile.name.split(".").pop();
    const filePath = `${user.id}/prescription_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("id-documents")
      .upload(filePath, prescriptionFile, {
        contentType: prescriptionFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error (prescription):", uploadError);
      return { error: "Failed to upload prescription image." };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("id-documents").getPublicUrl(filePath);

    prescriptionUrl = publicUrl;
  }

  const { error } = await supabase
    .from("medicine_requests")
    .insert({
      user_id: user.id,
      medicine_id: medicineId,
      quantity,
      reason: notes || null,
      prescription_url: prescriptionUrl,
      status: "PENDING",
    });

  if (error) {
    console.error("Error inserting medicine request:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getSignedPrescriptionUrl(prescriptionUrl: string): Promise<{ signedUrl?: string; error?: string }> {
  const supabase = await createClient();

  // Extract the file path from the stored public URL.
  // Stored URLs look like: https://<project>.supabase.co/storage/v1/object/public/id-documents/<path>
  const marker = "/object/public/id-documents/";
  const idx = prescriptionUrl.indexOf(marker);
  if (idx === -1) {
    // Already a non-standard URL or signed URL — just return as-is
    return { signedUrl: prescriptionUrl };
  }

  const filePath = prescriptionUrl.slice(idx + marker.length);

  const { data, error } = await supabase.storage
    .from("id-documents")
    .createSignedUrl(filePath, 60 * 60); // 1 hour

  if (error || !data?.signedUrl) {
    console.error("Error creating signed URL:", error);
    return { error: "Failed to generate a signed URL for the prescription." };
  }

  return { signedUrl: data.signedUrl };
}

export async function submitAssistanceRequest(category: string, description: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user address if exists
  const { data: address } = await supabase
    .from("user_addresses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("assistance_requests")
    .insert({
      user_id: user.id,
      category,
      description,
      status: "PENDING",
      address_id: address?.id || null,
    });

  if (error) {
    console.error("Error inserting assistance request:", error);
    return { error: error.message };
  }

  return { success: true };
}
