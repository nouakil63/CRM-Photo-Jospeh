// Mois sans cotisation (1 = janvier … 12 = décembre).
// Ces mois-là, aucun paiement n'est attendu : personne ne passe « En attente ».
export const MOIS_SANS_COTISATION = [1, 10, 11];

export function cotisationDue(date: Date = new Date()): boolean {
  return !MOIS_SANS_COTISATION.includes(date.getUTCMonth() + 1);
}
