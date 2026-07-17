type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="page-header notebook-rule max-w-4xl">
      {eyebrow ? (
        <p className="section-eyebrow">{eyebrow}</p>
      ) : null}
      <h1 className="page-header-title mt-3 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="page-header-description mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          {description}
        </p>
      ) : null}
    </header>
  );
}
