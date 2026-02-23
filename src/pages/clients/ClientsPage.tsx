import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineEye } from 'react-icons/hi2';
import { clientApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import type { Client, PaginatedResponse } from '@/types';
import { StatutClient } from '@/types/enums';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/LoadingSpinner';

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
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingActifId, setTogglingActifId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientApi.list({ limit: 200 });
      setData(res);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const handleExport = useCallback(() => {
    toast('Export à venir', { icon: '📤' });
  }, []);

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
      render: (c) => (
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
  ], [navigate, togglingActifId]);

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
        <Link to={AppRoutes.CLIENT_CREATE}>
          <Button><HiOutlinePlus className="h-4 w-4" /> Ajouter</Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun client"
            description="Ajoutez des clients pour commencer à enregistrer des collectes."
            action={<Link to={AppRoutes.CLIENT_CREATE}><Button><HiOutlinePlus className="h-4 w-4" /> Ajouter un client</Button></Link>}
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
          emptyAction={<Link to={AppRoutes.CLIENT_CREATE}><Button size="sm">Ajouter un client</Button></Link>}
          onRefresh={load}
          refreshLabel="Actualiser la liste des clients"
          onExport={handleExport}
          exportLabel="Exporter la liste des clients"
        />
      )}
    </div>
  );
}
