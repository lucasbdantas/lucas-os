export function formatDate(date: string | null | undefined) {
  if (!date) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}
