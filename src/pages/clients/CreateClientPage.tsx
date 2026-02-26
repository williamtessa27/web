import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientApi, collecteurApi, zoneApi, produitApi, agenceApi } from '@/core/api';
import type { CreateClientRequest, Collecteur, Zone, Produit, Agence } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useHasPermission } from '@/config/permissions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import ImageUpload from '@/components/ui/ImageUpload';
import NationaliteCombobox from '@/components/ui/NationaliteCombobox';
import { HiOutlinePlus } from 'react-icons/hi2';

const STEPS = [
  { id: 1, label: 'Identité' },
  { id: 2, label: 'Contact & Adresse' },
  { id: 3, label: "Pièce d'identité" },
  { id: 4, label: 'Référence & Assignation' },
  { id: 5, label: 'Produits' },
];

const GENRE_OPTIONS = [
  { value: 'MASCULIN', label: 'Masculin' },
  { value: 'FEMININ', label: 'Féminin' },
];

const SITUATION_OPTIONS = [
  { value: 'CELIBATAIRE', label: 'Célibataire' },
  { value: 'MARIE', label: 'Marié(e)' },
  { value: 'DIVORCE', label: 'Divorcé(e)' },
  { value: 'VEUF', label: 'Veuf(ve)' },
];

const TYPE_PIECE_OPTIONS = [
  { value: 'CNI', label: 'CNI' },
  { value: 'PASSEPORT', label: 'Passeport' },
  { value: 'AUTRE', label: 'Autre' },
];

const TYPE_CLIENT_OPTIONS = [
  { value: 'PERSONNE_PHYSIQUE', label: 'Personne physique' },
  { value: 'GROUPEMENT', label: 'Groupement' },
];

export default function CreateClientPage() {
  const navigate = useNavigate();
  const canCreate = useHasPermission('canCreateClient');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!canCreate) {
      navigate(AppRoutes.CLIENTS, { replace: true });
    }
  }, [canCreate, navigate]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [selectedProduitIds, setSelectedProduitIds] = useState<string[]>([]);
  const [creerAccesMobile, setCreerAccesMobile] = useState(false);
  const [loadingCollecteurs, setLoadingCollecteurs] = useState(false);
  const [loadingAgences, setLoadingAgences] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingProduits, setLoadingProduits] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<CreateClientRequest>();

  const stepFields: Record<number, (keyof CreateClientRequest)[]> = {
    1: ['nom', 'prenom'],
    2: ['telephone', 'email'],
    3: [],
    4: ['idAgence', 'idZone'],
    5: [],
  };

  useEffect(() => {
    const load = async () => {
      setLoadingCollecteurs(true);
      setLoadingAgences(true);
      setLoadingZones(true);
      setLoadingProduits(true);
      try {
        const [collecteursRes, agencesList, zonesList, produitsList] = await Promise.all([
          collecteurApi.list({ limit: 200 }),
          agenceApi.list(false),
          zoneApi.list(),
          produitApi.list().catch(() => []),
        ]);
        setCollecteurs(collecteursRes.data || []);
        setAgences(agencesList || []);
        setZones(zonesList || []);
        setProduits(Array.isArray(produitsList) ? produitsList.filter((p: Produit) => p.actif !== false) : []);
      } catch {
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoadingCollecteurs(false);
        setLoadingAgences(false);
        setLoadingZones(false);
        setLoadingProduits(false);
      }
    };
    load();
  }, []);

  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const nextStep = async () => {
    const fields = stepFields[step];
    const isValid = fields.length ? await trigger(fields) : true;
    if (!isValid) return;

    if (step === 2) {
      setCheckingAvailability(true);
      try {
        const { telephone, email } = getValues();
        const result = await clientApi.checkAvailability(telephone || '', email || '');
        if (!result.telephoneAvailable) {
          toast.error('Ce numéro de téléphone est déjà utilisé par un autre compte.');
          return;
        }
        if (!result.emailAvailable) {
          toast.error('Cette adresse email est déjà utilisée par un autre compte.');
          return;
        }
        setStep((s) => Math.min(s + 1, 5));
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string | string[] } }; message?: string })
            ?.response?.data?.message ||
          (err as { message?: string })?.message ||
          'Erreur lors de la vérification.';
        toast.error(Array.isArray(msg) ? msg[0] : msg);
      } finally {
        setCheckingAvailability(false);
      }
      return;
    }

    setStep((s) => Math.min(s + 1, 5));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleProduit = (id: string) => {
    setSelectedProduitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: CreateClientRequest) => {
    if (!data.idAgence) {
      toast.error("L'agence est obligatoire. Créez une agence si aucune n'existe.");
      return;
    }
    if (selectedProduitIds.length === 0) {
      toast.error('Sélectionnez au moins un produit pour ce client.');
      return;
    }
    if (creerAccesMobile && (!data.motDePasse || data.motDePasse.length < 8)) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères (majuscule, minuscule, chiffre).');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CreateClientRequest = {
        ...data,
        souscriptions: selectedProduitIds.map((idProduit) => ({ idProduit })),
      };
      if (!creerAccesMobile) delete payload.motDePasse;
      await clientApi.create(payload);
      toast.success(
        creerAccesMobile
          ? 'Client créé avec succès ! Le client peut se connecter à l\'app mobile avec son téléphone et le mot de passe défini.'
          : 'Client créé avec succès !'
      );
      navigate(AppRoutes.CLIENTS);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Erreur lors de la création du client';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={AppRoutes.CLIENTS}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Retour aux clients
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Créer un client</h1>
        <p className="text-gray-500 mt-1">Formulaire détaillé de création de client</p>
      </div>

      {/* Progress bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step >= s.id ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.id ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${step > s.id ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs text-gray-500">
          {STEPS.map((s) => (
            <span key={s.id} className={step === s.id ? 'text-primary-600 font-medium' : ''}>
              {s.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Form card */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1 - Identité (Sprint 9 : type Groupement) */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="typeClient"
                control={control}
                defaultValue="PERSONNE_PHYSIQUE"
                render={({ field }) => (
                  <Select
                    label="Type de client"
                    options={TYPE_CLIENT_OPTIONS}
                    value={field.value || 'PERSONNE_PHYSIQUE'}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              {getValues('typeClient') === 'GROUPEMENT' && (
                <Input
                  label="Nombre de membres"
                  type="number"
                  min={2}
                  placeholder="Ex: 5"
                  {...register('nombreMembres', { valueAsNumber: true, min: 2 })}
                />
              )}
              <Input
                label="Nom *"
                placeholder={getValues('typeClient') === 'GROUPEMENT' ? 'Nom du groupement' : 'Nom de famille'}
                error={errors.nom?.message}
                {...register('nom', { required: 'Le nom est requis' })}
              />
              <Input
                label={getValues('typeClient') === 'GROUPEMENT' ? 'Prénom (optionnel)' : 'Prénom *'}
                placeholder={getValues('typeClient') === 'GROUPEMENT' ? 'Prénom du contact' : 'Prénom'}
                error={errors.prenom?.message}
                {...register('prenom')}
              />
              <Select
                label="Genre"
                placeholder="Sélectionnez"
                error={errors.genre?.message}
                {...register('genre')}
              >
                {GENRE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Date de naissance"
                type="date"
                {...register('dateNaissance')}
              />
              <Input
                label="Lieu de naissance"
                placeholder="Ville ou pays"
                {...register('lieuNaissance')}
              />
              <Controller
                name="nationalite"
                control={control}
                render={({ field }) => (
                  <NationaliteCombobox
                    label="Nationalité"
                    placeholder="Rechercher ou sélectionner un pays..."
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              <Select
                label="Situation matrimoniale"
                placeholder="Sélectionnez"
                error={errors.situationMatrimoniale?.message}
                {...register('situationMatrimoniale')}
              >
                {SITUATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Profession"
                placeholder="Ex: Commerçant"
                {...register('profession')}
              />
            </div>
          )}

          {/* Step 2 - Contact & Adresse */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Controller
                    name="telephoneSecondaire"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        label="Téléphone secondaire"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Adresse email *"
                      type="email"
                      placeholder="email@exemple.com"
                      error={errors.email?.message}
                      {...register('email', {
                        required: "L'adresse email est obligatoire",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Adresse email invalide',
                        },
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Adresse</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Adresse"
                    placeholder="Adresse complète"
                    {...register('adresse')}
                  />
                  <Input
                    label="Ville"
                    placeholder="Ex: Douala"
                    {...register('ville')}
                  />
                  <Input
                    label="Quartier"
                    placeholder="Quartier"
                    {...register('quartier')}
                  />
                  <Controller
                    name="pays"
                    control={control}
                    render={({ field }) => (
                      <NationaliteCombobox
                        label="Pays"
                        placeholder="Rechercher ou sélectionner un pays..."
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
              {/* Accès app mobile */}
              <div className="pt-6 border-t border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={creerAccesMobile}
                    onChange={(e) => setCreerAccesMobile(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="font-medium text-gray-700">Créer un compte pour l&apos;app mobile</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Le client pourra se connecter à l&apos;application mobile avec son numéro de téléphone et le mot de passe ci-dessous.
                </p>
                {creerAccesMobile && (
                  <div className="mt-3 ml-6">
                    <Input
                      type="password"
                      passwordToggle
                      label="Mot de passe (accès mobile) *"
                      placeholder="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre"
                      error={errors.motDePasse?.message}
                      {...register('motDePasse', {
                        required: creerAccesMobile ? 'Le mot de passe est requis pour l\'accès mobile' : false,
                        minLength: { value: 8, message: 'Au moins 8 caractères' },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Une majuscule, une minuscule et un chiffre requis',
                        },
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 - Pièce d'identité */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Type de pièce d'identité"
                  placeholder="Sélectionnez"
                  error={errors.typePieceIdentite?.message}
                  {...register('typePieceIdentite')}
                >
                  {TYPE_PIECE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Numéro de pièce"
                  placeholder="Numéro"
                  {...register('numeroPieceIdentite')}
                />
                <Input
                  label="Date de délivrance"
                  type="date"
                  {...register('dateDelivrancePiece')}
                />
                <Input
                  label="Date d'expiration"
                  type="date"
                  {...register('dateExpirationPiece')}
                />
                <Input
                  label="Lieu de délivrance"
                  placeholder="Ville ou pays"
                  {...register('lieuDelivrancePiece')}
                />
              </div>
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Images de la pièce d&apos;identité</p>
                <p className="text-xs text-gray-500 mb-4">
                  Téléchargez les photos du recto et du verso de la pièce d&apos;identité sélectionnée (CNI, passeport, etc.). Ces documents sont importants pour la conformité.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recto (face avant)</label>
                    <Controller
                      name="pieceIdentiteRectoUrl"
                      control={control}
                      render={({ field }) => (
                        <ImageUpload
                          value={field.value ?? undefined}
                          onChange={(url) => field.onChange(url)}
                          editable
                          placeholderType="user"
                          placeholderText="Recto"
                          folder="collect_app/clients/piece_identite"
                          size="lg"
                          shape="square"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verso (face arrière)</label>
                    <Controller
                      name="pieceIdentiteVersoUrl"
                      control={control}
                      render={({ field }) => (
                        <ImageUpload
                          value={field.value ?? undefined}
                          onChange={(url) => field.onChange(url)}
                          editable
                          placeholderType="user"
                          placeholderText="Verso"
                          folder="collect_app/clients/piece_identite"
                          size="lg"
                          shape="square"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Référence & Assignation */}
          {step === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom personne de référence"
                placeholder="Nom complet"
                {...register('nomPersonneReference')}
              />
              <Controller
                name="telephonePersonneReference"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    label="Téléphone personne de référence"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Input
                label="Relation personne de référence"
                placeholder="Ex: Parent, conjoint"
                {...register('relationPersonneReference')}
              />
              <Input
                label="Adresse personne de référence"
                placeholder="Adresse"
                {...register('adressePersonneReference')}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Notes internes..."
                  {...register('notes')}
                />
              </div>
              <div className="md:col-span-2 flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Agence *"
                    placeholder={
                      loadingAgences
                        ? 'Chargement...'
                        : agences.length === 0
                          ? "Aucune agence — créez-en une"
                          : 'Sélectionnez une agence'
                    }
                    error={errors.idAgence?.message}
                    disabled={loadingAgences || agences.length === 0}
                    {...register('idAgence', {
                      required: "L'agence est obligatoire. Créez une agence si aucune n'existe.",
                    })}
                  >
                    <option value="">— Sélectionnez une agence —</option>
                    {agences.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nom}
                      </option>
                    ))}
                  </Select>
                </div>
                <Link
                  to={AppRoutes.AGENCES}
                  className="shrink-0 flex items-center gap-1 rounded-lg border border-primary-500 bg-primary-50 px-3 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                  title="Créer une agence"
                >
                  <HiOutlinePlus className="h-5 w-5" />
                  <span className="hidden sm:inline">Créer</span>
                </Link>
              </div>
              <Select
                label="Collecteur"
                placeholder={loadingCollecteurs ? 'Chargement...' : 'Sélectionnez un collecteur'}
                error={errors.idCollecteur?.message}
                disabled={loadingCollecteurs}
                {...register('idCollecteur')}
              >
                {collecteurs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codeCollecteur} {c.utilisateur ? `- ${c.utilisateur.nom} ${c.utilisateur.prenom}` : ''}
                  </option>
                ))}
              </Select>
              <Select
                label="Zone *"
                placeholder={loadingZones ? 'Chargement...' : 'Sélectionnez une zone'}
                error={errors.idZone?.message}
                disabled={loadingZones}
                {...register('idZone', { required: 'La zone est requise (le client doit appartenir à une zone).' })}
              >
                <option value="">— Sélectionnez une zone —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nom}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 md:col-span-2">
                Le client doit être rattaché à une agence. La zone détermine quels collecteurs pourront voir ce client dans l&apos;app mobile.
              </p>
            </div>
          )}

          {/* Step 5 - Produits (souscriptions) */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Sélectionnez un ou plusieurs produits que ce client devra collecter (montants journaliers). Le collecteur verra ces montants lors de la collecte.
              </p>
              {loadingProduits ? (
                <p className="text-gray-500">Chargement des produits...</p>
              ) : produits.length === 0 ? (
                <p className="text-amber-600">Aucun produit actif. Créez des produits dans les paramètres de l&apos;entreprise.</p>
              ) : (
                <ul className="space-y-2">
                  {produits.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`produit-${p.id}`}
                        checked={selectedProduitIds.includes(p.id)}
                        onChange={() => toggleProduit(p.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor={`produit-${p.id}`} className="flex-1 cursor-pointer">
                        <span className="font-medium text-gray-900">{p.nom}</span>
                        <span className="ml-2 text-gray-500">
                          — {Number(p.montantJournalier).toLocaleString('fr-FR')} FCFA/jour
                          {p.dureeJours ? ` • ${p.dureeJours} jours` : ''}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={prevStep}>
                Précédent
              </Button>
            ) : (
              <div />
            )}
            {step < 5 ? (
              <Button
                type="button"
                onClick={nextStep}
                isLoading={step === 2 && checkingAvailability}
                disabled={step === 2 && checkingAvailability}
              >
                Suivant
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting} disabled={selectedProduitIds.length === 0}>
                Créer le client
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
