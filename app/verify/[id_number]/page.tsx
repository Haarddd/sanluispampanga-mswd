import { createClient } from "@/lib/supabase/server";
import {
  XCircle,
  ShieldCheck,
  MapPin,
  Heart,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id_number: string }>;
}

export default async function VerifyCitizenPage({ params }: PageProps) {
  const { id_number } = await params;
  const cleanIdNumber = id_number.replace(/[^0-9]/g, "");
  const supabase = await createClient();

  // Query the digital_ids table to check if there is an active record
  const { data: digitalId, error } = await supabase
    .from("digital_ids")
    .select(
      `
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
    `,
    )
    .eq("id_number", cleanIdNumber)
    .single();

  const formatCardNumber = (num: string) => {
    if (!num) return "";
    return num.replace(/(\d{3})(\d{3})(\d{3})/, "$1-$2-$3");
  };

  if (error || !digitalId) {
    console.error("Verification error or ID not found:", {
      originalId: id_number,
      sanitizedId: cleanIdNumber,
      dbError: error
        ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        : "No record found",
    });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-card border p-6 max-w-sm w-full text-center shadow-lg rounded-lg">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invalid Identification</h1>
          <p className="text-base text-muted-foreground">
            The Digital ID number{" "}
            <span className="font-mono font-medium text-foreground">
              {id_number}
            </span>{" "}
            could not be verified in our records.
          </p>
        </div>
      </div>
    );
  }

  // Check if status is active and user profile is approved
  const isVerified =
    digitalId.status === "ACTIVE" &&
    (digitalId.user_profile as any)?.verification_status === "APPROVED";
  const user = {
    ...(digitalId.user_profile as any),
    address: (digitalId.user_profile as any)?.user_addresses?.[0] || null,
  };

  // Format address nicely
  let addressStr = "San Luis, Pampanga";
  if (user?.address) {
    const addr = user.address as any;
    addressStr = `${addr.street ? addr.street + ", " : ""}Brgy. ${addr.barangay || ""}, San Luis, Pampanga`;
  }

  // Determine status configuration
  let statusIconBg = "bg-destructive/10";
  let statusIconColor = "text-red-600 dark:text-red-400";
  let StatusIcon = XCircle;
  let statusTitle = "Inactive ID Card";
  let statusDesc = "Official MSWD Digital Credential Verification";

  if (digitalId.status === "ACTIVE" && isVerified) {
    statusIconBg = "bg-emerald-100 dark:bg-emerald-950/20";
    statusIconColor = "text-emerald-600 dark:text-emerald-400";
    StatusIcon = ShieldCheck;
    statusTitle = "Verified Active Citizen";
    statusDesc = "Official MSWD Digital Credential Verification";
  } else if (digitalId.status === "EXPIRED") {
    statusIconBg = "bg-yellow-100 dark:bg-yellow-950/20";
    statusIconColor = "text-yellow-600 dark:text-yellow-400";
    StatusIcon = Clock;
    statusTitle = "Expired ID Card";
    statusDesc = "This digital ID has reached its expiration date.";
  } else if (digitalId.status === "SUSPENDED") {
    statusIconBg = "bg-red-100 dark:bg-red-950/20";
    statusIconColor = "text-red-600 dark:text-red-400";
    StatusIcon = AlertTriangle;
    statusTitle = "Suspended ID Card";
    statusDesc = "This digital ID has been suspended by MSWD.";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-card border p-6 max-w-sm w-full text-center shadow-lg rounded-2xl">
        {/* Status Icon */}
        <div
          className={`mx-auto w-16 h-16 ${statusIconBg} rounded-full flex items-center justify-center mb-4`}
        >
          <StatusIcon className={`h-10 w-10 ${statusIconColor}`} />
        </div>

        {/* Status Title */}
        <h1 className="text-xl font-bold mb-2">{statusTitle}</h1>

        {/* Short Status Description */}
        <p className="text-base text-muted-foreground mb-4">{statusDesc}</p>

        {/* Citizen Details */}
        <div className="border-t border-border pt-4 text-left space-y-4">
          <div>
            <span className="text-xs text-muted-foreground font-medium">
              Citizen Name
            </span>
            <span className="text-sm font-medium block">
              {user?.full_name || "Unknown Citizen"}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground font-medium">
              Digital ID Card Number
            </span>
            <span className="text-sm font-mono font-medium block">
              {formatCardNumber(cleanIdNumber)}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground font-medium">
              Registered Address
            </span>
            <span className="text-sm font-medium block">{addressStr}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Date of Issue
              </span>
              <span className="text-sm font-medium block">
                {digitalId.issue_date}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Date of Expiry
              </span>
              <span className="text-sm font-medium block">
                {digitalId.expiry_date}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
