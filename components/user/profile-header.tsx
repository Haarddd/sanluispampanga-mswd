import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ProfileHeader({
  name,
  phone,
}: {
  name: string;
  phone: string;
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
        <p className="text-sm text-muted-foreground mt-0.5">{phone}</p>
      </div>
    </div>
  );
}
