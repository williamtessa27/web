import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { produitApi } from '@/core/api';
import { TypeCalculCredit, TypeProduit } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useAuthStore } from '@/core/store/auth.store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import MoneyInput from '@/components/ui/MoneyInput';
import { formatXaf, parseMoneyInput } from '@/lib/money';

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
  montantMin: string;
  montantMax: string;
  dureeMinMois: string;
  dureeMaxMois: string;
  typeCalculCredit: TypeCalculCredit;
  tauxInteretCredit: string;
  penaliteRetardPourcent: string;
  dureeMaxJoursCredit: string;
}

const typeOptions: { value: TypeProduit; label: string }[] = [
  { value: TypeProduit.EPARGNE, label: 'Épargne' },
  { value: TypeProduit.EPARGNE_BLOQUEE, label: 'Épargne bloquée' },
  { value: TypeProduit.EPARGNE_PROGRAMMEE, label: 'Épargne programmée' },
  { value: TypeProduit.TONTINE, label: 'Tontine' },
  { value: TypeProduit.PRET, label: 'Prêt' },
  { value: TypeProduit.LIBRE, label: 'Libre' },
];

const parseDecimalInput = (value: string | number | null | undefined): number | undefined => {
  const normalized = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function CreateProduitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as {
    returnTo?: string;
    initialType?: TypeProduit;
    initialTypeCalculCredit?: TypeCalculCredit;
  } | null;
  const returnTo = routeState?.returnTo ?? AppRoutes.PRODUITS;
  const isPlanCollecte = returnTo === AppRoutes.PLANS_COLLECTE;
  const isInitialCreditProduct = routeState?.initialType === TypeProduit.PRET;
  const { entreprise } = useAuthStore();
  const minCotisation = Number(entreprise?.montantMinCotisationJournaliere ?? 0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProduitForm>({
    defaultValues: {
      type: isPlanCollecte ? TypeProduit.LIBRE : routeState?.initialType ?? TypeProduit.LIBRE,
      fraisRetenue: '0',
      montantCible: '',
      dureeJours: '',
      dureeBlocageJours: '',
      objectifEpargne: '',
      montantMin: '',
      montantMax: '',
      dureeMinMois: '',
      dureeMaxMois: '',
      typeCalculCredit: routeState?.initialTypeCalculCredit ?? TypeCalculCredit.AMORTI,
      tauxInteretCredit: '10',
      penaliteRetardPourcent: '2',
      dureeMaxJoursCredit: '30',
    },
  });

  const selectedType = watch('type');
  const selectedCalculCredit = watch('typeCalculCredit');
  const isCreditProduct = selectedType === TypeProduit.PRET;

  const onSubmit = async (data: CreateProduitForm) => {
    const payload = {
      nom: data.nom.trim(),
      description: data.description?.trim() || undefined,
      type: data.type,
      montantJournalier: data.type === TypeProduit.PRET ? 0 : parseMoneyInput(data.montantJournalier),
      ...(data.type !== TypeProduit.PRET && data.dureeJours ? { dureeJours: Number(data.dureeJours) } : {}),
      ...(data.type !== TypeProduit.PRET && data.montantCible ? { montantCible: parseMoneyInput(data.montantCible) } : {}),
      ...(data.type !== TypeProduit.PRET && data.fraisRetenue ? { fraisRetenue: parseMoneyInput(data.fraisRetenue) } : { fraisRetenue: 0 }),
      ...(data.dureeBlocageJours ? { dureeBlocageJours: Number(data.dureeBlocageJours) } : {}),
      ...(data.objectifEpargne?.trim() ? { objectifEpargne: data.objectifEpargne.trim() } : {}),
      ...(data.type === TypeProduit.PRET
        ? {
            ...(data.montantMin ? { montantMin: parseMoneyInput(data.montantMin) } : {}),
            ...(data.montantMax ? { montantMax: parseMoneyInput(data.montantMax) } : {}),
            ...(data.dureeMinMois ? { dureeMinMois: Number(data.dureeMinMois) } : {}),
            ...(data.dureeMaxMois ? { dureeMaxMois: Number(data.dureeMaxMois) } : {}),
            typeCalculCredit: data.typeCalculCredit,
            ...(data.tauxInteretCredit ? { tauxInteretCredit: parseDecimalInput(data.tauxInteretCredit) } : {}),
            ...(data.penaliteRetardPourcent ? { penaliteRetardPourcent: parseDecimalInput(data.penaliteRetardPourcent) } : {}),
            ...(data.dureeMaxJoursCredit ? { dureeMaxJoursCredit: Number(data.dureeMaxJoursCredit) } : {}),
          }
        : {}),
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
          {isPlanCollecte ? 'Nouveau plan de collecte' : isCreditProduct ? 'Nouveau produit crédit' : 'Nouveau produit'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isPlanCollecte
            ? 'Définissez le montant journalier à collecter (ex. 1000 XAF/jour, 2000 XAF/jour). Le collecteur récupère ce montant chez le client à chaque passage.'
            : isCreditProduct
              ? 'Définissez un produit de prêt avec ses plafonds, son mode de calcul, son taux, sa durée et ses pénalités.'
              : 'Définissez un plan de collecte (épargne, tontine, prêt ou libre). Le montant journalier et le type sont obligatoires.'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={isPlanCollecte ? 'Nom du plan de collecte *' : 'Nom du produit *'}
              placeholder={isPlanCollecte ? 'Ex: Collecte 1000 XAF' : 'Ex: Crédit 31 jours'}
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
                ) : isInitialCreditProduct ? (
                  <option value={TypeProduit.PRET}>Prêt</option>
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
          <input type="hidden" {...register('montantCible')} />
          <input type="hidden" {...register('fraisRetenue')} />
          <input type="hidden" {...register('montantMin')} />
          <input type="hidden" {...register('montantMax')} />

          {!isCreditProduct && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <MoneyInput
                  label="Montant journalier (XAF) *"
                  value={watch('montantJournalier')}
                  placeholder={minCotisation ? formatXaf(minCotisation).replace(' XAF', '') : '1 000'}
                  error={errors.montantJournalier?.message}
                  onChange={(value) => setValue('montantJournalier', value, { shouldDirty: true, shouldValidate: true })}
                />
                <input
                  type="hidden"
                  {...register('montantJournalier', {
                    required: isCreditProduct ? false : 'Obligatoire',
                    validate: (value) => {
                      if (isCreditProduct) return true;
                      const amount = parseMoneyInput(value);
                      if (amount == null) return 'Obligatoire';
                      if (amount < minCotisation) {
                        return minCotisation > 0
                          ? `Minimum ${formatXaf(minCotisation)} (montant min. cotisation journalière, Paramètres)`
                          : 'Doit être ≥ 0';
                      }
                      return true;
                    },
                  })}
                />
                {minCotisation > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum : {formatXaf(minCotisation)} (paramètre « Montant min. cotisation journalière »).
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
              <MoneyInput
                label="Montant cible (XAF, optionnel)"
                value={watch('montantCible')}
                placeholder="31 000"
                onChange={(value) => setValue('montantCible', value, { shouldDirty: true, shouldValidate: true })}
              />
            </div>
          )}

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

          {selectedType === TypeProduit.PRET && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-900">Paramètres crédit</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MoneyInput
                  label="Montant min (XAF)"
                  value={watch('montantMin')}
                  onChange={(value) => setValue('montantMin', value, { shouldDirty: true, shouldValidate: true })}
                />
                <MoneyInput
                  label="Montant max (XAF)"
                  value={watch('montantMax')}
                  onChange={(value) => setValue('montantMax', value, { shouldDirty: true, shouldValidate: true })}
                />
                <Input label="Durée min (mois)" type="number" min={1} step={1} {...register('dureeMinMois')} />
                <Input label="Durée max (mois)" type="number" min={1} step={1} {...register('dureeMaxMois')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de calcul</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    {...register('typeCalculCredit')}
                  >
                    <option value={TypeCalculCredit.AMORTI}>Amorti classique</option>
                    <option value={TypeCalculCredit.FORFAITAIRE_COURT_TERME}>Forfaitaire court terme</option>
                  </select>
                </div>
                <Input
                  label={selectedCalculCredit === TypeCalculCredit.FORFAITAIRE_COURT_TERME ? 'Intérêt forfaitaire (%)' : 'Taux intérêt annuel (%)'}
                  type="number"
                  min={0}
                  step={0.1}
                  {...register('tauxInteretCredit')}
                />
                <Input
                  label="Pénalité retard (% / jour)"
                  type="number"
                  min={0}
                  step={0.1}
                  {...register('penaliteRetardPourcent')}
                />
                <Input
                  label="Durée max court terme (jours)"
                  type="number"
                  min={1}
                  step={1}
                  disabled={selectedCalculCredit !== TypeCalculCredit.FORFAITAIRE_COURT_TERME}
                  {...register('dureeMaxJoursCredit')}
                />
              </div>
            </div>
          )}

          {!isCreditProduct && (
            <div className="max-w-md">
              <MoneyInput
                label="Montant retenu en fin de plan (XAF) — indicatif"
                value={watch('fraisRetenue')}
                placeholder="0"
                onChange={(value) => setValue('fraisRetenue', value, { shouldDirty: true, shouldValidate: true })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Retenue contractuelle à l&apos;échéance du plan (ex. 1 jour de cotisation). <strong>Ce champ est indicatif</strong> : la déduction réellement appliquée au retrait est le <strong>taux de commission</strong> défini dans Paramètres (%), commun à tous les produits. Laisser 0 si aucune retenue prévue.
              </p>
            </div>
          )}

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
