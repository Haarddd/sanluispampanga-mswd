import Link from "next/link";

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
