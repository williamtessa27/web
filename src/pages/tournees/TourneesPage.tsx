import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { tourneeApi, exportTournees, collecteurApi } from '@/core/api';
import type { ExportTourneesParams } from '@/core/api';
import type { Tournee, PaginatedResponse } from '@/types';
import type { Collecteur } from '@/types';
import { StatutTournee } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function TourneesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Tournee> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterCollecteurId, setFilterCollecteurId] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportForm, setExportForm] = useState<ExportTourneesParams>({
    format: 'xlsx',
    dateDebut: '',
    dateFin: '',
    statut: '',
    collecteurId: '',
    montantMin: undefined,
    montantMax: undefined,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        limit: 100,
        sortBy: 'dateTournee',
        sortOrder: 'DESC',
      };
      if (filterDateFrom) params.dateDebut = filterDateFrom;
      if (filterDateTo) params.dateFin = filterDateTo;
      if (filterStatut) params.statut = filterStatut;
      if (filterCollecteurId) params.collecteurId = filterCollecteurId;
      const min = filterAmountMin ? Number(filterAmountMin) : undefined;
      const max = filterAmountMax ? Number(filterAmountMax) : undefined;
      if (min != null && !Number.isNaN(min)) params.montantMin = min;
      if (max != null && !Number.isNaN(max)) params.montantMax = max;
      const res = await tourneeApi.list(params);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterDateFrom, filterDateTo, filterStatut, filterCollecteurId, filterAmountMin, filterAmountMax]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (showFilters || exportModalOpen) {
      collecteurApi.list({ limit: 300 }).then((r) => setCollecteurs(r.data ?? [])).catch(() => setCollecteurs([]));
    }
  }, [showFilters, exportModalOpen]);

  const hasActiveFilters =
    !!filterDateFrom ||
    !!filterDateTo ||
    !!filterStatut ||
    !!filterCollecteurId ||
    !!filterAmountMin ||
    !!filterAmountMax;

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterStatut('');
    setFilterCollecteurId('');
    setFilterAmountMin('');
    setFilterAmountMax('');
  };

  const handleExport = useCallback(() => setExportModalOpen(true), []);

  const handleExportSubmit = useCallback(async () => {
    setExportLoading(true);
    try {
      const params: ExportTourneesParams = {
        format: exportForm.format ?? 'xlsx',
        dateDebut: exportForm.dateDebut || undefined,
        dateFin: exportForm.dateFin || undefined,
        statut: exportForm.statut || undefined,
        collecteurId: exportForm.collecteurId || undefined,
        montantMin: exportForm.montantMin,
        montantMax: exportForm.montantMax,
      };
      const filename = await exportTournees(params);
      setExportModalOpen(false);
      toast.success(`Export téléchargé : ${filename}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Erreur lors de l\'export';
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  }, [exportForm]);

  if (loading) return <PageLoader />;

  const list = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tournées</h1>
          <p className="text-gray-500 mt-1">
            {hasActiveFilters ? `${list.length} tournée(s) (filtrées)` : `${total} tournée(s)`}
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
          <Button variant="secondary" onClick={handleExport} title="Exporter les tournées">
            <HiOutlineArrowDownTray className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                    {col.utilisateur
                      ? `${col.utilisateur.prenom || ''} ${col.utilisateur.nom || ''}`.trim() || col.codeCollecteur
                      : col.codeCollecteur}
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                <option value={StatutTournee.EN_COURS}>En cours</option>
                <option value={StatutTournee.TERMINEE}>Terminée</option>
                <option value={StatutTournee.ANNULEE}>Annulée</option>
              </select>
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
                placeholder="Ex: 500000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        </Card>
      )}

      {!list.length ? (
        <Card>
          <EmptyState
            title={hasActiveFilters ? 'Aucun résultat' : 'Aucune tournée'}
            description={
              hasActiveFilters
                ? 'Aucune tournée ne correspond aux critères. Modifiez les filtres.'
                : 'Les tournées de vos collecteurs apparaîtront ici.'
            }
            action={hasActiveFilters ? <Button onClick={clearFilters}>Réinitialiser les filtres</Button> : undefined}
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Collecteur</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Collectes</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((t) => (
                  <tr
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(AppRoutes.TOURNEE_DETAIL.replace(':id', t.id))}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(AppRoutes.TOURNEE_DETAIL.replace(':id', t.id))}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(t.dateTournee), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {t.collecteur?.utilisateur?.nom || t.collecteur?.codeCollecteur || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">{t.nombreCollectes}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
                      {Number(t.montantTotal).toLocaleString('fr-FR')} XAF
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          t.statut === StatutTournee.EN_COURS
                            ? 'info'
                            : t.statut === StatutTournee.TERMINEE
                              ? 'success'
                              : 'danger'
                        }
                      >
                        {t.statut === StatutTournee.EN_COURS
                          ? 'En cours'
                          : t.statut === StatutTournee.TERMINEE
                            ? 'Terminée'
                            : 'Annulée'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={exportModalOpen}
        onClose={() => !exportLoading && setExportModalOpen(false)}
        title="Exporter les tournées"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choisissez le format et les filtres optionnels. Les données sont exportées depuis la base (jusqu'à 30 000
            lignes).
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
                { value: '', label: 'Toutes' },
                { value: StatutTournee.EN_COURS, label: 'En cours' },
                { value: StatutTournee.TERMINEE, label: 'Terminée' },
                { value: StatutTournee.ANNULEE, label: 'Annulée' },
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date tournée (début)"
              type="date"
              value={exportForm.dateDebut ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, dateDebut: e.target.value }))}
            />
            <Input
              label="Date tournée (fin)"
              type="date"
              value={exportForm.dateFin ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, dateFin: e.target.value }))}
            />
            <Input
              label="Montant total min (XAF)"
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
              label="Montant total max (XAF)"
              type="number"
              min={0}
              placeholder="Ex: 500000"
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
              {exportLoading ? 'Export en cours…' : "Télécharger l'export"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
