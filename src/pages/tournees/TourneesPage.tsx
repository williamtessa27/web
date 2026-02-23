import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { tourneeApi } from '@/core/api';
import type { Tournee, PaginatedResponse } from '@/types';
import { StatutTournee } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function TourneesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Tournee> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tourneeApi.list({ limit: 50 }).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tournées</h1>
        <p className="text-gray-500 mt-1">Suivi des tournées de collecte terrain</p>
      </div>

      {!data?.data.length ? (
        <Card><EmptyState title="Aucune tournée" description="Les tournées de vos collecteurs apparaîtront ici." /></Card>
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
                {data.data.map((t) => (
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
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.collecteur?.utilisateur?.nom || t.collecteur?.codeCollecteur || '—'}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">{t.nombreCollectes}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">{Number(t.montantTotal).toLocaleString('fr-FR')} XAF</td>
                    <td className="px-6 py-4">
                      <Badge variant={t.statut === StatutTournee.EN_COURS ? 'info' : t.statut === StatutTournee.TERMINEE ? 'success' : 'danger'}>
                        {t.statut === StatutTournee.EN_COURS ? 'En cours' : t.statut === StatutTournee.TERMINEE ? 'Terminée' : 'Annulée'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
