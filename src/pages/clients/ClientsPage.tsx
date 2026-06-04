import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineEye } from 'react-icons/hi2';
import { clientApi, exportClients, zoneApi, agenceApi } from '@/core/api';
import type { ExportClientsParams } from '@/core/api';
import type { Zone, Agence } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useHasPermission } from '@/config/permissions';
import type { Client, PaginatedResponse } from '@/types';
import { StatutClient } from '@/types/enums';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const statutBadge = (statut?: StatutClient) => {
  switch (statut) {
    case StatutClient.EN_ATTENTE_VALIDATION: return <Badge variant="warning">En attente</Badge>;
    case StatutClient.ACTIF: return <Badge variant="success">Actif</Badge>;
    case StatutClient.SUSPENDU: return <Badge variant="warning">Suspendu</Badge>;
    case StatutClient.RESILIE: return <Badge variant="danger">Résilié</Badge>;
    default: return <Badge>{statut ?? 'Actif'}</Badge>;
  }
};

const STATUT_LABELS: Record<string, string> = {
  [StatutClient.EN_ATTENTE_VALIDATION]: 'En attente',
  [StatutClient.ACTIF]: 'Actif',
  [StatutClient.SUSPENDU]: 'Suspendu',
  [StatutClient.RESILIE]: 'Résilié',
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const canCreate = useHasPermission('canCreateClient');
  const canUpdate = useHasPermission('canUpdateClient');
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingActifId, setTogglingActifId] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [exportForm, setExportForm] = useState<ExportClientsParams & { actifFilter: '' | 'true' | 'false' }>({
    format: 'xlsx',
    dateDebut: '',
    dateFin: '',
    search: '',
    statut: '',
    actifFilter: '',
    zoneId: '',
    idAgence: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientApi.list({ limit: 200 });
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement des clients');
      setData(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (exportModalOpen) {
      zoneApi.list().then(setZones).catch(() => setZones([]));
      agenceApi.list(true).then(setAgences).catch(() => setAgences([]));
    }
  }, [exportModalOpen]);

  const handleToggleActif = async (c: Client) => {
    setTogglingActifId(c.id);
    try {
      const updated = await clientApi.update(c.id, { actif: !c.actif });
      setData((prev) =>
        prev
          ? { ...prev, data: prev.data.map((x) => (x.id === c.id ? { ...x, actif: updated.actif } : x)) }
          : null
      );
      toast.success(updated.actif ? 'Client activé.' : 'Client désactivé.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data?.message
        ?? (err as { message?: string })?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setTogglingActifId(null);
    }
  };

  const handleExport = useCallback(() => setExportModalOpen(true), []);

  const handleExportSubmit = useCallback(async () => {
    setExportLoading(true);
    try {
      const params: ExportClientsParams = {
        format: exportForm.format ?? 'xlsx',
        dateDebut: exportForm.dateDebut || undefined,
        dateFin: exportForm.dateFin || undefined,
        search: exportForm.search || undefined,
        statut: exportForm.statut || undefined,
        zoneId: exportForm.zoneId || undefined,
        idAgence: exportForm.idAgence || undefined,
      };
      if (exportForm.actifFilter === 'true') params.actif = true;
      if (exportForm.actifFilter === 'false') params.actif = false;
      const filename = await exportClients(params);
      setExportModalOpen(false);
      toast.success(`Export téléchargé : ${filename}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Erreur lors de l\'export';
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  }, [exportForm]);

  const columns = useMemo<DataTableColumn<Client>[]>(() => [
    {
      key: 'code',
      label: 'Code',
      render: (c) => <span className="font-mono text-gray-600">{c.codeClient}</span>,
      getSearchValue: (c) => c.codeClient ?? '',
    },
    {
      key: 'nom',
      label: 'Nom',
      render: (c) => (
        <div>
          <p className="font-medium text-gray-900">{c.nom}</p>
          {c.adresse && <p className="text-xs text-gray-500">{c.adresse}</p>}
        </div>
      ),
      getSearchValue: (c) => [c.nom, c.prenom, c.adresse].filter(Boolean).join(' '),
    },
    {
      key: 'prenom',
      label: 'Prénom',
      render: (c) => <span className="text-gray-700">{c.prenom || '—'}</span>,
      getSearchValue: (c) => c.prenom ?? '',
    },
    {
      key: 'email',
      label: 'Email',
      render: (c) => <span className="text-gray-600">{c.email || '—'}</span>,
      getSearchValue: (c) => c.email ?? '',
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (c) => statutBadge(c.statut),
      getSearchValue: (c) => STATUT_LABELS[c.statut ?? ''] ?? String(c.statut ?? ''),
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      render: (c) => <span className="text-gray-600">{c.telephone || '—'}</span>,
      getSearchValue: (c) => c.telephone ?? '',
    },
    {
      key: 'collecteur',
      label: 'Collecteur',
      render: (c) => <span className="text-gray-600">{c.collecteur?.codeCollecteur || '—'}</span>,
      getSearchValue: (c) => c.collecteur?.codeCollecteur ?? c.collecteur?.utilisateur?.nom ?? '',
    },
    {
      key: 'agence',
      label: 'Agence',
      render: (c) => <span className="text-gray-600">{c.agence?.nom || '—'}</span>,
      getSearchValue: (c) => c.agence?.nom ?? '',
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      render: (c) => (
        <span className="text-gray-600">
          {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy', { locale: fr }) : '—'}
        </span>
      ),
      getSearchValue: (c) =>
        c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy', { locale: fr }) : '',
    },
    {
      key: 'actif',
      label: 'Actif',
      align: 'center',
      render: (c) =>
        canUpdate ? (
          <button
            type="button"
            onClick={() => handleToggleActif(c)}
            disabled={togglingActifId === c.id}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              c.actif
                ? 'text-green-700 bg-green-50 hover:bg-green-100'
                : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
            } disabled:opacity-50`}
            title={c.actif ? 'Désactiver le client' : 'Activer le client'}
          >
            {togglingActifId === c.id ? '…' : c.actif ? 'Oui' : 'Non'}
          </button>
        ) : (
          <span className="text-gray-600">{c.actif ? 'Oui' : 'Non'}</span>
        ),
      getSearchValue: (c) => (c.actif ? 'Oui' : 'Non'),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (c) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.CLIENT_DETAIL.replace(':id', c.id))}
          title="Voir"
        >
          <HiOutlineEye className="h-4 w-4" />
        </Button>
      ),
    },
  ], [navigate, togglingActifId, canUpdate]);

  if (loading) return <PageLoader />;

  const clients = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">{total} client(s)</p>
        </div>
        {canCreate && (
          <Link to={AppRoutes.CLIENT_CREATE}>
            <Button><HiOutlinePlus className="h-4 w-4" /> Ajouter</Button>
          </Link>
        )}
      </div>

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun client"
            description="Ajoutez des clients pour commencer à enregistrer des collectes."
            action={canCreate ? <Link to={AppRoutes.CLIENT_CREATE}><Button><HiOutlinePlus className="h-4 w-4" /> Ajouter un client</Button></Link> : undefined}
          />
        </Card>
      ) : (
        <DataTable<Client>
          columns={columns}
          data={clients}
          idKey="id"
          storageKey="clients"
          searchPlaceholder="Rechercher…"
          pageSize={15}
          emptyTitle="Aucun client"
          emptyDescription="Ajoutez des clients pour commencer à enregistrer des collectes."
          emptyAction={canCreate ? <Link to={AppRoutes.CLIENT_CREATE}><Button size="sm">Ajouter un client</Button></Link> : undefined}
          onRefresh={load}
          refreshLabel="Actualiser la liste des clients"
          onExport={handleExport}
          exportLabel="Exporter la liste des clients"
        />
      )}

      <Modal
        open={exportModalOpen}
        onClose={() => !exportLoading && setExportModalOpen(false)}
        title="Exporter les clients"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choisissez le format et les filtres optionnels. Les données sont exportées directement depuis la base (jusqu’à 30 000 lignes).
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
                { value: StatutClient.EN_ATTENTE_VALIDATION, label: 'En attente' },
                { value: StatutClient.ACTIF, label: 'Actif' },
                { value: StatutClient.SUSPENDU, label: 'Suspendu' },
                { value: StatutClient.RESILIE, label: 'Résilié' },
              ]}
            />
            <Select
              label="Actif"
              value={exportForm.actifFilter}
              onChange={(e) => setExportForm((f) => ({ ...f, actifFilter: e.target.value as '' | 'true' | 'false' }))}
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
            label="Recherche (nom, prénom, code client)"
            placeholder="Filtrer par texte…"
            value={exportForm.search ?? ''}
            onChange={(e) => setExportForm((f) => ({ ...f, search: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date d'inscription (début)"
              type="date"
              value={exportForm.dateDebut ?? ''}
              onChange={(e) => setExportForm((f) => ({ ...f, dateDebut: e.target.value }))}
            />
            <Input
              label="Date d'inscription (fin)"
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
              {exportLoading ? 'Export en cours…' : 'Télécharger l\'export'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
