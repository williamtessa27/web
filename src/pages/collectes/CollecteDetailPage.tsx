import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineXMark, HiOutlineDocumentArrowDown } from 'react-icons/hi2';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { collecteApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import type { Collecte } from '@/types';
import { StatutCollecte } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const statutBadge = (statut: StatutCollecte) => {
  switch (statut) {
    case StatutCollecte.VALIDEE: return <Badge variant="success">Validée</Badge>;
    case StatutCollecte.EN_ATTENTE: return <Badge variant="warning">En attente</Badge>;
    case StatutCollecte.REJETEE: return <Badge variant="danger">Rejetée</Badge>;
    case StatutCollecte.ANNULEE: return <Badge variant="danger">Annulée</Badge>;
    default: return <Badge>{statut}</Badge>;
  }
};

export default function CollecteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [collecte, setCollecte] = useState<Collecte | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingRecu, setDownloadingRecu] = useState(false);

  useEffect(() => {
    if (!id) return;
    collecteApi
      .get(id)
      .then(setCollecte)
      .catch(() => toast.error('Collecte introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleValider = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await collecteApi.valider(id);
      setCollecte(updated);
      toast.success('Collecte validée.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTelechargerRecu = async () => {
    if (!id) return;
    setDownloadingRecu(true);
    try {
      await collecteApi.getRecuPdf(id);
      toast.success('Reçu téléchargé.');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors du téléchargement');
    } finally {
      setDownloadingRecu(false);
    }
  };

  const handleRejeter = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await collecteApi.rejeter(id);
      setCollecte(updated);
      toast.success('Collecte rejetée.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !collecte) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.COLLECTES}>
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Détail de la collecte</h1>
        <p className="text-gray-500 mt-1">
          {format(new Date(collecte.dateCollecte), "dd MMMM yyyy", { locale: fr })} — {statutBadge(collecte.statut)}
        </p>
      </div>

      <Card>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Montant</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">
              {Number(collecte.montant).toLocaleString('fr-FR')} XAF
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Statut</dt>
            <dd className="mt-1">{statutBadge(collecte.statut)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Client</dt>
            <dd className="mt-1 text-gray-900">
              {collecte.client?.nom || '—'}
              {collecte.client?.codeClient ? ` (${collecte.client.codeClient})` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Collecteur</dt>
            <dd className="mt-1 text-gray-900">
              {collecte.collecteur?.utilisateur?.nom || collecte.collecteur?.codeCollecteur || '—'}
            </dd>
          </div>
          {collecte.note && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Note</dt>
              <dd className="mt-1 text-gray-700">{collecte.note}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handleTelechargerRecu}
            disabled={downloadingRecu}
            isLoading={downloadingRecu}
          >
            <HiOutlineDocumentArrowDown className="h-4 w-4" /> Télécharger le reçu
          </Button>
        {collecte.statut === StatutCollecte.EN_ATTENTE && (
          <>
            <Button
              variant="primary"
              onClick={handleValider}
              disabled={actionLoading}
              isLoading={actionLoading}
            >
              <HiOutlineCheck className="h-4 w-4" /> Valider
            </Button>
            <Button
              variant="danger"
              onClick={handleRejeter}
              disabled={actionLoading}
            >
              <HiOutlineXMark className="h-4 w-4" /> Rejeter
            </Button>
          </>
        )}
        </div>
      </Card>
    </div>
  );
}
