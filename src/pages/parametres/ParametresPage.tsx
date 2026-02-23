import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/core/store/auth.store';
import { entrepriseApi } from '@/core/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import ImageUpload from '@/components/ui/ImageUpload';
import type { ParametresEntrepriseRequest } from '@/types';
import { FrequenceCollecte } from '@/types/enums';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const SECTEURS = [
  'Services financiers',
  'Microfinance',
  'Tontine / Cotisation',
  'Commerce general',
  'Agriculture',
  'Transport',
  'Telecoms',
  'Immobilier',
  'Assurance',
  'Autre',
];

const DEVISES = [
  { value: 'XAF', label: 'XAF - Franc CFA (CEMAC)' },
  { value: 'XOF', label: 'XOF - Franc CFA (UEMOA)' },
  { value: 'USD', label: 'USD - Dollar US' },
  { value: 'EUR', label: 'EUR - Euro' },
];

export default function ParametresPage() {
  const { entreprise: storeEntreprise, setEntreprise } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  /** Enregistre le logo dès la fin de l'upload (évite de perdre le logo si l'utilisateur actualise sans cliquer sur Enregistrer). */
  const saveLogoAfterUpload = async (url: string) => {
    const id = storeEntreprise?.id;
    if (!id || !url?.trim()) return;
    setSavingLogo(true);
    try {
      const updated = await entrepriseApi.update(id, { logoUrl: url });
      setEntreprise(updated);
      toast.success('Logo enregistré.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement du logo.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSavingLogo(false);
    }
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ParametresEntrepriseRequest & { logoUrl?: string }>({
    defaultValues: {
      logoUrl: '',
      modulesActives: ['COLLECTE', 'EPARGNE'] as string[],
      smsConfirmationCollecte: true,
      smsRappelEcheance: true,
      retentionKycAnnee: undefined as number | null | undefined,
      scoreSeuilCredit: undefined as number | null | undefined,
      devise: 'XAF',
      frequenceCollecte: FrequenceCollecte.QUOTIDIENNE,
      toleranceRetardJours: 0,
      validationCollecteManuelle: false,
      autoriserModificationCollecte: true,
      baseMensuelleCommission: 30000,
      tauxCommissionNormale: 3.33,
      tauxCommissionRetraitAnticipe: 5,
      dureeMinJoursAvantRetrait: 30,
      montantMinCotisationJournaliere: 1000,
    },
  });

  useEffect(() => {
    const id = storeEntreprise?.id;
    if (!id) {
      setLoading(false);
      return;
    }
    entrepriseApi
      .get(id)
      .then((e) => {
        if (import.meta.env.DEV && e.logoUrl === undefined) {
          console.warn('[Parametres] GET /entreprises/:id ne renvoie pas logoUrl. Vérifier que la migration AddLogoAndPhotoUrls a été exécutée (npm run migration:run dans backend).', e);
        }
        // Mettre à jour le store avec les données fraîches (dont logoUrl) pour sidebar et persistance
        setEntreprise(e);
        // Fallback logoUrl : priorité API, sinon store (évite disparition au rechargement)
        const logoUrl = e.logoUrl ?? storeEntreprise?.logoUrl ?? '';
        reset({
          nom: e.nom,
          telephone: e.telephone ?? '',
          emailContact: e.emailContact ?? '',
          secteurActivite: e.secteurActivite ?? '',
          description: e.description ?? '',
          adresse: e.adresse ?? '',
          ville: e.ville ?? '',
          pays: e.pays ?? '',
          codePostal: e.codePostal ?? '',
          rccm: e.rccm ?? '',
          numeroFiscal: e.numeroFiscal ?? '',
          siteWeb: e.siteWeb ?? '',
          logoUrl,
          couleurPrimaire: e.couleurPrimaire ?? '',
          couleurSecondaire: e.couleurSecondaire ?? '',
          nomCourt: e.nomCourt ?? '',
          slogan: e.slogan ?? '',
          nbrEmployes: e.nbrEmployes ?? undefined,
          dateCreationEntreprise: e.dateCreationEntreprise ?? '',
          devise: e.devise ?? 'XAF',
          frequenceCollecte: e.frequenceCollecte ?? FrequenceCollecte.QUOTIDIENNE,
          toleranceRetardJours: e.toleranceRetardJours ?? 0,
          validationCollecteManuelle: e.validationCollecteManuelle ?? false,
          autoriserModificationCollecte: e.autoriserModificationCollecte ?? true,
          baseMensuelleCommission: Number(e.baseMensuelleCommission) ?? 30000,
          tauxCommissionNormale: Number(e.tauxCommissionNormale) ?? 3.33,
          tauxCommissionRetraitAnticipe: Number(e.tauxCommissionRetraitAnticipe) ?? 5,
          dureeMinJoursAvantRetrait: Number(e.dureeMinJoursAvantRetrait) ?? 30,
          montantMinCotisationJournaliere: Number(e.montantMinCotisationJournaliere) ?? 1000,
          modulesActives: Array.isArray(e.modulesActives) ? e.modulesActives : ['COLLECTE', 'EPARGNE'],
          smsConfirmationCollecte: e.smsConfirmationCollecte ?? true,
          smsRappelEcheance: e.smsRappelEcheance ?? true,
          retentionKycAnnee: e.retentionKycAnnee ?? undefined,
          scoreSeuilCredit: e.scoreSeuilCredit ?? undefined,
        });
      })
      .catch(() => toast.error('Erreur lors du chargement des paramètres'))
      .finally(() => setLoading(false));
  }, [storeEntreprise?.id, reset, setEntreprise]);

  const onSubmit = async (data: ParametresEntrepriseRequest & { logoUrl?: string }) => {
    const id = storeEntreprise?.id;
    if (!id) return;
    setIsSubmitting(true);
    try {
      const payload = { ...data } as Record<string, unknown>;
      if (payload.dateCreationEntreprise === '') delete payload.dateCreationEntreprise;
      if (payload.logoUrl !== undefined) payload.logoUrl = payload.logoUrl || null;
      if (payload.retentionKycAnnee === '' || payload.retentionKycAnnee === undefined) payload.retentionKycAnnee = null;
      if (typeof payload.retentionKycAnnee === 'number' && (payload.retentionKycAnnee < 1 || payload.retentionKycAnnee > 30)) payload.retentionKycAnnee = null;
      if (payload.scoreSeuilCredit === '' || payload.scoreSeuilCredit === undefined) payload.scoreSeuilCredit = null;
      if (typeof payload.scoreSeuilCredit === 'number' && (payload.scoreSeuilCredit < 0 || payload.scoreSeuilCredit > 100)) payload.scoreSeuilCredit = null;
      const updated = await entrepriseApi.update(id, payload as Partial<import('@/types').Entreprise>);
      setEntreprise(updated);
      toast.success('Paramètres enregistrés.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err.message || 'Erreur lors de la mise à jour';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'entreprise</h1>
        <p className="text-gray-500 mt-1">
          Récapitulatif et modification des informations saisies lors de l'onboarding.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding (Sprint 12)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Personnalisez l&apos;apparence de votre IMF sur le web et l&apos;application mobile (logo, couleurs).
            </p>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Logo</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ce logo sera affiché dans l&apos;application (sidebar, profil) pour personnaliser l&apos;interface.
            </p>
            <Controller
              name="logoUrl"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={(url) => {
                    field.onChange(url);
                    saveLogoAfterUpload(url);
                  }}
                  editable
                  placeholderType="logo"
                  folder="collect_app/entreprises"
                  size="lg"
                  shape="square"
                  disabled={savingLogo}
                />
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur primaire</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-14 rounded border border-gray-300 cursor-pointer p-1"
                    value={watch('couleurPrimaire')?.replace(/^#?/, '#') || '#4A154B'}
                    onChange={(e) => setValue('couleurPrimaire', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-mono"
                    placeholder="#4A154B"
                    {...register('couleurPrimaire')}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Utilisée pour les boutons, liens et accents (mobile).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur secondaire</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-14 rounded border border-gray-300 cursor-pointer p-1"
                    value={watch('couleurSecondaire')?.replace(/^#?/, '#') || '#1264A3'}
                    onChange={(e) => setValue('couleurSecondaire', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-mono"
                    placeholder="#1264A3"
                    {...register('couleurSecondaire')}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Couleur complémentaire (accents secondaires).</p>
              </div>
              <Input
                label="Nom court (optionnel)"
                placeholder="Ex: Ma Microfinance"
                {...register('nomCourt')}
              />
              <Input
                label="Slogan (optionnel)"
                placeholder="Ex: Épargnez, investissez, grandissez"
                {...register('slogan')}
              />
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4 md:space-y-0">
              <Input
                label="Nom de l'entreprise *"
                placeholder="Ex: Ma Société de Collecte SARL"
                error={errors.nom?.message}
                {...register('nom', { required: "Le nom de l'entreprise est requis" })}
              />
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="telephone"
                  control={control}
                  rules={{ required: 'Le téléphone est requis' }}
                  render={({ field }) => (
                    <PhoneInput
                      label="Téléphone *"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.telephone?.message}
                    />
                  )}
                />
                <Input
                  label="Email de contact"
                  type="email"
                  placeholder="contact@entreprise.com"
                  error={errors.emailContact?.message}
                  {...register('emailContact')}
                />
              </div>
              <div className="md:col-span-2">
                <Select
                  label="Secteur d'activité *"
                  error={errors.secteurActivite?.message}
                  {...register('secteurActivite', { required: "Le secteur d'activité est requis" })}
                >
                  <option value="">Sélectionnez un secteur</option>
                  {SECTEURS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={3}
                  placeholder="Décrivez brièvement votre activité..."
                  {...register('description')}
                />
              </div>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Localisation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Adresse"
                placeholder="123 Rue de Bonanjo"
                error={errors.adresse?.message}
                {...register('adresse')}
              />
              <Input
                label="Ville *"
                placeholder="Douala"
                error={errors.ville?.message}
                {...register('ville', { required: 'La ville est requise' })}
              />
              <Input
                label="Pays *"
                placeholder="Cameroun"
                error={errors.pays?.message}
                {...register('pays', { required: 'Le pays est requis' })}
              />
              <Input
                label="Code postal"
                placeholder="BP 1234"
                {...register('codePostal')}
              />
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails complémentaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="RCCM"
                placeholder="RC/DLA/2020/B/1234"
                {...register('rccm')}
              />
              <Input
                label="Numéro fiscal"
                placeholder="M012345678"
                {...register('numeroFiscal')}
              />
              <Input
                label="Site web"
                placeholder="https://monentreprise.com"
                {...register('siteWeb')}
              />
              <Input
                label="Nombre d'employés"
                type="number"
                placeholder="15"
                {...register('nbrEmployes', { valueAsNumber: true })}
              />
              <div className="md:col-span-2">
                <Input
                  label="Date de création de l'entreprise"
                  type="date"
                  {...register('dateCreationEntreprise')}
                />
              </div>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Commissions et retraits (entreprise)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Commission prélevée sur le montant cotisé (même taux appliqué quel que soit le montant). Le collecteur n’a pas de commission.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Devise" {...register('devise')}>
                {DEVISES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Base mensuelle de référence"
                type="number"
                placeholder="30000"
                {...register('baseMensuelleCommission', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Minimum 0' },
                })}
              />
              <div>
                <Input
                  label="Taux commission normale (%)"
                  type="number"
                  step={0.01}
                  placeholder="3.33"
                  {...register('tauxCommissionNormale', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Minimum 0%' },
                    max: { value: 100, message: 'Maximum 100%' },
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pourcentage prélevé sur le montant du retrait lorsque le client retire <strong>après</strong> la durée minimale (retrait « normal »). Ex. 3,33 % : sur 10 000 XAF, 333 XAF de commission, 9 667 XAF versés au client.
                </p>
              </div>
              <div>
                <Input
                  label="Taux commission retrait anticipé (%)"
                  type="number"
                  step={0.01}
                  placeholder="5"
                  {...register('tauxCommissionRetraitAnticipe', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Minimum 0%' },
                    max: { value: 100, message: 'Maximum 100%' },
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pourcentage prélevé sur le montant du retrait lorsque le client retire <strong>avant</strong> la durée minimale (retrait anticipé). Souvent plus élevé que le taux normal. Ex. 5 % : sur 10 000 XAF, 500 XAF de commission.
                </p>
              </div>
              <div>
                <Input
                  label="Durée min. avant retrait (jours)"
                  type="number"
                  placeholder="30"
                  {...register('dureeMinJoursAvantRetrait', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'Minimum 1 jour' },
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  En dessous de cette durée (à partir de la souscription), le retrait est considéré comme anticipé : le <strong>taux retrait anticipé</strong> s&apos;applique. Au-dessus, c&apos;est le <strong>taux commission normale</strong>.
                </p>
              </div>
              <Input
                label="Montant min. cotisation journalière"
                type="number"
                placeholder="1000"
                {...register('montantMinCotisationJournaliere', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Minimum 0' },
                })}
              />
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Modules activés</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sélectionnez les modules proposés par votre IMF aux clients (application mobile). Les modules désactivés ne seront pas accessibles.
            </p>
            <div className="space-y-3">
              {(['COLLECTE', 'EPARGNE', 'CREDIT'] as const).map((code) => {
                const labels: Record<string, string> = {
                  COLLECTE: 'Collecte (cotisations, tournées, collecteurs)',
                  EPARGNE: 'Épargne (souscriptions, plans, demandes de retrait)',
                  CREDIT: 'Crédit (bientôt disponible)',
                };
                const active = (watch('modulesActives') ?? []).includes(code);
                return (
                  <label key={code} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={active}
                      onChange={(ev) => {
                        const curr = watch('modulesActives') ?? [];
                        const next = ev.target.checked
                          ? [...curr, code]
                          : curr.filter((m) => m !== code);
                        setValue('modulesActives', next);
                      }}
                    />
                    <span className="text-sm text-gray-700">{labels[code] ?? code}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Collecte</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Fréquence de collecte"
                {...register('frequenceCollecte')}
              >
                <option value={FrequenceCollecte.QUOTIDIENNE}>Quotidienne</option>
                <option value={FrequenceCollecte.HEBDOMADAIRE}>Hebdomadaire</option>
                <option value={FrequenceCollecte.LIBRE}>Libre</option>
              </Select>
              <Input
                label="Tolérance retard (jours)"
                type="number"
                placeholder="0"
                {...register('toleranceRetardJours', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Minimum 0' },
                })}
              />
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications SMS</h2>
            <p className="text-sm text-gray-500 mb-4">
              Activer l&apos;envoi de SMS aux clients (confirmation collecte, rappel échéance crédit). Nécessite la configuration Twilio côté serveur.
            </p>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={!!watch('smsConfirmationCollecte')}
                  {...register('smsConfirmationCollecte')}
                />
                <span className="text-sm text-gray-700">
                  SMS de confirmation de collecte (notifier le client à chaque collecte enregistrée ou validée)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={!!watch('smsRappelEcheance')}
                  {...register('smsRappelEcheance')}
                />
                <span className="text-sm text-gray-700">
                  SMS de rappel d&apos;échéance crédit (rappel la veille ou le jour de l&apos;échéance)
                </span>
              </label>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivage KYC (Sprint 13)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Durée de rétention des pièces d&apos;identité (années). Vide = pas de purge automatique. Utilisé pour la politique d&apos;archivage (voir docs/ARCHIVAGE_KYC.md).
            </p>
            <div className="max-w-xs">
              <Input
                type="number"
                min={1}
                max={30}
                placeholder="Ex. 5 ou vide"
                label="Rétention KYC (années)"
                {...register('retentionKycAnnee', {
                  setValueAs: (v) => (v === '' || v === undefined ? undefined : Number(v)),
                  min: { value: 1, message: 'Entre 1 et 30' },
                  max: { value: 30, message: 'Entre 1 et 30' },
                })}
              />
            </div>
            <p className="text-sm text-gray-500 mt-4 mb-2">Score minimum client pour octroi crédit (Sprint 11)</p>
            <div className="max-w-xs">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Ex. 50 ou vide"
                label="Seuil score crédit (0–100)"
                {...register('scoreSeuilCredit', {
                  setValueAs: (v) => (v === '' || v === undefined ? undefined : Number(v)),
                  min: { value: 0, message: 'Entre 0 et 100' },
                  max: { value: 100, message: 'Entre 0 et 100' },
                })}
              />
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Validation</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={!!watch('validationCollecteManuelle')}
                  {...register('validationCollecteManuelle')}
                />
                <span className="text-sm text-gray-700">
                  Validation manuelle des collectes (un gestionnaire doit valider ou rejeter chaque collecte)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={!!watch('autoriserModificationCollecte')}
                  {...register('autoriserModificationCollecte')}
                />
                <span className="text-sm text-gray-700">
                  Autoriser la modification des collectes après enregistrement
                </span>
              </label>
            </div>
          </section>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button type="submit" isLoading={isSubmitting}>
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
