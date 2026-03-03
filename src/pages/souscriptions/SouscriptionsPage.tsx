import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineXCircle, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { souscriptionApi, exportSouscriptions, clientApi, produitApi } from '@/core/api';
import type { ExportSouscriptionsParams } from '@/core/api';
import type { Client, Produit } from '@/types';
import type { Souscription, PaginatedResponse } from '@/types';
import { StatutSouscription, RoleUtilisateur } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useAuthStore } from '@/core/store/auth.store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const statutMap: Record<StatutSouscription, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  [StatutSouscription.EN_COURS]: { label: 'En cours', variant: 'info' },
  [StatutSouscription.TERMINEE]: { label: 'Terminée', variant: 'success' },
  [StatutSouscription.ANNULEE]: { label: 'Annulée', variant: 'danger' },
  [StatutSouscription.EN_ATTENTE]: { label: 'En attente', variant: 'warning' },
};

const canCancelSouscription = (role: string | undefined) =>
  role === RoleUtilisateur.SuperAdmin || role === RoleUtilisateur.AdminEntreprise;

export default function SouscriptionsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Souscription> | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterClientId, setFilterClientId] = useState('');
  const [filterProduitId, setFilterProduitId] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Souscription | null>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportForm, setExportForm] = useState<ExportSouscriptionsParams>({
    format: 'xlsx',
    clientId: '',
    produitId: '',
    statut: '',
    dateDebut: '',
    dateFin: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      if (filterClientId) params.clientId = filterClientId;
      if (filterProduitId) params.produitId = filterProduitId;
      if (filterStatut) params.statut = filterStatut;
      if (filterDateFrom) params.dateDebut = filterDateFrom;
      if (filterDateTo) params.dateFin = filterDateTo;
      const res = await souscriptionApi.list(params);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterClientId, filterProduitId, filterStatut, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (showFilters || exportModalOpen) {
      clientApi.list({ limit: 500 }).then((r) => setClients(r.data ?? [])).catch(() => setClients([]));
      produitApi.list().then(setProduits).catch(() => setProduits([]));
    }
  }, [showFilters, exportModalOpen]);

  const hasActiveFilters =
    !!filterClientId || !!filterProduitId || !!filterStatut || !!filterDateFrom || !!filterDateTo;

  const clearFilters = () => {
    setFilterClientId('');
    setFilterProduitId('');
    setFilterStatut('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const handleExport = useCallback(() => setExportModalOpen(true), []);

  const handleExportSubmit = useCallback(async () => {
    setExportLoading(true);
    try {
      const params: ExportSouscriptionsParams = {
        format: exportForm.format ?? 'xlsx',
        clientId: exportForm.clientId || undefined,
        produitId: exportForm.produitId || undefined,
        statut: exportForm.statut || undefined,
        dateDebut: exportForm.dateDebut || undefined,
        dateFin: exportForm.dateFin || undefined,
      };
      const filename = await exportSouscriptions(params);
      setExportModalOpen(false);
      toast.success(`Export téléchargé : ${filename}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Erreur lors de l\'export';
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  }, [exportForm]);

  const openCancelConfirm = (s: Souscription) => {
    setSubscriptionToCancel(s);
    setCancelConfirmOpen(true);
  };

  const closeCancelConfirm = () => {
    if (!cancellingId) {
      setCancelConfirmOpen(false);
      setSubscriptionToCancel(null);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await souscriptionApi.cancel(id);
      toast.success('Souscription annulée.');
      setCancelConfirmOpen(false);
      setSubscriptionToCancel(null);
      loadData();
    } catch {
      toast.error('Impossible d\'annuler la souscription.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmCancel = () => {
    if (subscriptionToCancel) handleCancel(subscriptionToCancel.id);
  };

  if (loading) return <PageLoader />;

  const list = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Souscriptions</h1>
          <p className="text-gray-500 mt-1">
            {hasActiveFilters
              ? `${list.length} souscription(s) (filtrées)`
              : `${total} souscription(s) aux plans de collecte (épargne, tontine, libre).`}
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
          <Button variant="secondary" onClick={handleExport} title="Exporter les souscriptions">
            <HiOutlineArrowDownTray className="h-4 w-4" />
            Exporter
          </Button>
          <Link to={AppRoutes.SOUSCRIPTION_CREATE}>
            <Button>
              <HiOutlinePlus className="h-4 w-4" /> Nouvelle souscription
            </Button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <Card className="bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Client</label>
              <select
                value={filterClientId}
                onChange={(e) => setFilterClientId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {[c.nom, c.prenom].filter(Boolean).join(' ') || c.codeClient}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Produit</label>
              <select
                value={filterProduitId}
                onChange={(e) => setFilterProduitId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                <option value={StatutSouscription.EN_COURS}>En cours</option>
                <option value={StatutSouscription.TERMINEE}>Terminée</option>
                <option value={StatutSouscription.ANNULEE}>Annulée</option>
                <option value={StatutSouscription.EN_ATTENTE}>En attente</option>
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
            title={hasActiveFilters ? 'Aucun résultat' : 'Aucune souscription'}
            description={
              hasActiveFilters
                ? 'Aucune souscription ne correspond aux critères. Modifiez les filtres.'
                : 'Inscrivez des clients à des plans de collecte.'
            }
            action={
              hasActiveFilters ? (
                <Button onClick={clearFilters}>Réinitialiser les filtres</Button>
              ) : (
                <Link to={AppRoutes.SOUSCRIPTION_CREATE}>
                  <Button>
                    <HiOutlinePlus className="h-4 w-4" /> Nouvelle souscription
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Produit</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Progression</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  {canCancelSouscription(user?.role) && (
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((s) => {
                  const pct =
                    s.montantCible > 0
                      ? Math.min(100, (Number(s.montantCollecte) / Number(s.montantCible)) * 100)
                      : 0;
                  const st = statutMap[s.statut];
                  const canCancel =
                    canCancelSouscription(user?.role) &&
                    (s.statut === StatutSouscription.EN_COURS || s.statut === StatutSouscription.EN_ATTENTE);
                  return (
                    <tr
                    key={s.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(AppRoutes.SOUSCRIPTION_DETAIL.replace(':id', s.id))}
                  >
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                        <span className="text-primary-600 hover:underline font-medium">{s.codeSouscription}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            s.idClient && navigate(AppRoutes.CLIENT_DETAIL.replace(':id', s.idClient));
                          }}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline text-left"
                        >
                          {s.client?.nom || '—'}
                          {s.client?.prenom ? ` ${s.client.prenom}` : ''}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.produit?.nom || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[120px]">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      {canCancelSouscription(user?.role) && (
                        <td className="px-6 py-4 text-right">
                          {canCancel ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); openCancelConfirm(s); }}
                              disabled={cancellingId === s.id}
                              isLoading={cancellingId === s.id}
                            >
                              <HiOutlineXCircle className="h-4 w-4" /> Annuler
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={cancelConfirmOpen}
        onClose={closeCancelConfirm}
        title="Confirmer l'annulation"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {subscriptionToCancel ? (
              <>
                Êtes-vous sûr de vouloir annuler la souscription{' '}
                <strong>{subscriptionToCancel.codeSouscription}</strong>
                {subscriptionToCancel.client?.nom || subscriptionToCancel.client?.prenom ? (
                  <> (client : {[subscriptionToCancel.client.nom, subscriptionToCancel.client.prenom].filter(Boolean).join(' ')})</>
                ) : null}
                ?
              </>
            ) : null}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeCancelConfirm} disabled={!!cancellingId}>
              Garder la souscription
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmCancel}
              disabled={!subscriptionToCancel || !!cancellingId}
              isLoading={!!cancellingId && subscriptionToCancel?.id === cancellingId}
            >
              Oui, annuler la souscription
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={exportModalOpen}
        onClose={() => !exportLoading && setExportModalOpen(false)}
        title="Exporter les souscriptions"
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
                { value: StatutSouscription.EN_COURS, label: 'En cours' },
                { value: StatutSouscription.TERMINEE, label: 'Terminée' },
                { value: StatutSouscription.ANNULEE, label: 'Annulée' },
                { value: StatutSouscription.EN_ATTENTE, label: 'En attente' },
              ]}
            />
            <Select
              label="Client"
              value={exportForm.clientId ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, clientId: e.target.value || undefined }))}
              options={[
                { value: '', label: 'Tous' },
                ...clients.map((c) => ({
                  value: c.id,
                  label: [c.nom, c.prenom].filter(Boolean).join(' ') || c.codeClient || c.id,
                })),
              ]}
            />
            <Select
              label="Produit"
              value={exportForm.produitId ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, produitId: e.target.value || undefined }))}
              options={[
                { value: '', label: 'Tous' },
                ...produits.map((p) => ({ value: p.id, label: p.nom })),
              ]}
            />
          </div>
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
