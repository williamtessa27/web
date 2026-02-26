import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineEye, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { collecteurApi, exportCollecteurs, zoneApi, agenceApi } from '@/core/api';
import type { ExportCollecteursParams } from '@/core/api';
import type { Zone, Agence, Collecteur, PaginatedResponse } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function CollecteursPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Collecteur> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterActif, setFilterActif] = useState<'' | 'true' | 'false'>('');
  const [filterZoneId, setFilterZoneId] = useState('');
  const [filterIdAgence, setFilterIdAgence] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportForm, setExportForm] = useState<ExportCollecteursParams>({
    format: 'xlsx',
    search: '',
    actif: undefined,
    zoneId: '',
    idAgence: '',
    dateDebut: '',
    dateFin: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      if (filterSearch.trim()) params.search = filterSearch.trim();
      if (filterActif === 'true') params.actif = true;
      if (filterActif === 'false') params.actif = false;
      if (filterZoneId) params.zoneId = filterZoneId;
      if (filterIdAgence) params.idAgence = filterIdAgence;
      if (filterDateFrom) params.dateDebut = filterDateFrom;
      if (filterDateTo) params.dateFin = filterDateTo;
      const res = await collecteurApi.list(params);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [
    filterSearch,
    filterActif,
    filterZoneId,
    filterIdAgence,
    filterDateFrom,
    filterDateTo,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (showFilters || exportModalOpen) {
      zoneApi.list().then(setZones).catch(() => setZones([]));
      agenceApi.list(true).then(setAgences).catch(() => setAgences([]));
    }
  }, [showFilters, exportModalOpen]);

  const hasActiveFilters =
    !!filterSearch.trim() ||
    !!filterActif ||
    !!filterZoneId ||
    !!filterIdAgence ||
    !!filterDateFrom ||
    !!filterDateTo;

  const clearFilters = () => {
    setFilterSearch('');
    setFilterActif('');
    setFilterZoneId('');
    setFilterIdAgence('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const handleExport = useCallback(() => setExportModalOpen(true), []);

  const handleExportSubmit = useCallback(async () => {
    setExportLoading(true);
    try {
      const params: ExportCollecteursParams = {
        format: exportForm.format ?? 'xlsx',
        search: exportForm.search || undefined,
        zoneId: exportForm.zoneId || undefined,
        idAgence: exportForm.idAgence || undefined,
        dateDebut: exportForm.dateDebut || undefined,
        dateFin: exportForm.dateFin || undefined,
      };
      if (exportForm.actif === true) params.actif = true;
      if (exportForm.actif === false) params.actif = false;
      const filename = await exportCollecteurs(params);
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
          <h1 className="text-2xl font-bold text-gray-900">Collecteurs</h1>
          <p className="text-gray-500 mt-1">
            {hasActiveFilters ? `${list.length} collecteur(s) (filtrés)` : `${total} collecteur(s) enregistré(s)`}
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
          <Button variant="secondary" onClick={handleExport} title="Exporter les collecteurs">
            <HiOutlineArrowDownTray className="h-4 w-4" />
            Exporter
          </Button>
          <Link to={AppRoutes.COLLECTEUR_CREATE}>
            <Button>
              <HiOutlinePlus className="h-4 w-4" /> Ajouter
            </Button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <Card className="bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Recherche (code, nom, email, tél.)</label>
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
              <select
                value={filterActif}
                onChange={(e) => setFilterActif((e.target.value as '' | 'true' | 'false') || '')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous (actifs par défaut)</option>
                <option value="true">Actifs uniquement</option>
                <option value="false">Inactifs uniquement</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Zone</label>
              <select
                value={filterZoneId}
                onChange={(e) => setFilterZoneId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Toutes</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Agence</label>
              <select
                value={filterIdAgence}
                onChange={(e) => setFilterIdAgence(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Toutes</option>
                {agences.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date création (début)</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date création (fin)</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
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
            title={hasActiveFilters ? 'Aucun résultat' : 'Aucun collecteur'}
            description={
              hasActiveFilters
                ? 'Aucun collecteur ne correspond aux critères. Modifiez les filtres.'
                : 'Commencez par créer un profil collecteur pour vos agents terrain.'
            }
            action={
              hasActiveFilters ? (
                <Button onClick={clearFilters}>Réinitialiser les filtres</Button>
              ) : (
                <Link to={AppRoutes.COLLECTEUR_CREATE}>
                  <Button>
                    <HiOutlinePlus className="h-4 w-4" /> Créer un collecteur
                  </Button>
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Téléphone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Zone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{c.codeCollecteur}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{c.utilisateur?.nom || '—'}</p>
                      <p className="text-xs text-gray-500">{c.utilisateur?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.utilisateur?.telephone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.zones?.length ? c.zones.map((z) => z.nom).join(', ') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={c.actif ? 'success' : 'danger'}>
                        {c.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(AppRoutes.COLLECTEUR_DETAIL.replace(':id', c.id))}
                          title="Voir le détail du collecteur"
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                        {c.utilisateur?.id && (
                          <Link
                            to={AppRoutes.UTILISATEUR_DETAIL.replace(':id', c.utilisateur.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            Fiche utilisateur
                          </Link>
                        )}
                      </div>
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
        title="Exporter les collecteurs"
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
              value={exportForm.actif === undefined ? '' : exportForm.actif ? 'true' : 'false'}
              onChange={(e) =>
                setExportForm((f) => ({
                  ...f,
                  actif: e.target.value === '' ? undefined : e.target.value === 'true',
                }))
              }
              options={[
                { value: '', label: 'Tous' },
                { value: 'true', label: 'Actifs uniquement' },
                { value: 'false', label: 'Inactifs uniquement' },
              ]}
            />
            <Select
              label="Zone"
              value={exportForm.zoneId ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, zoneId: e.target.value || undefined }))}
              options={[{ value: '', label: 'Toutes' }, ...zones.map((z) => ({ value: z.id, label: z.nom }))]}
            />
            <Select
              label="Agence"
              value={exportForm.idAgence ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, idAgence: e.target.value || undefined }))}
              options={[{ value: '', label: 'Toutes' }, ...agences.map((a) => ({ value: a.id, label: a.nom }))]}
            />
          </div>
          <Input
            label="Recherche (code, nom, email, téléphone)"
            placeholder="Filtrer par texte…"
            value={exportForm.search ?? ''}
            onChange={(e) => setExportForm((f) => ({ ...f, search: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date création (début)"
              type="date"
              value={exportForm.dateDebut ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, dateDebut: e.target.value }))}
            />
            <Input
              label="Date création (fin)"
              type="date"
              value={exportForm.dateFin ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, dateFin: e.target.value }))}
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
