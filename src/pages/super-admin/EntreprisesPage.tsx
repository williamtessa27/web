import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineNoSymbol,
  HiOutlineCheckCircle,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';
import { entrepriseApi } from '@/core/api';
import type { Entreprise, PaginatedResponse } from '@/types';
import { StatutEntreprise } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

type FilterTab = 'toutes' | 'en-attente' | 'actives' | 'bloquees' | 'profil-incomplet';

const LIMIT = 10;
const DEBOUNCE_MS = 300;

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      ))}
    </div>
  );
}

function getStatutBadgeVariant(statut: StatutEntreprise): 'success' | 'warning' | 'danger' | 'info' {
  switch (statut) {
    case StatutEntreprise.EN_ATTENTE:
      return 'info';
    case StatutEntreprise.ACTIVE:
      return 'success';
    case StatutEntreprise.SUSPENDUE:
      return 'warning';
    case StatutEntreprise.BLOQUEE:
      return 'danger';
    default:
      return 'success';
  }
}

function getStatutLabel(statut: StatutEntreprise): string {
  switch (statut) {
    case StatutEntreprise.EN_ATTENTE:
      return 'En attente';
    case StatutEntreprise.ACTIVE:
      return 'Active';
    case StatutEntreprise.SUSPENDUE:
      return 'Suspendue';
    case StatutEntreprise.BLOQUEE:
      return 'Bloquée';
    default:
      return statut;
  }
}

export default function EntreprisesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Entreprise> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('toutes');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: LIMIT,
        search: searchDebounced || undefined,
      };
      if (filterTab === 'en-attente') params.statut = StatutEntreprise.EN_ATTENTE;
      if (filterTab === 'actives') params.statut = StatutEntreprise.ACTIVE;
      if (filterTab === 'bloquees') params.statut = StatutEntreprise.BLOQUEE;
      if (filterTab === 'profil-incomplet') params.profilComplete = 'false';

      const res = await entrepriseApi.list(params);
      setData(res);
    } catch {
      toast.error('Erreur lors du chargement des entreprises');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, filterTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [searchDebounced]);

  const handleBloquer = async (e: Entreprise, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!window.confirm(`Bloquer l'entreprise "${e.nom}" ?`)) return;
    setActionLoading(e.id);
    try {
      await entrepriseApi.bloquer(e.id);
      toast.success('Entreprise bloquée');
      loadData();
    } catch {
      toast.error('Erreur lors du blocage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActiver = async (e: Entreprise, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!window.confirm(`Activer l'entreprise "${e.nom}" ? Elle pourra alors se connecter à la plateforme.`)) return;
    setActionLoading(e.id);
    try {
      await entrepriseApi.activer(e.id);
      toast.success('Entreprise activée');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erreur lors de l\'activation';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDebloquer = async (e: Entreprise, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!window.confirm(`Débloquer l'entreprise "${e.nom}" ?`)) return;
    setActionLoading(e.id);
    try {
      await entrepriseApi.debloquer(e.id);
      toast.success('Entreprise débloquée');
      loadData();
    } catch {
      toast.error('Erreur lors du déblocage');
    } finally {
      setActionLoading(null);
    }
  };

  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 0;
  const displayList = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Entreprises</h1>
        <p className="text-gray-500 mt-1">
          Gestion des entreprises inscrites sur la plateforme Kimifinance.
        </p>
      </div>

      {/* Search + Filters */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex flex-wrap gap-1 rounded-lg bg-subtle p-1">
            {(['toutes', 'en-attente', 'actives', 'bloquees', 'profil-incomplet'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setFilterTab(tab);
                  setPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filterTab === tab
                    ? 'bg-white text-primary-700 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'toutes' && 'Toutes'}
                {tab === 'en-attente' && 'En attente'}
                {tab === 'actives' && 'Actives'}
                {tab === 'bloquees' && 'Bloquées'}
                {tab === 'profil-incomplet' && 'Profil Incomplet'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <TableSkeleton />
        ) : !displayList.length ? (
          <EmptyState
            title="Aucune entreprise"
            description={
              filterTab === 'toutes'
                ? "Aucune entreprise enregistrée sur la plateforme."
                : `Aucune entreprise correspondant au filtre "${filterTab === 'en-attente' ? 'En attente' : filterTab === 'actives' ? 'Actives' : filterTab === 'bloquees' ? 'Bloquées' : 'Profil Incomplet'}".`
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-subtle/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ville
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Secteur
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Profil
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date création
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayList.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/super-admin/entreprises/${e.id}`)}
                      className="hover:bg-primary-50/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{e.nom}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{e.telephone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{e.ville || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {e.secteurActivite || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatutBadgeVariant(e.statut)}>
                          {getStatutLabel(e.statut)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={e.profilComplete ? 'success' : 'warning'}
                        >
                          {e.profilComplete ? 'Complet' : 'Incomplet'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {e.createdAt
                          ? format(new Date(e.createdAt), 'dd MMM yyyy', { locale: fr })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2" onClick={(ev) => ev.stopPropagation()}>
                          {e.statut === StatutEntreprise.EN_ATTENTE ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(ev) => handleActiver(e, ev)}
                              disabled={!!actionLoading}
                              isLoading={actionLoading === e.id}
                              className="bg-primary-600 hover:bg-primary-700"
                            >
                              <HiOutlinePlayCircle className="h-4 w-4" />
                              Activer
                            </Button>
                          ) : e.statut === StatutEntreprise.BLOQUEE ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(ev) => handleDebloquer(e, ev)}
                              disabled={!!actionLoading}
                              isLoading={actionLoading === e.id}
                              className="text-accent-600 border-accent-200 hover:bg-accent-50"
                            >
                              <HiOutlineCheckCircle className="h-4 w-4" />
                              Débloquer
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(ev) => handleBloquer(e, ev)}
                              disabled={!!actionLoading}
                              isLoading={actionLoading === e.id}
                              className="text-error-600 border-error-200 hover:bg-error-50"
                            >
                              <HiOutlineNoSymbol className="h-4 w-4" />
                              Bloquer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {meta.total} entreprise(s) • Page {meta.page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
