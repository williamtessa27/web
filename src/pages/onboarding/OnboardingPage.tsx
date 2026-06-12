import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentArrowDown,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { useAuthStore } from '@/core/store/auth.store';
import {
  agenceApi,
  downloadClientsImportTemplate,
  entrepriseApi,
  importClientsFile,
  zoneApi,
} from '@/core/api';
import type { ImportClientsResult } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import Button from '@/components/ui/Button';
import CountryCitySelector from '@/components/ui/CountryCitySelector';
import ImageUpload from '@/components/ui/ImageUpload';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Select from '@/components/ui/Select';
import { buildE164, parseE164 } from '@/lib/phone';
import type { CompleteEntrepriseRequest } from '@/types';

type AgencyDraft = {
  nom: string;
  adresse: string;
  telephone: string;
};

type ZoneDraft = {
  nom: string;
  description: string;
  agencyIndex: string;
};

type ProfileDraft = {
  nom: string;
  telephone: string;
  emailContact: string;
  secteurActivite: string;
  description: string;
  adresse: string;
  ville: string;
  pays: string;
  logoUrl: string;
};

type ContextDraft = {
  hasCoreBanking: string;
  coreBankingName: string;
  migrationAssistanceRequested: string;
  declaredAgencyCount: string;
};

type OnboardingDraft = {
  version: 1;
  step: number;
  profile: ProfileDraft;
  context: ContextDraft;
  agencies: AgencyDraft[];
  zones: ZoneDraft[];
  updatedAt: string;
};

const STEPS = [
  'Profil',
  'Contexte',
  'Agences',
  'Clients',
] as const;

const ONBOARDING_DRAFT_VERSION = 1;

function cleanPayload<T extends object>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  ) as Partial<T>;
}

function normalizePhone(value: string): string {
  if (!value.trim()) return '';
  const { indicatif, national } = parseE164(value);
  return buildE164(indicatif, national);
}

function getOnboardingStorageKey(entrepriseId?: string) {
  return `collect-onboarding-draft:v${ONBOARDING_DRAFT_VERSION}:${entrepriseId || 'unknown'}`;
}

function readOnboardingDraft(storageKey: string): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;
    if (
      parsed.version !== ONBOARDING_DRAFT_VERSION ||
      !parsed.profile ||
      !parsed.context ||
      !Array.isArray(parsed.agencies) ||
      !Array.isArray(parsed.zones)
    ) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return parsed as OnboardingDraft;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export default function OnboardingPage() {
  const { entreprise, setEntreprise } = useAuthStore();
  const navigate = useNavigate();
  const storageKey = getOnboardingStorageKey(entreprise?.id);
  const draftCompletedRef = useRef(false);
  const [initialDraft] = useState(() => readOnboardingDraft(storageKey));
  const initialProfile: ProfileDraft = {
    nom: entreprise?.nom ?? '',
    telephone: entreprise?.telephone ?? '',
    emailContact: entreprise?.emailContact ?? '',
    secteurActivite: entreprise?.secteurActivite ?? '',
    description: entreprise?.description ?? '',
    adresse: entreprise?.adresse ?? '',
    ville: entreprise?.ville ?? '',
    pays: entreprise?.pays ?? '',
    logoUrl: entreprise?.logoUrl ?? '',
  };
  const initialContext: ContextDraft = {
    hasCoreBanking: entreprise?.hasCoreBanking ? 'yes' : '',
    coreBankingName: entreprise?.coreBankingName ?? '',
    migrationAssistanceRequested: entreprise?.migrationAssistanceRequested ? 'yes' : '',
    declaredAgencyCount: entreprise?.declaredAgencyCount ? String(entreprise.declaredAgencyCount) : '',
  };

  const [step, setStep] = useState(() =>
    Math.min(Math.max(initialDraft?.step ?? 0, 0), STEPS.length - 1),
  );
  const [isFinishing, setIsFinishing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportClientsResult | null>(null);

  const [profile, setProfile] = useState<ProfileDraft>(() => ({
    ...initialProfile,
    ...initialDraft?.profile,
  }));
  const [context, setContext] = useState<ContextDraft>(() => ({
    ...initialContext,
    ...initialDraft?.context,
  }));
  const [agencies, setAgencies] = useState<AgencyDraft[]>(() => initialDraft?.agencies ?? []);
  const [zones, setZones] = useState<ZoneDraft[]>(() => initialDraft?.zones ?? []);

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (draftCompletedRef.current) return;
      const draft: OnboardingDraft = {
        version: ONBOARDING_DRAFT_VERSION,
        step,
        profile,
        context,
        agencies,
        zones,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        // Le stockage peut être indisponible en navigation privée ou si son quota est atteint.
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [agencies, context, profile, step, storageKey, zones]);

  const addAgency = () => setAgencies((items) => [...items, { nom: '', adresse: '', telephone: '' }]);
  const removeAgency = (index: number) => {
    setAgencies((items) => items.filter((_, i) => i !== index));
    setZones((items) => items.filter((z) => z.agencyIndex !== String(index)));
  };
  const updateAgency = (index: number, patch: Partial<AgencyDraft>) =>
    setAgencies((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const addZone = () => setZones((items) => [...items, { nom: '', description: '', agencyIndex: '' }]);
  const removeZone = (index: number) => setZones((items) => items.filter((_, i) => i !== index));
  const updateZone = (index: number, patch: Partial<ZoneDraft>) =>
    setZones((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const handleDownloadTemplate = async () => {
    try {
      const filename = await downloadClientsImportTemplate();
      toast.success(`Modèle téléchargé : ${filename}`);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du téléchargement du modèle');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Sélectionnez un fichier Excel ou CSV.');
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await importClientsFile(importFile);
      setImportResult(result);
      if (result.failed > 0) {
        toast.error(`${result.imported} client(s) importé(s), ${result.failed} ligne(s) en échec.`);
      } else {
        toast.success(`${result.imported} client(s) importé(s).`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'import");
    } finally {
      setIsImporting(false);
    }
  };

  const saveOrganisationDrafts = async () => {
    const savedAgencyIds = new Map<number, string>();
    for (const [index, agency] of agencies.entries()) {
      const payload = cleanPayload(agency);
      if (!payload.nom) continue;
      try {
        const saved = await agenceApi.create(payload);
        savedAgencyIds.set(index, saved.id);
      } catch {
        toast.error(`Agence non créée : ${agency.nom}`);
      }
    }

    for (const zone of zones) {
      const payload = cleanPayload({
        nom: zone.nom,
        description: zone.description,
        idAgence: zone.agencyIndex ? savedAgencyIds.get(Number(zone.agencyIndex)) : undefined,
      });
      if (!payload.nom) continue;
      try {
        await zoneApi.create(payload);
      } catch {
        toast.error(`Zone non créée : ${zone.nom}`);
      }
    }
  };

  const finishOnboarding = async () => {
    setIsFinishing(true);
    try {
      await saveOrganisationDrafts();
      const payload = cleanPayload<CompleteEntrepriseRequest>({
        ...profile,
        telephone: normalizePhone(profile.telephone),
        hasCoreBanking: context.hasCoreBanking === 'yes',
        coreBankingName: context.coreBankingName,
        migrationAssistanceRequested: context.migrationAssistanceRequested === 'yes',
        declaredAgencyCount: context.declaredAgencyCount ? Number(context.declaredAgencyCount) : undefined,
      });
      const updated = await entrepriseApi.completeProfile(payload);
      setEntreprise(updated);
      draftCompletedRef.current = true;
      localStorage.removeItem(storageKey);
      toast.success('Configuration validée.');
      navigate(AppRoutes.DASHBOARD);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la validation');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
              <HiOutlineBuildingOffice2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Configuration entreprise</h1>
              <p className="text-xs text-gray-500">Préparez l’espace de travail, ou terminez sans renseigner ces éléments.</p>
            </div>
          </div>
          <Button variant="ghost" onClick={finishOnboarding} isLoading={isFinishing}>
            Terminer
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">Progression</span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <nav className="rounded-lg border border-gray-200 bg-white p-2">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  step === index ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs ring-1 ring-gray-200">
                  {index + 1}
                </span>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Profil de l’entreprise</h2>
                <p className="mt-1 text-sm text-gray-500">Ces informations restent modifiables depuis les paramètres.</p>
              </div>
              <div className="flex flex-col gap-6 md:flex-row">
                <ImageUpload
                  value={profile.logoUrl}
                  onChange={(logoUrl) => setProfile((p) => ({ ...p, logoUrl }))}
                  editable
                  placeholderType="logo"
                  folder="collect_app/entreprises"
                  size="lg"
                  shape="square"
                />
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="Nom" value={profile.nom} onChange={(e) => setProfile((p) => ({ ...p, nom: e.target.value }))} />
                  <PhoneInput
                    label="Téléphone"
                    value={profile.telephone}
                    onChange={(telephone) => setProfile((p) => ({ ...p, telephone }))}
                  />
                  <Input label="Email de contact" type="email" value={profile.emailContact} onChange={(e) => setProfile((p) => ({ ...p, emailContact: e.target.value }))} />
                  <Input label="Secteur" value={profile.secteurActivite} onChange={(e) => setProfile((p) => ({ ...p, secteurActivite: e.target.value }))} />
                  <CountryCitySelector
                    className="md:col-span-2"
                    country={profile.pays}
                    city={profile.ville}
                    onCountryChange={(pays) => setProfile((p) => ({ ...p, pays }))}
                    onCityChange={(ville) => setProfile((p) => ({ ...p, ville }))}
                  />
                </div>
              </div>
              <Input label="Adresse" value={profile.adresse} onChange={(e) => setProfile((p) => ({ ...p, adresse: e.target.value }))} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={profile.description}
                  onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Contexte métier</h2>
                <p className="mt-1 text-sm text-gray-500">Ces données aident l’équipe plateforme à accompagner l’entreprise.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="Application métier existante"
                  value={context.hasCoreBanking}
                  onChange={(e) => setContext((c) => ({ ...c, hasCoreBanking: e.target.value }))}
                  options={[
                    { value: '', label: 'Non renseigné' },
                    { value: 'yes', label: 'Oui' },
                    { value: 'no', label: 'Non' },
                  ]}
                />
                <Input
                  label="Nom de l’application"
                  value={context.coreBankingName}
                  onChange={(e) => setContext((c) => ({ ...c, coreBankingName: e.target.value }))}
                />
                <Input
                  label="Nombre d’agences déclaré"
                  type="number"
                  min={0}
                  value={context.declaredAgencyCount}
                  onChange={(e) => setContext((c) => ({ ...c, declaredAgencyCount: e.target.value }))}
                />
                <Select
                  label="Aide à la reprise des données"
                  value={context.migrationAssistanceRequested}
                  onChange={(e) => setContext((c) => ({ ...c, migrationAssistanceRequested: e.target.value }))}
                  options={[
                    { value: '', label: 'Non renseigné' },
                    { value: 'yes', label: 'Oui' },
                    { value: 'no', label: 'Non' },
                  ]}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Agences et zones</h2>
                  <p className="mt-1 text-sm text-gray-500">Créez les premiers rattachements, ou laissez cette étape vide.</p>
                </div>
                <Button type="button" variant="secondary" onClick={addAgency}>
                  <HiOutlinePlus className="h-4 w-4" />
                  Agence
                </Button>
              </div>

              <div className="space-y-3">
                {agencies.map((agency, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">Agence {index + 1}</p>
                      <button type="button" onClick={() => removeAgency(index)} className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Input label="Nom" value={agency.nom} onChange={(e) => updateAgency(index, { nom: e.target.value })} />
                      <Input label="Adresse" value={agency.adresse} onChange={(e) => updateAgency(index, { adresse: e.target.value })} />
                      <PhoneInput
                        label="Téléphone"
                        value={agency.telephone}
                        onChange={(telephone) => updateAgency(index, { telephone })}
                      />
                    </div>
                  </div>
                ))}
                {agencies.length === 0 && <p className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500">Aucune agence préparée.</p>}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Zones</h3>
                  <p className="text-sm text-gray-500">Une zone peut être rattachée à une agence créée ci-dessus.</p>
                </div>
                <Button type="button" variant="secondary" onClick={addZone}>
                  <HiOutlinePlus className="h-4 w-4" />
                  Zone
                </Button>
              </div>

              <div className="space-y-3">
                {zones.map((zone, index) => (
                  <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <Input label="Nom" value={zone.nom} onChange={(e) => updateZone(index, { nom: e.target.value })} />
                    <Input label="Description" value={zone.description} onChange={(e) => updateZone(index, { description: e.target.value })} />
                    <Select
                      label="Agence"
                      value={zone.agencyIndex}
                      onChange={(e) => updateZone(index, { agencyIndex: e.target.value })}
                      options={[
                        { value: '', label: 'Aucune' },
                        ...agencies.map((agency, i) => ({ value: String(i), label: agency.nom || `Agence ${i + 1}` })),
                      ]}
                    />
                    <button type="button" onClick={() => removeZone(index)} className="mt-6 rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {zones.length === 0 && <p className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500">Aucune zone préparée.</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Base clients</h2>
                  <p className="mt-1 text-sm text-gray-500">L’import peut être fait maintenant ou plus tard depuis la page Clients.</p>
                </div>
                <Button variant="secondary" onClick={handleDownloadTemplate}>
                  <HiOutlineDocumentArrowDown className="h-4 w-4" />
                  Modèle
                </Button>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Fichier Excel ou CSV</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] ?? null);
                    setImportResult(null);
                  }}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
                />
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleImport} isLoading={isImporting} disabled={!importFile}>
                    Importer
                  </Button>
                </div>
              </div>
              {importResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Lignes</p>
                      <p className="text-lg font-semibold text-gray-900">{importResult.totalRows}</p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-xs text-green-700">Réussies</p>
                      <p className="text-lg font-semibold text-green-800">{importResult.imported}</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs text-red-700">Échecs</p>
                      <p className="text-lg font-semibold text-red-800">{importResult.failed}</p>
                    </div>
                  </div>
                  {importResult.failures.length > 0 && (
                    <div className="max-h-48 overflow-auto rounded-lg border border-red-100">
                      {importResult.failures.slice(0, 20).map((failure) => (
                        <div key={failure.rowNumber} className="border-b border-red-50 p-3 last:border-b-0">
                          <p className="text-sm font-medium text-gray-900">Ligne {failure.rowNumber} {failure.identifier ? `- ${failure.identifier}` : ''}</p>
                          <p className="mt-1 text-xs text-red-700">{failure.errors.join(' ')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
            <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isFinishing}>
              <HiOutlineArrowLeft className="h-4 w-4" />
              Précédent
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={finishOnboarding} isLoading={isFinishing}>
                Terminer maintenant
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                  Suivant
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={finishOnboarding} isLoading={isFinishing}>
                  Aller au tableau de bord
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
