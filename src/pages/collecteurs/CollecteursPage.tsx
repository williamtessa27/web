import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineEye } from 'react-icons/hi2';
import { AppRoutes } from '@/config/routes.config';
import { collecteurApi } from '@/core/api';
import type { Collecteur, PaginatedResponse } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function CollecteursPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Collecteur> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await collecteurApi.list({ limit: 50 });
      setData(res);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collecteurs</h1>
          <p className="text-gray-500 mt-1">{data?.meta.total || 0} collecteur(s) enregistré(s)</p>
        </div>
        <Link to={AppRoutes.COLLECTEUR_CREATE}>
          <Button><HiOutlinePlus className="h-4 w-4" /> Ajouter</Button>
        </Link>
      </div>

      {!data?.data.length ? (
        <Card>
          <EmptyState
            title="Aucun collecteur"
            description="Commencez par créer un profil collecteur pour vos agents terrain."
            action={
              <Link to={AppRoutes.COLLECTEUR_CREATE}>
                <Button><HiOutlinePlus className="h-4 w-4" /> Créer un collecteur</Button>
              </Link>
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
                {data.data.map((c) => (
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
    </div>
  );
}
