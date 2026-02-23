import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { produitApi } from '@/core/api';
import type { Produit } from '@/types';
import { TypeProduit } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useAuthStore } from '@/core/store/auth.store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import type { SimulationEpargneResult } from '@/types';

interface EditProduitForm {
  nom: string;
  description: string;
  type: TypeProduit;
  dureeJours: string;
  montantCible: string;
  montantJournalier: string;
  fraisRetenue: string;
  dureeBlocageJours: string;
  tauxInteret: string;
  objectifEpargne: string;
  actif: boolean;
}

const typeOptions: { value: TypeProduit; label: string }[] = [
  { value: TypeProduit.EPARGNE, label: 'Épargne' },
  { value: TypeProduit.EPARGNE_BLOQUEE, label: 'Épargne bloquée' },
  { value: TypeProduit.EPARGNE_PROGRAMMEE, label: 'Épargne programmée' },
  { value: TypeProduit.TONTINE, label: 'Tontine' },
  { value: TypeProduit.PRET, label: 'Prêt' },
  { value: TypeProduit.LIBRE, label: 'Libre' },
];

export default function EditProduitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string })?.returnTo ?? AppRoutes.PRODUITS;
  const isPlanCollecte = returnTo === AppRoutes.PLANS_COLLECTE;
  const { entreprise } = useAuthStore();
  const minCotisation = Number(entreprise?.montantMinCotisationJournaliere ?? 0);
  const [produit, setProduit] = useState<Produit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulation, setSimulation] = useState<SimulationEpargneResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditProduitForm>();

  const selectedType = watch('type');

  useEffect(() => {
    if (!id) return;
    produitApi
      .get(id)
      .then((p) => {
        setProduit(p);
        reset({
          nom: p.nom,
          description: p.description ?? '',
          type: p.type ?? TypeProduit.EPARGNE,
          dureeJours: p.dureeJours != null ? String(p.dureeJours) : '',
          montantCible: p.montantCible != null ? String(p.montantCible) : '',
          montantJournalier: String(p.montantJournalier ?? ''),
          fraisRetenue: String(p.fraisRetenue ?? 0),
          dureeBlocageJours: p.dureeBlocageJours != null ? String(p.dureeBlocageJours) : '',
          tauxInteret: p.tauxInteret != null ? String(p.tauxInteret) : '0',
          objectifEpargne: p.objectifEpargne ?? '',
          actif: p.actif !== false,
        });
      })
      .catch(() => toast.error(returnTo === AppRoutes.PLANS_COLLECTE ? 'Plan introuvable' : 'Produit introuvable'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const handleSimulate = async () => {
    if (!id || !produit) return;
    setSimulating(true);
    setSimulation(null);
    try {
      const duree = produit.dureeJours ?? 31;
      const mj = Number(produit.montantJournalier ?? 0);
      const res = await produitApi.simulation(id, { montantJournalier: mj, dureeJours: duree });
      setSimulation(res);
    } catch {
      toast.error('Erreur simulation');
    } finally {
      setSimulating(false);
    }
  };

  const onSubmit = async (data: EditProduitForm) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await produitApi.update(id, {
        nom: data.nom.trim(),
        description: data.description?.trim() || undefined,
        type: data.type,
        dureeJours: data.dureeJours.trim() ? Number(data.dureeJours) : null,
        montantCible: data.montantCible.trim() ? Number(data.montantCible) : null,
        montantJournalier: Number(data.montantJournalier),
        fraisRetenue: Number(data.fraisRetenue),
        ...(data.dureeBlocageJours.trim() ? { dureeBlocageJours: Number(data.dureeBlocageJours) } : {}),
        ...(data.tauxInteret !== '' ? { tauxInteret: Number(data.tauxInteret) } : {}),
        ...(data.objectifEpargne?.trim() ? { objectifEpargne: data.objectifEpargne.trim() } : {}),
        actif: data.actif,
      });
      toast.success(isPlanCollecte ? 'Plan de collecte mis à jour.' : 'Produit mis à jour.');
      navigate(returnTo);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data
          ?.message ?? (err as { message?: string }).message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading || !produit) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={returnTo}>
          <Button variant="ghost" size="sm">← Retour</Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isPlanCollecte ? 'Modifier le plan de collecte' : 'Modifier le produit'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isPlanCollecte ? 'Modifiez le montant, la durée ou les autres paramètres du plan.' : 'Vous pouvez modifier le type, la durée, la cible et les autres champs ci-dessous.'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={isPlanCollecte ? 'Nom du plan de collecte *' : 'Nom du produit *'}
              placeholder="Ex: Épargne 31 jours"
              error={errors.nom?.message}
              {...register('nom', { required: 'Le nom est requis' })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...register('type', { required: 'Sélectionnez un type' })}
              >
                {isPlanCollecte ? (
                  <>
                    <option value={TypeProduit.LIBRE}>Collecte simple</option>
                    <option value={TypeProduit.EPARGNE}>Collecte vers épargne</option>
                    <option value={TypeProduit.EPARGNE_BLOQUEE}>Collecte épargne bloquée</option>
                    <option value={TypeProduit.EPARGNE_PROGRAMMEE}>Collecte épargne programmée</option>
                    <option value={TypeProduit.TONTINE}>Collecte tontine</option>
                  </>
                ) : (
                  typeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))
                )}
              </select>
              {isPlanCollecte && (
                <p className="text-xs text-gray-500 mt-1">
                  Collecte simple = dépôt régulier. Les types « épargne » ou « tontine » indiquent la finalité des fonds.
                </p>
              )}
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Durée (jours) — optionnel, vide si Libre"
              type="number"
              min={1}
              step={1}
              placeholder="Ex: 30"
              {...register('dureeJours')}
            />
            <Input
              label="Cible (XAF) — montant total visé, optionnel"
              type="number"
              min={0}
              step={1}
              placeholder="Ex: 30000"
              {...register('montantCible')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <Input
              label="Montant journalier (XAF) *"
              type="number"
              min={minCotisation}
              step={1}
              error={errors.montantJournalier?.message}
              {...register('montantJournalier', {
                required: 'Obligatoire',
                min: {
                  value: minCotisation,
                  message: minCotisation > 0
                    ? `Minimum ${minCotisation.toLocaleString('fr-FR')} XAF (montant min. cotisation journalière, Paramètres)`
                    : 'Doit être ≥ 0',
                },
              })}
            />
            {minCotisation > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum : {minCotisation.toLocaleString('fr-FR')} XAF (paramètre « Montant min. cotisation journalière »).
              </p>
            )}
          </div>
          </div>

          <Input
            label="Description (optionnel)"
            placeholder="Brève description du plan"
            {...register('description')}
          />

          {(selectedType === 'EPARGNE_BLOQUEE' || selectedType === 'EPARGNE_PROGRAMMEE' || selectedType === 'EPARGNE') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedType === 'EPARGNE_BLOQUEE' && (
                <Input
                  label="Durée de blocage (jours)"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="90"
                  {...register('dureeBlocageJours')}
                />
              )}
              {(selectedType === 'EPARGNE_BLOQUEE' || selectedType === 'EPARGNE') && (
                <Input
                  label="Taux d'intérêt annuel (%)"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="0"
                  {...register('tauxInteret')}
                />
              )}
              {selectedType === 'EPARGNE_PROGRAMMEE' && (
                <Input
                  label="Objectif épargne"
                  placeholder="Ex: Scolarité, Mariage"
                  {...register('objectifEpargne')}
                />
              )}
            </div>
          )}

          <div>
            <Input
              label="Montant retenu en fin de plan (XAF) — indicatif"
              type="number"
              min={0}
              step={1}
              {...register('fraisRetenue', { min: { value: 0, message: 'Min. 0' } })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Retenue contractuelle à l&apos;échéance du plan. <strong>Indicatif</strong> : la déduction appliquée au retrait est le <strong>taux de commission</strong> (Paramètres), commun à tous les produits. 0 = aucune retenue prévue.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="actif"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              {...register('actif')}
            />
            <label htmlFor="actif" className="text-sm font-medium text-gray-700">Produit actif (visible dans les listes)</label>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <div>
              {produit.dureeJours != null && produit.dureeJours > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSimulate}
                  isLoading={simulating}
                >
                  Simuler l&apos;épargne
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Link to={returnTo}>
                <Button type="button" variant="secondary">Annuler</Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>{isPlanCollecte ? 'Enregistrer le plan' : 'Enregistrer'}</Button>
            </div>
          </div>
        </form>
      </Card>

      <Modal
        open={simulation != null}
        onClose={() => setSimulation(null)}
        title="Simulation épargne"
        size="sm"
      >
        {simulation && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Cotisations ({simulation.dureeJours} j × {simulation.montantJournalier.toLocaleString('fr-FR')})</span><span className="font-medium">{simulation.montantCotisations.toLocaleString('fr-FR')} XAF</span></div>
            {simulation.montantInterets > 0 && <div className="flex justify-between"><span className="text-gray-500">Intérêts ({simulation.tauxInteret}%)</span><span className="font-medium">{simulation.montantInterets.toLocaleString('fr-FR')} XAF</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Brut</span><span className="font-medium">{simulation.montantBrut.toLocaleString('fr-FR')} XAF</span></div>
            {simulation.fraisRetenue > 0 && <div className="flex justify-between"><span className="text-gray-500">Frais retenue</span><span className="font-medium">-{simulation.fraisRetenue.toLocaleString('fr-FR')} XAF</span></div>}
            <div className="flex justify-between pt-2 border-t"><span className="text-gray-700 font-medium">Net versé</span><span className="font-semibold">{simulation.montantNet.toLocaleString('fr-FR')} XAF</span></div>
            <p className="text-gray-500 text-xs mt-2">Date fin prévisionnelle : {new Date(simulation.dateFin).toLocaleDateString('fr-FR')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
