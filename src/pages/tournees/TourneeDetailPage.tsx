import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { tourneeApi, collecteApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import type { Tournee, Collecte, PaginatedResponse } from '@/types';
import { StatutTournee, StatutCollecte } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const statutTourneeBadge = (statut: StatutTournee) => {
  switch (statut) {
    case StatutTournee.EN_COURS:
      return <Badge variant="info">En cours</Badge>;
    case StatutTournee.TERMINEE:
      return <Badge variant="success">Terminée</Badge>;
    case StatutTournee.ANNULEE:
      return <Badge variant="danger">Annulée</Badge>;
    default:
      return <Badge>{statut}</Badge>;
  }
};

const statutCollecteBadge = (statut: StatutCollecte) => {
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

export default function TourneeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tournee, setTournee] = useState<Tournee | null>(null);
  const [collectes, setCollectes] = useState<PaginatedResponse<Collecte> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      tourneeApi.get(id),
      collecteApi.list({ tourneeId: id, limit: 100, sortBy: 'createdAt', sortOrder: 'DESC' }),
    ])
      .then(([t, c]) => {
        setTournee(t);
        setCollectes(c);
      })
      .catch(() => toast.error('Tournée introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !tournee) return <PageLoader />;

  const formatDate = (d: string) => format(new Date(d), 'dd MMM yyyy', { locale: fr });
  const formatDateTime = (d: string) => format(new Date(d), 'dd MMM yyyy HH:mm', { locale: fr });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.TOURNEES}>
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft className="h-4 w-4" /> Retour aux tournées
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Détail de la tournée</h1>
        <p className="text-gray-500 mt-1">
          {formatDate(tournee.dateTournee)} — {statutTourneeBadge(tournee.statut)}
        </p>
      </div>

      {/* Récap tournée */}
      <Card>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Date</dt>
            <dd className="mt-1 font-semibold text-gray-900">{formatDate(tournee.dateTournee)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Collecteur</dt>
            <dd className="mt-1 text-gray-900">
              {tournee.collecteur?.utilisateur?.nom || tournee.collecteur?.codeCollecteur || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Début</dt>
            <dd className="mt-1 text-gray-900">{formatDateTime(tournee.dateDebut)}</dd>
          </div>
          {tournee.dateFin && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Fin</dt>
              <dd className="mt-1 text-gray-900">{formatDateTime(tournee.dateFin)}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre de collectes</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">{tournee.nombreCollectes}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre de clients</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">{tournee.nombreClients}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Montant total</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">
              {Number(tournee.montantTotal).toLocaleString('fr-FR')} XAF
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Statut</dt>
            <dd className="mt-1">{statutTourneeBadge(tournee.statut)}</dd>
          </div>
        </dl>
      </Card>

      {/* Liste des collectes de cette tournée */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Collectes de cette tournée</h2>
        {!collectes?.data?.length ? (
          <Card>
            <EmptyState
              title="Aucune collecte"
              description="Aucune collecte enregistrée pour cette tournée."
            />
          </Card>
        ) : (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {collectes.data.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {c.client?.prenom && c.client?.nom
                          ? `${c.client.nom} ${c.client.prenom}`
                          : c.client?.nom || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(c.dateCollecte), 'dd MMM yyyy', { locale: fr })}
                        {c.heureCollecte && ` • ${c.heureCollecte.slice(0, 5)}`}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
                        {Number(c.montant).toLocaleString('fr-FR')} XAF
                      </td>
                      <td className="px-6 py-4">{statutCollecteBadge(c.statut)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={AppRoutes.COLLECTE_DETAIL.replace(':id', c.id)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
