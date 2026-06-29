type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header>
      {eyebrow ? (
        <p className="text-sm font-medium text-zinc-500">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          {description}
        </p>
      ) : null}
    </header>
  );
}
