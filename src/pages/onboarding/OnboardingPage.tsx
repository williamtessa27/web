import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/core/store/auth.store';
import { entrepriseApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Select from '@/components/ui/Select';
import type { CompleteEntrepriseRequest } from '@/types';

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

export default function OnboardingPage() {
  const { user, setEntreprise } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CompleteEntrepriseRequest>({
    defaultValues: {
      devise: 'XAF',
      tauxCommissionDefaut: 5,
    },
  });

  // Validation step par step
  const nextStep = async () => {
    const fieldsToValidate: Record<number, (keyof CompleteEntrepriseRequest)[]> = {
      1: ['nom', 'telephone', 'secteurActivite'],
      2: ['ville', 'pays'],
    };
    const isValid = await trigger(fieldsToValidate[step]);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: CompleteEntrepriseRequest) => {
    setIsLoading(true);
    try {
      // Ne pas envoyer les champs optionnels vides (évite erreur ISO 8601 sur date)
      const payload = { ...data } as CompleteEntrepriseRequest;
      if (payload.dateCreationEntreprise === '') delete payload.dateCreationEntreprise;
      const updated = await entrepriseApi.completeProfile(payload);
      setEntreprise(updated);
      toast.success('Profil entreprise complete avec succes !');
      navigate(AppRoutes.DASHBOARD);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err.message || 'Erreur lors de la mise a jour';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 text-white font-bold text-lg shadow-md">
            C
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Kimifinance</h1>
            <p className="text-xs text-gray-500">Configuration de votre entreprise</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Informations generales</span>
            <span>Localisation</span>
            <span>Details complementaires</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 1 && 'Informations de votre entreprise'}
                {step === 2 && 'Localisation'}
                {step === 3 && 'Details complementaires'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {step === 1 && 'Ces informations permettront de configurer votre espace.'}
                {step === 2 && "Indiquez l'adresse et la localisation de votre entreprise."}
                {step === 3 && 'Informations optionnelles pour completer votre profil.'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Etape 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <Input
                    label="Nom de l'entreprise *"
                    placeholder="Ex: Ma Societe de Collecte SARL"
                    error={errors.nom?.message}
                    {...register('nom', { required: "Le nom de l'entreprise est requis" })}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="telephone"
                      control={control}
                      rules={{ required: 'Le telephone est requis' }}
                      render={({ field }) => (
                        <PhoneInput
                          label="Telephone *"
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
                  <Select
                    label="Secteur d'activite *"
                    error={errors.secteurActivite?.message}
                    {...register('secteurActivite', { required: "Le secteur d'activite est requis" })}
                  >
                    <option value="">Selectionnez un secteur</option>
                    {SECTEURS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                      rows={3}
                      placeholder="Decrivez brievement votre activite..."
                      {...register('description')}
                    />
                  </div>
                </div>
              )}

              {/* Etape 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <Input
                    label="Adresse"
                    placeholder="123 Rue de Bonanjo"
                    error={errors.adresse?.message}
                    {...register('adresse')}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  <Input
                    label="Code postal"
                    placeholder="BP 1234"
                    {...register('codePostal')}
                  />
                </div>
              )}

              {/* Etape 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="RCCM"
                      placeholder="RC/DLA/2020/B/1234"
                      {...register('rccm')}
                    />
                    <Input
                      label="Numero fiscal"
                      placeholder="M012345678"
                      {...register('numeroFiscal')}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Site web"
                      placeholder="https://monentreprise.com"
                      {...register('siteWeb')}
                    />
                    <Input
                      label="Nombre d'employes"
                      type="number"
                      placeholder="15"
                      {...register('nbrEmployes', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="Devise" {...register('devise')}>
                      {DEVISES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Taux commission par defaut (%)"
                      type="number"
                      placeholder="5"
                      {...register('tauxCommissionDefaut', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Minimum 0%' },
                        max: { value: 100, message: 'Maximum 100%' },
                      })}
                    />
                  </div>
                  <Input
                    label="Date de creation de l'entreprise"
                    type="date"
                    {...register('dateCreationEntreprise')}
                  />
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                {step > 1 ? (
                  <Button type="button" variant="secondary" onClick={prevStep}>
                    Precedent
                  </Button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Suivant
                  </Button>
                ) : (
                  <Button type="submit" isLoading={isLoading}>
                    Terminer la configuration
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
