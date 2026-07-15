import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";

export function ProfileHeader({
  name,
  phone,
  isVerified,
}: {
  name: string;
  phone: string;
  isVerified?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 border-2 border-border">
        <AvatarFallback className="bg-muted text-foreground text-lg font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {phone?.startsWith("63") ? "0" + phone.slice(2) : phone}
        </p>
        {isVerified && (
          <span className="flex text-sm items-center mt-1 gap-1 text-blue-600">
            <BadgeCheck className="h-4 w-4 text-blue-600" />
            Fully Verified
          </span>
        )}
      </div>
    </div>
  );
}
