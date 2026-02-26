import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineFunnel,
  HiOutlineDocumentArrowDown,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { collecteApi, exportCollectes, collecteurApi, clientApi } from '@/core/api';
import type { ExportCollectesParams } from '@/core/api';
import type { Collecteur } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import type { Collecte, Client, PaginatedResponse } from '@/types';
import { StatutCollecte } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

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
  const [filterCollecteurId, setFilterCollecteurId] = useState<string>('');

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [clientsForExport, setClientsForExport] = useState<Client[]>([]);
  const [exportForm, setExportForm] = useState<ExportCollectesParams>({
    format: 'xlsx',
    dateDebut: '',
    dateFin: '',
    search: '',
    statut: '',
    collecteurId: '',
    clientId: '',
    montantMin: undefined,
    montantMax: undefined,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        limit: 200,
        sortBy: 'dateCollecte',
        sortOrder: 'DESC',
      };
      if (filterDateFrom) params.dateDebut = filterDateFrom;
      if (filterDateTo) params.dateFin = filterDateTo;
      if (filterStatut) params.statut = filterStatut;
      if (filterClientId) params.clientId = filterClientId;
      if (filterCollecteurId) params.collecteurId = filterCollecteurId;
      const min = filterAmountMin ? Number(filterAmountMin) : undefined;
      const max = filterAmountMax ? Number(filterAmountMax) : undefined;
      if (min != null && !Number.isNaN(min)) params.montantMin = min;
      if (max != null && !Number.isNaN(max)) params.montantMax = max;
      const res = await collecteApi.list(params);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [
    filterDateFrom,
    filterDateTo,
    filterStatut,
    filterClientId,
    filterCollecteurId,
    filterAmountMin,
    filterAmountMax,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (exportModalOpen) {
      collecteurApi.list({ limit: 300 }).then((r) => setCollecteurs(r.data ?? [])).catch(() => setCollecteurs([]));
      clientApi.list({ limit: 500 }).then((r) => setClientsForExport(r.data ?? [])).catch(() => setClientsForExport([]));
    }
  }, [exportModalOpen]);

  useEffect(() => {
    if (showFilters && collecteurs.length === 0) {
      collecteurApi.list({ limit: 300 }).then((r) => setCollecteurs(r.data ?? [])).catch(() => setCollecteurs([]));
    }
  }, [showFilters, collecteurs.length]);

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
    !!filterStatut ||
    !!filterCollecteurId;

  const clearFilters = () => {
    setFilterClientId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setFilterStatut('');
    setFilterCollecteurId('');
  };

  const handleExport = useCallback(() => setExportModalOpen(true), []);

  const handleExportSubmit = useCallback(async () => {
    setExportLoading(true);
    try {
      const params: ExportCollectesParams = {
        format: exportForm.format ?? 'xlsx',
        dateDebut: exportForm.dateDebut || undefined,
        dateFin: exportForm.dateFin || undefined,
        search: exportForm.search || undefined,
        statut: exportForm.statut || undefined,
        collecteurId: exportForm.collecteurId || undefined,
        clientId: exportForm.clientId || undefined,
        montantMin: exportForm.montantMin,
        montantMax: exportForm.montantMax,
      };
      const filename = await exportCollectes(params);
      setExportModalOpen(false);
      toast.success(`Export téléchargé : ${filename}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Erreur lors de l\'export';
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  }, [exportForm]);

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
    const list = data.data;
    const byDate = new Map<string, Collecte[]>();
    for (const c of list) {
      const key = getDateKey(c);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(c);
    }
    const keys = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));
    return keys.map((key) => ({ dateKey: key, collectes: byDate.get(key)! }));
  }, [data?.data]);

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
          <Button variant="secondary" onClick={handleExport} title="Exporter les collectes">
            <HiOutlineArrowDownTray className="h-4 w-4" />
            Exporter
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Collecteur</label>
              <select
                value={filterCollecteurId}
                onChange={(e) => setFilterCollecteurId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                {collecteurs.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.utilisateur ? `${col.utilisateur.prenom || ''} ${col.utilisateur.nom || ''}`.trim() || col.codeCollecteur : col.codeCollecteur}
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

      <Modal
        open={exportModalOpen}
        onClose={() => !exportLoading && setExportModalOpen(false)}
        title="Exporter les collectes"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choisissez le format et les filtres optionnels. Les données sont exportées depuis la base (jusqu'à 30 000 lignes).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Format"
              value={exportForm.format ?? 'xlsx'}
              onChange={(e) => setExportForm((f) => ({ ...f, format: e.target.value as 'xlsx' | 'csv' }))}
              options={[
                { value: 'xlsx', label: 'Excel (.xlsx)' },
                { value: 'csv', label: 'CSV' },
              ]}
            />
            <Select
              label="Statut"
              value={exportForm.statut ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, statut: e.target.value || undefined }))}
              options={[
                { value: '', label: 'Tous' },
                { value: StatutCollecte.VALIDEE, label: 'Validée' },
                { value: StatutCollecte.EN_ATTENTE, label: 'En attente' },
                { value: StatutCollecte.REJETEE, label: 'Rejetée' },
                { value: StatutCollecte.ANNULEE, label: 'Annulée' },
              ]}
            />
            <Select
              label="Collecteur"
              value={exportForm.collecteurId ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, collecteurId: e.target.value || undefined }))}
              options={[
                { value: '', label: 'Tous' },
                ...collecteurs.map((col) => ({
                  value: col.id,
                  label: col.utilisateur
                    ? `${col.utilisateur.prenom || ''} ${col.utilisateur.nom || ''}`.trim() || col.codeCollecteur
                    : col.codeCollecteur,
                })),
              ]}
            />
            <Select
              label="Client"
              value={exportForm.clientId ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, clientId: e.target.value || undefined }))}
              options={[
                { value: '', label: 'Tous' },
                ...clientsForExport.map((cl) => ({
                  value: cl.id,
                  label: [cl.nom, cl.prenom].filter(Boolean).join(' ') || cl.codeClient || cl.id,
                })),
              ]}
            />
          </div>
          <Input
            label="Recherche (nom, prénom, code client)"
            placeholder="Filtrer par texte…"
            value={exportForm.search ?? ''}
            onChange={(e) => setExportForm((f) => ({ ...f, search: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date collecte (début)"
              type="date"
              value={exportForm.dateDebut ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, dateDebut: e.target.value }))}
            />
            <Input
              label="Date collecte (fin)"
              type="date"
              value={exportForm.dateFin ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, dateFin: e.target.value }))}
            />
            <Input
              label="Montant min (XAF)"
              type="number"
              min={0}
              placeholder="Ex: 1000"
              value={exportForm.montantMin ?? ''}
              onChange={(e) =>
                setExportForm((f) => ({
                  ...f,
                  montantMin: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
            />
            <Input
              label="Montant max (XAF)"
              type="number"
              min={0}
              placeholder="Ex: 50000"
              value={exportForm.montantMax ?? ''}
              onChange={(e) =>
                setExportForm((f) => ({
                  ...f,
                  montantMax: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setExportModalOpen(false)} disabled={exportLoading}>
              Annuler
            </Button>
            <Button onClick={handleExportSubmit} disabled={exportLoading}>
              {exportLoading ? 'Export en cours…' : 'Télécharger l\'export'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
