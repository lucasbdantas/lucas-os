import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  description?: string;
  label: string;
};

export function FormField({ children, description, label }: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      {description ? (
        <span className="mt-1 block text-xs leading-5 text-zinc-500">
          {description}
        </span>
      ) : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
