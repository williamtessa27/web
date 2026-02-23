/**
 * Utilitaire réutilisable pour la recherche dans les tableaux (DataTable, listes, etc.).
 * Utilisable en filtrage côté client ou pour construire les paramètres d’appel API.
 */

export interface SearchableColumn<T> {
  key: string;
  getSearchValue?: (item: T) => string;
}

/**
 * Filtre un tableau selon un terme de recherche.
 * - Si `columnKey` est fourni et que la colonne a `getSearchValue`, la recherche
 *   s’applique uniquement sur cette colonne.
 * - Sinon, la recherche s’applique sur la concaténation des valeurs de toutes
 *   les colonnes searchables (recherche "toutes colonnes").
 *
 * @param data Données à filtrer
 * @param search Terme de recherche (insensible à la casse)
 * @param columns Colonnes avec getSearchValue optionnel
 * @param columnKey Clé de la colonne cible (vide = toutes les colonnes)
 * @returns Sous-ensemble des éléments qui matchent
 */
export function filterTableBySearch<T>(
  data: T[],
  search: string,
  columns: SearchableColumn<T>[],
  columnKey?: string,
): T[] {
  const searchLower = (search ?? '').trim().toLowerCase();
  if (!searchLower) return data;

  const searchableColumns = columns.filter((c) => c.getSearchValue);
  const selectedColumn = columnKey
    ? searchableColumns.find((c) => c.key === columnKey)
    : null;

  return data.filter((item) => {
    if (selectedColumn?.getSearchValue) {
      const value = (selectedColumn.getSearchValue(item) ?? '').toLowerCase();
      return value.includes(searchLower);
    }
    const parts = searchableColumns
      .map((col) => col.getSearchValue?.(item) ?? '')
      .filter(Boolean);
    const fullText = parts.join(' ').toLowerCase();
    return fullText.includes(searchLower);
  });
}

/**
 * Construit les paramètres de requête pour une recherche côté backend.
 * À utiliser avec les APIs qui acceptent `search` et optionnellement `searchField`.
 *
 * @param search Terme de recherche
 * @param columnKey Clé de la colonne (envoyée telle quelle comme searchField si fournie)
 * @returns Objet à passer en query params (search, searchField)
 */
export function buildTableSearchParams(
  search: string,
  columnKey?: string,
): { search?: string; searchField?: string } {
  const s = (search ?? '').trim();
  if (!s) return {};
  const params: { search?: string; searchField?: string } = { search: s };
  if (columnKey) params.searchField = columnKey;
  return params;
}
