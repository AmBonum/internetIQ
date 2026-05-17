import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  /** Last N words of the title rendered with the lime→emerald gradient. Defaults to 1. */
  accentWords?: number;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

/**
 * Hlavičkový blok pre stránky v /app — zladený so štýlom subenai.sk:
 * eyebrow badge (pulse dot) + nadpis s gradient accent slovami + voliteľný subtitle a akcie.
 */
export function PageHeader({
  eyebrow,
  title,
  accentWords = 1,
  subtitle,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  const words = title.trim().split(/\s+/);
  const splitAt = Math.max(0, words.length - accentWords);
  const head = words.slice(0, splitAt).join(" ");
  const accent = words.slice(splitAt).join(" ");

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <span className="eyebrow-badge mb-3">{eyebrow}</span>}
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {Icon && <Icon className="h-6 w-6 text-primary" />}
          {head && <span>{head}</span>}
          {head && " "}
          <span className="text-gradient-primary">{accent}</span>
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
