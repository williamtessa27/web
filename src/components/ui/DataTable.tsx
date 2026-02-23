import { useState, useMemo, useEffect, useRef } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineArrowDownTray, HiOutlineChevronDown, HiOutlineArrowPath, HiOutlineSquares2X2 } from 'react-icons/hi2';
import Card from '@/components/ui/Card';
import { filterTableBySearch } from '@/utils/tableSearch.utils';

const STORAGE_PREFIX = 'datatable-visible-columns-';

function loadVisibleColumns(storageKey: string, columnKeys: string[]): Record<string, boolean> {
  if (typeof window === 'undefined') return Object.fromEntries(columnKeys.map((k) => [k, true]));
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + storageKey);
    if (!raw) return Object.fromEntries(columnKeys.map((k) => [k, true]));
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const result: Record<string, boolean> = {};
    for (const k of columnKeys) {
      result[k] = parsed[k] !== false;
    }
    return result;
  } catch {
    return Object.fromEntries(columnKeys.map((k) => [k, true]));
  }
}

function saveVisibleColumns(storageKey: string, visible: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(visible));
  } catch {}
}

export type ColumnAlign = 'left' | 'center' | 'right';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  align?: ColumnAlign;
  /** Rendu de la cellule */
  render: (item: T) => React.ReactNode;
  /** Texte utilisé pour la recherche sur cette colonne (si absent, pas de recherche sur cette colonne) */
  getSearchValue?: (item: T) => string;
}

export interface DataTableProps<T> {
  /** Colonnes du tableau */
  columns: DataTableColumn<T>[];
  /** Données */
  data: T[];
  /** Clé unique pour chaque ligne (par défaut "id") */
  idKey?: keyof T | string;
  /** Placeholder du champ recherche */
  searchPlaceholder?: string;
  /** Nombre d’éléments par page */
  pageSize?: number;
  /** Titre / description / action affichés quand il n’y a aucune donnée */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  /** Callback pour l’actualisation manuelle (affiché uniquement si défini) */
  onRefresh?: () => void;
  /** Texte du tooltip du bouton actualiser */
  refreshLabel?: string;
  /** Callback pour le bouton export (affiché uniquement si défini) */
  onExport?: () => void;
  /** Texte du tooltip du bouton export */
  exportLabel?: string;
  /** Clé pour persister la visibilité des colonnes dans localStorage (ex: "clients"). Si non fourni, pas de persistance. */
  storageKey?: string;
}

const alignClasses: Record<ColumnAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export default function DataTable<T extends object>({
  columns,
  data,
  idKey = 'id' as keyof T,
  searchPlaceholder = 'Rechercher…',
  pageSize = 15,
  emptyTitle = 'Aucune donnée',
  emptyDescription,
  emptyAction,
  onRefresh,
  refreshLabel = 'Actualiser',
  onExport,
  exportLabel = 'Exporter',
  storageKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  /** Clé de la colonne sur laquelle filtrer, ou '' = toutes les colonnes */
  const [searchColumnKey, setSearchColumnKey] = useState<string>('');

  const columnKeys = useMemo(() => columns.map((c) => c.key), [columns]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    storageKey ? loadVisibleColumns(storageKey, columnKeys) : Object.fromEntries(columnKeys.map((k) => [k, true])),
  );
  useEffect(() => {
    if (!storageKey) return;
    setVisibleColumns((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const k of columnKeys) {
        if (next[k] === undefined) {
          next[k] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [storageKey, columnKeys.join(',')]);
  const visibleColumnSet = useMemo(
    () => new Set(columns.filter((c) => visibleColumns[c.key] !== false).map((c) => c.key)),
    [columns, visibleColumns],
  );
  const displayColumns = useMemo(
    () => columns.filter((c) => visibleColumnSet.has(c.key)),
    [columns, visibleColumnSet],
  );

  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!columnsDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(e.target as Node)) {
        setColumnsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [columnsDropdownOpen]);

  const searchableColumns = useMemo(
    () => columns.filter((col) => col.getSearchValue),
    [columns]
  );
  const selectedColumn = searchColumnKey
    ? searchableColumns.find((c) => c.key === searchColumnKey)
    : null;

  const filteredData = useMemo(
    () =>
      filterTableBySearch(
        data,
        search,
        searchableColumns as { key: string; getSearchValue?: (item: T) => string }[],
        searchColumnKey || undefined,
      ),
    [data, search, searchableColumns, searchColumnKey],
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageData = filteredData.slice(start, start + pageSize);

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  return (
    <Card padding={false}>
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <div className="relative w-60 sm:w-[30rem] ">
          <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {searchableColumns.length > 0 && (
          <div className="relative">
            <select
              value={searchColumnKey}
              onChange={(e) => {
                setSearchColumnKey(e.target.value);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[140px]"
            >
              <option value="">Toutes les colonnes</option>
              {searchableColumns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
            <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )}
        <div className="flex-1 min-w-0" aria-hidden />
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="relative" ref={columnsDropdownRef}>
            <button
              type="button"
              onClick={() => setColumnsDropdownOpen((o) => !o)}
              title="Afficher / masquer les colonnes"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HiOutlineSquares2X2 className="h-4 w-4" />
              <span className="hidden sm:inline">Colonnes</span>
              <HiOutlineChevronDown className={`h-4 w-4 transition-transform ${columnsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {columnsDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key] !== false}
                      onChange={() => {
                        const next = { ...visibleColumns, [col.key]: visibleColumns[col.key] === false };
                        setVisibleColumns(next);
                        if (storageKey) saveVisibleColumns(storageKey, next);
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title={refreshLabel}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HiOutlineArrowPath className="h-4 w-4" />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              title={exportLabel}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HiOutlineArrowDownTray className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
          )}
        </div>
      </div>

      {pageData.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {search.trim() ? (
            <p>Aucun résultat pour &quot;{search}&quot;.</p>
          ) : (
            <>
              <p className="font-medium text-gray-700">{emptyTitle}</p>
              {emptyDescription && <p className="mt-1 text-sm">{emptyDescription}</p>}
              {emptyAction && <div className="mt-4">{emptyAction}</div>}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {displayColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase ${alignClasses[col.align ?? 'left']}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageData.map((item) => (
                  <tr key={String((item as Record<string, unknown>)[idKey as string])} className="hover:bg-gray-50 transition-colors">
                    {displayColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-6 py-4 text-sm ${alignClasses[col.align ?? 'left']}`}
                      >
                        {col.render(item as T)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredData.length} résultat(s)
                {search.trim() && (
                  <>
                    {' pour « '}{search}»{selectedColumn && ` (${selectedColumn.label})`}
                  </>
                )}
                {' · '}
                Page {currentPage} / {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm font-medium text-gray-600 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Début
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm font-medium text-gray-600 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm font-medium text-gray-600 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm font-medium text-gray-600 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fin
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
