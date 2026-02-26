import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { produitApi } from '@/core/api';
import { TypeProduit } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useAuthStore } from '@/core/store/auth.store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface CreateProduitForm {
  nom: string;
  description: string;
  type: TypeProduit;
  montantJournalier: string;
  dureeJours: string;
  montantCible: string;
  fraisRetenue: string;
  dureeBlocageJours: string;
  objectifEpargne: string;
}

const typeOptions: { value: TypeProduit; label: string }[] = [
  { value: TypeProduit.EPARGNE, label: 'Épargne' },
  { value: TypeProduit.EPARGNE_BLOQUEE, label: 'Épargne bloquée' },
  { value: TypeProduit.EPARGNE_PROGRAMMEE, label: 'Épargne programmée' },
  { value: TypeProduit.TONTINE, label: 'Tontine' },
  { value: TypeProduit.PRET, label: 'Prêt' },
  { value: TypeProduit.LIBRE, label: 'Libre' },
];

export default function CreateProduitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string })?.returnTo ?? AppRoutes.PRODUITS;
  const isPlanCollecte = returnTo === AppRoutes.PLANS_COLLECTE;
  const { entreprise } = useAuthStore();
  const minCotisation = Number(entreprise?.montantMinCotisationJournaliere ?? 0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateProduitForm>({
    defaultValues: {
      type: TypeProduit.LIBRE,
      fraisRetenue: '0',
      montantCible: '',
      dureeJours: '',
      dureeBlocageJours: '',
      objectifEpargne: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: CreateProduitForm) => {
    const payload = {
      nom: data.nom.trim(),
      description: data.description?.trim() || undefined,
      type: data.type,
      montantJournalier: Number(data.montantJournalier),
      ...(data.dureeJours ? { dureeJours: Number(data.dureeJours) } : {}),
      ...(data.montantCible ? { montantCible: Number(data.montantCible) } : {}),
      ...(data.fraisRetenue ? { fraisRetenue: Number(data.fraisRetenue) } : { fraisRetenue: 0 }),
      ...(data.dureeBlocageJours ? { dureeBlocageJours: Number(data.dureeBlocageJours) } : {}),
      ...(data.objectifEpargne?.trim() ? { objectifEpargne: data.objectifEpargne.trim() } : {}),
    };
    try {
      await produitApi.create(payload);
      toast.success(isPlanCollecte ? 'Plan de collecte créé.' : 'Produit créé avec succès.');
      navigate(returnTo);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data
          ?.message ?? (err as { message?: string }).message ?? 'Erreur lors de la création';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={returnTo}>
          <Button variant="ghost" size="sm">← Retour</Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isPlanCollecte ? 'Nouveau plan de collecte' : 'Nouveau produit'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isPlanCollecte
            ? 'Définissez le montant journalier à collecter (ex. 1000 XAF/jour, 2000 XAF/jour). Le collecteur récupère ce montant chez le client à chaque passage.'
            : 'Définissez un plan de collecte (épargne, tontine, prêt ou libre). Le montant journalier et le type sont obligatoires.'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={isPlanCollecte ? 'Nom du plan de collecte *' : 'Nom du produit *'}
              placeholder={isPlanCollecte ? 'Ex: Collecte 1000 XAF' : 'Ex: Épargne 31 jours'}
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
                  Collecte simple = dépôt régulier. Les types « épargne » ou « tontine » indiquent la finalité des fonds (utilisés pour les produits microfinance).
                </p>
              )}
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
            </div>
          </div>

          <Input
            label="Description (optionnel)"
            placeholder="Brève description du plan"
            {...register('description')}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Montant journalier (XAF) *"
                type="number"
                min={minCotisation}
                step={1}
                placeholder={minCotisation ? String(minCotisation) : '1000'}
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
            <Input
              label="Durée (jours, optionnel)"
              type="number"
              min={1}
              step={1}
              placeholder="31"
              {...register('dureeJours', { min: { value: 1, message: 'Min. 1' } })}
            />
            <Input
              label="Montant cible (XAF, optionnel)"
              type="number"
              min={0}
              step={1}
              placeholder="31000"
              {...register('montantCible', { min: { value: 0, message: 'Min. 0' } })}
            />
          </div>

          {(selectedType === 'EPARGNE_BLOQUEE' || selectedType === 'EPARGNE_PROGRAMMEE' || selectedType === 'EPARGNE') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
              {selectedType === 'EPARGNE_BLOQUEE' && (
                <Input
                  label="Durée de blocage (jours)"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="90"
                  {...register('dureeBlocageJours', { min: { value: 1, message: 'Min. 1' } })}
                />
              )}
              {selectedType === 'EPARGNE_PROGRAMMEE' && (
                <Input
                  label="Objectif épargne"
                  placeholder="Ex: Scolarité, Mariage"
                  {...register('objectifEpargne')}
                />
              )}
              <p className="md:col-span-3 text-xs text-gray-500">
                Taux d&apos;intérêt, fréquence de collecte et pénalité retrait anticipé sont définis dans Paramètres (entreprise).
              </p>
            </div>
          )}

          <div className="max-w-md">
            <Input
              label="Montant retenu en fin de plan (XAF) — indicatif"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              {...register('fraisRetenue', { min: { value: 0, message: 'Min. 0' } })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Retenue contractuelle à l&apos;échéance du plan (ex. 1 jour de cotisation). <strong>Ce champ est indicatif</strong> : la déduction réellement appliquée au retrait est le <strong>taux de commission</strong> défini dans Paramètres (%), commun à tous les produits. Laisser 0 si aucune retenue prévue.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Link to={returnTo}>
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button type="submit">{isPlanCollecte ? 'Créer le plan de collecte' : 'Créer le produit'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
