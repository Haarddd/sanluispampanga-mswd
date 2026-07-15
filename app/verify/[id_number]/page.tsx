import { createClient } from "@/lib/supabase/server";
import { XCircle, ShieldCheck, MapPin, Calendar, Heart } from "lucide-react";

interface PageProps {
  params: Promise<{ id_number: string }>;
}

export default async function VerifyCitizenPage({ params }: PageProps) {
  const { id_number } = await params;
  const supabase = await createClient();

  // Query the digital_ids table to check if there is an active record
  const { data: digitalId, error } = await supabase
    .from("digital_ids")
    .select(`
      *,
      user_profile:user_profiles (
        full_name,
        verification_status,
        user_addresses (
          street,
          barangay,
          municipality,
          province,
          region,
          zip_code
        )
      )
    `)
    .eq("id_number", id_number)
    .single();

  if (error || !digitalId) {
    console.error("Verification error or ID not found:", error);
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-zinc-900">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Invalid Identification</h1>
          <p className="text-sm text-zinc-500 mb-6">
            The Digital ID number <span className="font-mono font-bold text-zinc-800">{id_number}</span> could not be verified in our records or may have been revoked.
          </p>
          <div className="border-t border-zinc-100 pt-6">
            <p className="text-xs text-zinc-400">
              Municipal Social Welfare and Development Office<br />
              San Luis, Pampanga
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if status is active and user profile is approved
  const isVerified = digitalId.status === "ACTIVE" && (digitalId.user_profile as any)?.verification_status === "APPROVED";
  const user = {
    ...(digitalId.user_profile as any),
    address: (digitalId.user_profile as any)?.user_addresses?.[0] || null
  };

  // Format address nicely
  let addressStr = "San Luis, Pampanga";
  if (user?.address) {
    const addr = user.address as any;
    addressStr = `${addr.street ? addr.street + ", " : ""}Brgy. ${addr.barangay || ""}, San Luis, Pampanga`;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-zinc-900">
      {/* Verification Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden max-w-md w-full shadow-xl">
        
        {/* Verification Status Header */}
        <div className={`p-6 text-center text-white ${isVerified ? "bg-emerald-600" : "bg-red-600"}`}>
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-3">
            {isVerified ? (
              <ShieldCheck className="h-10 w-10 text-white" />
            ) : (
              <XCircle className="h-10 w-10 text-white" />
            )}
          </div>
          <h1 className="text-xl font-black tracking-wide uppercase">
            {isVerified ? "Verified Active Citizen" : "Inactive or Revoked ID"}
          </h1>
          <p className="text-xs text-white/80 mt-1">
            Official MSWD Digital Credential Verification
          </p>
        </div>

        {/* Citizen Details */}
        <div className="p-6 space-y-5">
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Citizen Name
            </span>
            <span className="text-lg font-bold text-zinc-900 block mt-0.5">
              {user?.full_name || "Unknown Citizen"}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Digital ID Card Number
            </span>
            <span className="text-base font-mono font-bold text-blue-600 block mt-0.5">
              {id_number}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Registered Address
            </span>
            <div className="flex items-start gap-1.5 mt-1">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-zinc-700 leading-relaxed">
                {addressStr}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                Date of Issue
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-medium text-zinc-800">
                  {digitalId.issue_date}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                Date of Expiry
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-medium text-zinc-800">
                  {digitalId.expiry_date}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Seal */}
        <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span className="text-xs font-semibold text-zinc-500">MSWD San Luis</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Pampanga, PH
          </span>
        </div>
      </div>
    </div>
  );
}
