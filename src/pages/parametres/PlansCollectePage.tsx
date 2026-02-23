import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCalculator } from 'react-icons/hi2';
import { produitApi } from '@/core/api';
import type { Produit, SimulationEpargneResult } from '@/types';
import { TypeProduit } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

/** Types considérés comme plans de collecte (montants journaliers) */
const TYPES_PLANS_COLLECTE: TypeProduit[] = [
  TypeProduit.EPARGNE,
  TypeProduit.EPARGNE_BLOQUEE,
  TypeProduit.EPARGNE_PROGRAMMEE,
  TypeProduit.TONTINE,
  TypeProduit.LIBRE,
];

const typeBadge = (type: TypeProduit) => {
  const map: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'neutral' }> = {
    [TypeProduit.EPARGNE]: { label: 'Épargne', variant: 'info' },
    [TypeProduit.EPARGNE_BLOQUEE]: { label: 'Épargne bloquée', variant: 'info' },
    [TypeProduit.EPARGNE_PROGRAMMEE]: { label: 'Épargne programmée', variant: 'info' },
    [TypeProduit.TONTINE]: { label: 'Tontine', variant: 'success' },
    [TypeProduit.LIBRE]: { label: 'Libre', variant: 'neutral' },
  };
  const { label, variant } = map[type] ?? { label: type, variant: 'neutral' as const };
  return <Badge variant={variant}>{label}</Badge>;
};

export default function PlansCollectePage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [produitToDelete, setProduitToDelete] = useState<Produit | null>(null);
  const [produitToSimulate, setProduitToSimulate] = useState<Produit | null>(null);
  const [simulation, setSimulation] = useState<SimulationEpargneResult | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const plansCollecte = useMemo(
    () => produits.filter((p) => TYPES_PLANS_COLLECTE.includes(p.type)),
    [produits],
  );

  const load = () => {
    setLoading(true);
    produitApi.list().then(setProduits).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSimuler = async (p: Produit) => {
    setProduitToSimulate(p);
    setSimulation(null);
    setSimulationLoading(true);
    try {
      const mj = Number(p.montantJournalier ?? 0);
      const duree = p.dureeJours ?? 31;
      const res = await produitApi.simulation(p.id, { montantJournalier: mj, dureeJours: duree });
      setSimulation(res);
    } catch {
      toast.error('Erreur lors de la simulation');
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!produitToDelete) return;
    setDeleting(true);
    try {
      await produitApi.delete(produitToDelete.id);
      toast.success('Plan supprimé.');
      setProduitToDelete(null);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data?.message
        ?? (e as { message?: string })?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.PARAMETRES}>
          <Button variant="ghost" size="sm">← Retour aux paramètres</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans de collecte</h1>
          <p className="text-gray-500 mt-1">
            Montants journaliers proposés aux clients (ex. collecte 1000 XAF, 2000 XAF). Ces plans sont utilisés lors des souscriptions et des collectes.
          </p>
        </div>
        <Link to={AppRoutes.PRODUIT_CREATE} state={{ returnTo: AppRoutes.PLANS_COLLECTE }}>
          <Button><HiOutlinePlus className="h-4 w-4" /> Créer un plan</Button>
        </Link>
      </div>

      {!plansCollecte.length ? (
        <Card>
          <EmptyState
            title="Aucun plan de collecte"
            description="Créez des plans pour définir les montants de collecte (1000 XAF/jour, 2000 XAF/jour, etc.)"
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plansCollecte.map((p) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{p.nom}</h3>
                    <div className="mt-1">{typeBadge(p.type)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      title="Simuler"
                      onClick={() => handleSimuler(p)}
                    >
                      <HiOutlineCalculator className="h-4 w-4" />
                    </Button>
                    <Link to={AppRoutes.PRODUIT_EDIT.replace(':id', p.id)} state={{ returnTo: AppRoutes.PLANS_COLLECTE }}>
                      <Button type="button" variant="secondary" size="sm" title="Modifier">
                        <HiOutlinePencilSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setProduitToDelete(p)}
                      title="Supprimer (impossible si des souscriptions sont liées)"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {p.description && <p className="text-sm text-gray-500 mb-4">{p.description}</p>}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Montant/jour</span><span className="font-medium">{Number(p.montantJournalier).toLocaleString('fr-FR')} XAF</span></div>
                  {p.dureeJours != null && p.dureeJours > 0 && <div className="flex justify-between"><span className="text-gray-500">Durée</span><span className="font-medium">{p.dureeJours} jours</span></div>}
                  {p.dureeBlocageJours != null && p.dureeBlocageJours > 0 && <div className="flex justify-between"><span className="text-gray-500">Blocage</span><span className="font-medium">{p.dureeBlocageJours} jours</span></div>}
                  {p.tauxInteret != null && p.tauxInteret > 0 && <div className="flex justify-between"><span className="text-gray-500">Taux intérêt</span><span className="font-medium">{p.tauxInteret} %</span></div>}
                  {p.objectifEpargne && <div className="flex justify-between"><span className="text-gray-500">Objectif</span><span className="font-medium truncate max-w-[120px]" title={p.objectifEpargne}>{p.objectifEpargne}</span></div>}
                  {p.montantCible != null && p.montantCible > 0 && <div className="flex justify-between"><span className="text-gray-500">Cible</span><span className="font-medium">{Number(p.montantCible).toLocaleString('fr-FR')} XAF</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Retenue fin de plan</span><span className="font-medium">{Number(p.fraisRetenue ?? 0).toLocaleString('fr-FR')} XAF</span></div>
                </div>
              </Card>
            ))}
          </div>

          <Modal
            open={produitToSimulate != null}
            onClose={() => { setProduitToSimulate(null); setSimulation(null); }}
            title={produitToSimulate ? `Simulation — ${produitToSimulate.nom}` : 'Simulation'}
            size="sm"
          >
            {simulationLoading ? (
              <p className="text-gray-500 text-sm py-4">Chargement...</p>
            ) : simulation ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Cotisations ({simulation.dureeJours} j × {simulation.montantJournalier.toLocaleString('fr-FR')})</span><span className="font-medium">{simulation.montantCotisations.toLocaleString('fr-FR')} XAF</span></div>
                {simulation.montantInterets > 0 && <div className="flex justify-between"><span className="text-gray-500">Intérêts ({simulation.tauxInteret}%)</span><span className="font-medium">{simulation.montantInterets.toLocaleString('fr-FR')} XAF</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Brut</span><span className="font-medium">{simulation.montantBrut.toLocaleString('fr-FR')} XAF</span></div>
                {simulation.fraisRetenue > 0 && <div className="flex justify-between"><span className="text-gray-500">Frais retenue</span><span className="font-medium">-{simulation.fraisRetenue.toLocaleString('fr-FR')} XAF</span></div>}
                <div className="flex justify-between pt-2 border-t"><span className="text-gray-700 font-medium">Net versé</span><span className="font-semibold">{simulation.montantNet.toLocaleString('fr-FR')} XAF</span></div>
                <p className="text-gray-500 text-xs mt-2">Date fin prévisionnelle : {new Date(simulation.dateFin).toLocaleDateString('fr-FR')}</p>
              </div>
            ) : produitToSimulate ? (
              <p className="text-gray-500 text-sm py-4">Erreur lors du chargement de la simulation.</p>
            ) : null}
          </Modal>

          <Modal
            open={produitToDelete != null}
            onClose={() => setProduitToDelete(null)}
            title="Supprimer le plan"
            size="sm"
          >
            <p className="text-gray-600 text-sm">
              Êtes-vous sûr de vouloir supprimer le plan <strong>{produitToDelete?.nom}</strong> ? Impossible si des souscriptions y sont liées.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="secondary" onClick={() => setProduitToDelete(null)}>Annuler</Button>
              <Button variant="danger" onClick={handleConfirmDelete} isLoading={deleting}>Supprimer</Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
