export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export const METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  especes: "Espèces",
  cheque: "Chèque",
  virement: "Virement",
  autre: "Autre",
};
