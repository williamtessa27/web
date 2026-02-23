import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineFunnel,
  HiOutlineDocumentArrowDown,
} from 'react-icons/hi2';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { collecteApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import type { Collecte, PaginatedResponse } from '@/types';
import { StatutCollecte } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const statutBadge = (statut: StatutCollecte) => {
  switch (statut) {
    case StatutCollecte.VALIDEE:
      return <Badge variant="success">Validée</Badge>;
    case StatutCollecte.EN_ATTENTE:
      return <Badge variant="warning">En attente</Badge>;
    case StatutCollecte.REJETEE:
      return <Badge variant="danger">Rejetée</Badge>;
    case StatutCollecte.ANNULEE:
      return <Badge variant="danger">Annulée</Badge>;
    default:
      return <Badge>{statut}</Badge>;
  }
};

function getDateKey(c: Collecte): string {
  const d = c.dateCollecte?.slice(0, 10) ?? '';
  return d;
}

export default function CollectesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Collecte> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [downloadingRecuId, setDownloadingRecuId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filterClientId, setFilterClientId] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await collecteApi.list({ limit: 200, sortBy: 'dateCollecte', sortOrder: 'DESC' });
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id: string) => {
    setActionId(id);
    try {
      await collecteApi.valider(id);
      toast.success('Collecte validée.');
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const handleTelechargerRecu = async (id: string) => {
    setDownloadingRecuId(id);
    try {
      await collecteApi.getRecuPdf(id);
      toast.success('Reçu téléchargé.');
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || 'Erreur';
      toast.error(msg);
    } finally {
      setDownloadingRecuId(null);
    }
  };

  const handleRejeter = async (id: string) => {
    setActionId(id);
    try {
      await collecteApi.rejeter(id);
      toast.success('Collecte rejetée.');
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const hasActiveFilters =
    !!filterClientId ||
    !!filterDateFrom ||
    !!filterDateTo ||
    !!filterAmountMin ||
    !!filterAmountMax ||
    !!filterStatut;

  const clearFilters = () => {
    setFilterClientId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setFilterStatut('');
  };

  const uniqueClients = useMemo(() => {
    if (!data?.data) return [];
    const seen = new Set<string>();
    const list: { id: string; label: string }[] = [];
    for (const c of data.data) {
      if (c.client && c.idClient && !seen.has(c.idClient)) {
        seen.add(c.idClient);
        list.push({
          id: c.idClient,
          label: [c.client.nom, c.client.prenom].filter(Boolean).join(' ') || c.client.codeClient || c.idClient,
        });
      }
    }
    list.sort((a, b) => a.label.localeCompare(b.label));
    return list;
  }, [data?.data]);

  const filteredAndGrouped = useMemo(() => {
    if (!data?.data?.length) return [];
    let list = [...data.data];

    if (filterClientId) {
      list = list.filter((c) => c.idClient === filterClientId);
    }
    if (filterDateFrom) {
      list = list.filter((c) => getDateKey(c) >= filterDateFrom);
    }
    if (filterDateTo) {
      list = list.filter((c) => getDateKey(c) <= filterDateTo);
    }
    const minAmount = filterAmountMin ? Number(filterAmountMin) : NaN;
    if (!Number.isNaN(minAmount)) {
      list = list.filter((c) => Number(c.montant) >= minAmount);
    }
    const maxAmount = filterAmountMax ? Number(filterAmountMax) : NaN;
    if (!Number.isNaN(maxAmount)) {
      list = list.filter((c) => Number(c.montant) <= maxAmount);
    }
    if (filterStatut) {
      list = list.filter((c) => c.statut === filterStatut);
    }

    const byDate = new Map<string, Collecte[]>();
    for (const c of list) {
      const key = getDateKey(c);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(c);
    }
    const keys = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));
    return keys.map((key) => ({ dateKey: key, collectes: byDate.get(key)! }));
  }, [data?.data, filterClientId, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, filterStatut]);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collectes</h1>
          <p className="text-gray-500 mt-1">
            {filteredAndGrouped.length === 0
              ? hasActiveFilters
                ? 'Aucune collecte ne correspond aux filtres'
                : `${data?.meta.total ?? 0} collecte(s) enregistrée(s)`
              : `${filteredAndGrouped.reduce((s, g) => s + g.collectes.length, 0)} collecte(s) (filtrées)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters((v) => !v)}
            title="Filtres"
          >
            <HiOutlineFunnel className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                •
              </span>
            )}
          </Button>
          <Link to={AppRoutes.COLLECTE_CREATE}>
            <Button>
              <HiOutlinePlus className="h-4 w-4" /> Nouvelle collecte
            </Button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <Card className="bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Client</label>
              <select
                value={filterClientId}
                onChange={(e) => setFilterClientId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                {uniqueClients.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date début</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date fin</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Montant min (XAF)</label>
              <input
                type="number"
                min={0}
                value={filterAmountMin}
                onChange={(e) => setFilterAmountMin(e.target.value)}
                placeholder="Ex: 1000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Montant max (XAF)</label>
              <input
                type="number"
                min={0}
                value={filterAmountMax}
                onChange={(e) => setFilterAmountMax(e.target.value)}
                placeholder="Ex: 50000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                <option value={StatutCollecte.VALIDEE}>Validée</option>
                <option value={StatutCollecte.EN_ATTENTE}>En attente</option>
                <option value={StatutCollecte.REJETEE}>Rejetée</option>
                <option value={StatutCollecte.ANNULEE}>Annulée</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        </Card>
      )}

      {!data?.data?.length ? (
        <Card>
          <EmptyState
            title="Aucune collecte"
            description="Les paiements journaliers apparaîtront ici une fois enregistrés."
            action={
              <Link to={AppRoutes.COLLECTE_CREATE}>
                <Button>
                  <HiOutlinePlus className="h-4 w-4" /> Nouvelle collecte
                </Button>
              </Link>
            }
            />
        </Card>
      ) : filteredAndGrouped.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun résultat"
            description="Aucune collecte ne correspond aux critères. Modifiez les filtres."
            action={<Button onClick={clearFilters}>Réinitialiser les filtres</Button>}
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Collecteur</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAndGrouped.map(({ dateKey, collectes: group }) => (
                  <Fragment key={dateKey}>
                    <tr className="bg-primary-50/50">
                      <td
                        colSpan={6}
                        className="px-6 py-2 text-sm font-semibold text-primary-700"
                      >
                        {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: fr })}
                      </td>
                    </tr>
                    {group.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {format(new Date(c.dateCollecte), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {c.client?.nom || '—'}
                            {c.client?.prenom ? ` ${c.client.prenom}` : ''}
                          </p>
                          <p className="text-xs text-gray-500">{c.client?.codeClient}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {c.collecteur?.utilisateur?.nom || c.collecteur?.codeCollecteur || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
                          {Number(c.montant).toLocaleString('fr-FR')} XAF
                        </td>
                        <td className="px-6 py-4">{statutBadge(c.statut)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(AppRoutes.COLLECTE_DETAIL.replace(':id', c.id))
                              }
                              title="Voir"
                            >
                              <HiOutlineEye className="h-4 w-4" />
                            </Button>
                            {(c.statut === StatutCollecte.VALIDEE || c.statut === StatutCollecte.EN_ATTENTE) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTelechargerRecu(c.id)}
                                disabled={downloadingRecuId === c.id}
                                title="Télécharger le reçu PDF"
                              >
                                {downloadingRecuId === c.id ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                                ) : (
                                  <HiOutlineDocumentArrowDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {c.statut === StatutCollecte.EN_ATTENTE && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleValider(c.id)}
                                  disabled={actionId === c.id}
                                  title="Valider"
                                >
                                  <HiOutlineCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRejeter(c.id)}
                                  disabled={actionId === c.id}
                                  title="Rejeter"
                                >
                                  <HiOutlineXMark className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
