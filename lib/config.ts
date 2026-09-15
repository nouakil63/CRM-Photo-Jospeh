// Mois sans cotisation (1 = janvier … 12 = décembre) : Joseph est absent
// de décembre à fin février. Ces mois-là, aucun paiement n'est attendu.
export const MOIS_SANS_COTISATION = [12, 1, 2];

export function cotisationDue(date: Date = new Date()): boolean {
  return !MOIS_SANS_COTISATION.includes(date.getUTCMonth() + 1);
}
