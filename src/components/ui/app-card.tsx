import type { ReactNode } from "react";

type AppCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "soft" | "muted" | "flat";
};

const variantClassName = {
  default: "app-card",
  flat: "app-card-flat",
  muted: "app-card-muted",
  soft: "app-card-soft",
};

export function AppCard({
  children,
  className = "",
  variant = "default",
}: AppCardProps) {
  return (
    <div className={`${variantClassName[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
}
