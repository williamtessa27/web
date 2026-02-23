/**
 * Données et helpers pour les champs téléphone avec indicatif pays.
 * Pays par défaut : Cameroun (+237).
 */

export interface PhoneCountry {
  code: string;
  indicatif: string;
  libelle: string;
}

/** Liste des pays (Cameroun en premier = défaut). Extensible dynamiquement. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'CM', indicatif: '237', libelle: 'Cameroun' },
  { code: 'CI', indicatif: '225', libelle: 'Côte d\'Ivoire' },
  { code: 'SN', indicatif: '221', libelle: 'Sénégal' },
  { code: 'FR', indicatif: '33', libelle: 'France' },
  { code: 'GA', indicatif: '241', libelle: 'Gabon' },
  { code: 'NE', indicatif: '227', libelle: 'Niger' },
  { code: 'TG', indicatif: '228', libelle: 'Togo' },
  { code: 'BJ', indicatif: '229', libelle: 'Bénin' },
];

export const DEFAULT_PHONE_INDICATIF = PHONE_COUNTRIES[0].indicatif; // 237

/** Construit un numéro E.164 à partir de l'indicatif et du numéro national. */
export function buildE164(indicatif: string, numNational: string): string {
  const digits = numNational.replace(/\D/g, '');
  if (!digits.length) return '';
  return `+${indicatif}${digits}`;
}

/** Indicatifs reconnus pour le parsing (longueur décroissante pour matcher le plus long d'abord). */
const INDICATIFS = PHONE_COUNTRIES.map((c) => c.indicatif).sort(
  (a, b) => b.length - a.length,
);

/**
 * Décompose un numéro E.164 (ex. +237657780596) en indicatif + numéro national.
 * Si non reconnu, utilise l'indicatif par défaut et traite tout le reste comme national.
 */
export function parseE164(e164: string | undefined): { indicatif: string; national: string } {
  if (!e164 || typeof e164 !== 'string') {
    return { indicatif: DEFAULT_PHONE_INDICATIF, national: '' };
  }
  const digits = e164.replace(/\D/g, '');
  if (!digits.length) return { indicatif: DEFAULT_PHONE_INDICATIF, national: '' };
  for (const ind of INDICATIFS) {
    if (digits.startsWith(ind) && digits.length > ind.length) {
      return { indicatif: ind, national: digits.slice(ind.length) };
    }
  }
  return { indicatif: DEFAULT_PHONE_INDICATIF, national: digits };
}
