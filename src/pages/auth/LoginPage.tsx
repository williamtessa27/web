import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/core/store/auth.store';
import { isSuperAdmin } from '@/config/permissions';
import { AppRoutes } from '@/config/routes.config';
import { useSEO } from '@/hooks/useSEO';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';

type LoginMode = 'email' | 'telephone';

interface LoginForm {
  mode: LoginMode;
  email: string;
  telephone: string;
  motDePasse: string;
}

export default function LoginPage() {
  useSEO({ title: 'Connexion', description: 'Connectez-vous à votre espace Kimifinance pour gérer vos collectes et votre équipe.' });

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>('email');

  const { register, handleSubmit, control, formState: { errors } } = useForm<LoginForm>({
    defaultValues: {
      mode: 'email',
      email: '',
      telephone: '',
      motDePasse: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      if (mode === 'email') {
        await login({ email: data.email, motDePasse: data.motDePasse });
      } else {
        const telephone = (data.telephone || '').trim();
        if (!telephone) {
          toast.error('Veuillez saisir un numéro de téléphone valide');
          setIsLoading(false);
          return;
        }
        await login({ telephone, motDePasse: data.motDePasse });
      }
      const { user: u, entreprise: e } = useAuthStore.getState();
      toast.success('Connexion reussie');

      if (isSuperAdmin(u?.role)) {
        navigate(AppRoutes.SUPER_ADMIN_DASHBOARD);
      } else if (e && !e.profilComplete) {
        navigate(AppRoutes.ONBOARDING);
      } else {
        navigate(AppRoutes.DASHBOARD);
      }
    } catch (err: any) {
      toast.error(err.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToEmail = () => setMode('email');
  const switchToTelephone = () => setMode('telephone');

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          <Link
            to={AppRoutes.HOME}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-600 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Retour à l'accueil
          </Link>

          <Link to={AppRoutes.HOME} className="flex items-center gap-3 mb-10">
            <img
              src="/logo_collect.png"
              alt="Collect"
              className="h-12 w-12 object-contain shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kimifinance</h1>
              <p className="text-sm text-gray-500">par Kimistack</p>
            </div>
          </Link>

          <h2 className="text-xl font-semibold text-gray-900 mb-1">Content de vous revoir</h2>
          <p className="text-sm text-gray-500 mb-6">Connectez-vous avec votre email ou votre numéro de téléphone</p>

          {/* Choix du mode */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 mb-6">
            <button
              type="button"
              onClick={switchToEmail}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${mode === 'email' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={switchToTelephone}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${mode === 'telephone' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Téléphone
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {mode === 'email' ? (
              <Input
                label="Email"
                type="email"
                placeholder="votre@email.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email', { required: "L'email est requis" })}
              />
            ) : (
              <Controller
                name="telephone"
                control={control}
                rules={{ required: 'Le numéro est requis', minLength: { value: 10, message: 'Numéro trop court' } }}
                render={({ field }) => (
                  <PhoneInput
                    label="Numéro de téléphone"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.telephone?.message}
                    hint="Saisissez uniquement le numéro national (ex. 657780596)"
                  />
                )}
              />
            )}

            <Input
              label="Mot de passe"
              type="password"
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              passwordToggle
              error={errors.motDePasse?.message}
              {...register('motDePasse', {
                required: 'Le mot de passe est requis',
                minLength: { value: 6, message: 'Minimum 6 caractères' },
              })}
            />

            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Se connecter
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore inscrit ?{' '}
            <Link
              to={AppRoutes.REGISTER}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Creer un compte
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12">
        <img
          src="/user_customer.png"
          alt="Kimifinance — Espace client et collecte"
          className="max-h-[85vh] w-auto object-contain object-center"
        />
      </div>
    </div>
  );
}
