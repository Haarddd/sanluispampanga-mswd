import { cn } from "@/lib/utils";

type BadgeVariant = "pending" | "approved" | "active" | "completed" | "rejected" | "eligible";

const variantStyles: Record<BadgeVariant, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-muted text-muted-foreground",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  eligible: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
};

export function StatusBadge({
  variant,
  children,
  className,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
