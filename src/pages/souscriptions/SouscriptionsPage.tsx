import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineXCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { souscriptionApi } from '@/core/api';
import type { Souscription, PaginatedResponse } from '@/types';
import { StatutSouscription, RoleUtilisateur } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useAuthStore } from '@/core/store/auth.store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

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

  const loadData = useCallback(() => {
    setLoading(true);
    souscriptionApi.list({ limit: 50 }).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await souscriptionApi.cancel(id);
      toast.success('Souscription annulée.');
      loadData();
    } catch {
      toast.error('Impossible d\'annuler la souscription.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Souscriptions</h1>
          <p className="text-gray-500 mt-1">{data?.meta.total || 0} souscription(s)</p>
        </div>
        <Link to={AppRoutes.SOUSCRIPTION_CREATE}>
          <Button><HiOutlinePlus className="h-4 w-4" /> Nouvelle souscription</Button>
        </Link>
      </div>

      {!data?.data.length ? (
        <Card><EmptyState title="Aucune souscription" description="Inscrivez des clients à des plans de collecte." /></Card>
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
                {data.data.map((s) => {
                  const pct = s.montantCible > 0 ? Math.min(100, (Number(s.montantCollecte) / Number(s.montantCible)) * 100) : 0;
                  const st = statutMap[s.statut];
                  const canCancel = canCancelSouscription(user?.role) &&
                    (s.statut === StatutSouscription.EN_COURS || s.statut === StatutSouscription.EN_ATTENTE);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{s.codeSouscription}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => s.idClient && navigate(AppRoutes.CLIENT_DETAIL.replace(':id', s.idClient))}
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
                            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Badge variant={st.variant}>{st.label}</Badge></td>
                      {canCancelSouscription(user?.role) && (
                        <td className="px-6 py-4 text-right">
                          {canCancel ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCancel(s.id)}
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
    </div>
  );
}
