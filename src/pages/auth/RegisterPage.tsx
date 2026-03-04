import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/core/store/auth.store';
import { AppRoutes } from '@/config/routes.config';
import { useSEO } from '@/hooks/useSEO';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import type { RegisterRequest } from '@/types';

export default function RegisterPage() {
  useSEO({
    title: 'Créer un compte',
    description: 'Inscrivez votre entreprise sur Kimifinance et commencez à gérer vos collectes de paiements en temps réel.',
  });

  const { register: registerAction } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterRequest>();

  const motDePasse = watch('motDePasse');

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      await registerAction(data);
      toast.success('Inscription reussie ! Completez le profil de votre entreprise.');
      navigate(AppRoutes.ONBOARDING);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err.message || "Erreur lors de l'inscription";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12">
        <img
          src="/big2.png"
          alt="Kimifinance — Digitalisez votre collecte"
          className="max-h-[85vh] w-auto object-contain object-center"
        />
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          {/* Retour accueil */}
          <Link
            to={AppRoutes.HOME}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-600 transition-colors mb-8"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Retour a l'accueil
          </Link>

          {/* Logo */}
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

          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Creer votre compte
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Inscrivez votre entreprise et commencez en quelques minutes
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nom"
                placeholder="Votre nom"
                error={errors.nom?.message}
                {...register('nom', { required: 'Le nom est requis' })}
              />
              <Input
                label="Prenom"
                placeholder="Votre prenom"
                error={errors.prenom?.message}
                {...register('prenom', { required: 'Le prenom est requis' })}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: "L'email est requis",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email invalide',
                },
              })}
            />

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
              label="Mot de passe"
              type="password"
              placeholder="Minimum 8 caracteres"
              autoComplete="new-password"
              passwordToggle
              error={errors.motDePasse?.message}
              {...register('motDePasse', {
                required: 'Le mot de passe est requis',
                minLength: { value: 8, message: 'Minimum 8 caracteres' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: '1 majuscule, 1 minuscule et 1 chiffre requis',
                },
              })}
            />

            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="Confirmez votre mot de passe"
              autoComplete="new-password"
              passwordToggle
              error={errors.confirmMotDePasse?.message}
              {...register('confirmMotDePasse', {
                required: 'La confirmation est requise',
                validate: (value) =>
                  value === motDePasse || 'Les mots de passe ne correspondent pas',
              })}
            />

            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Creer mon compte
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Deja inscrit ?{' '}
            <Link
              to={AppRoutes.LOGIN}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
