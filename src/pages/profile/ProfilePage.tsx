import { useForm, Controller } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/core/store/auth.store';
import { utilisateurApi } from '@/core/api';
import { authApi, type SessionConnexion } from '@/core/api/auth.api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Card from '@/components/ui/Card';
import ImageUpload from '@/components/ui/ImageUpload';
import { RoleUtilisateur } from '@/types';
import type { Utilisateur } from '@/types';

const roleLabels: Record<string, string> = {
  [RoleUtilisateur.SuperAdmin]: 'Super Admin',
  [RoleUtilisateur.AdminEntreprise]: 'Admin Entreprise',
  [RoleUtilisateur.Directeur]: 'Directeur',
  [RoleUtilisateur.ChefAgence]: 'Chef d\'agence',
  [RoleUtilisateur.Gestionnaire]: 'Gestionnaire',
  [RoleUtilisateur.GestionnaireCredit]: 'Gestionnaire crédit',
  [RoleUtilisateur.Caissier]: 'Caissier',
  [RoleUtilisateur.Collecteur]: 'Collecteur',
  [RoleUtilisateur.Auditeur]: 'Auditeur',
  [RoleUtilisateur.Client]: 'Client',
};

type ProfileForm = Pick<
  Utilisateur,
  'nom' | 'prenom' | 'telephone' | 'adresse' | 'ville' | 'pays'
> & { email?: string };

type PasswordForm = {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, entreprise, setUser, logout } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [sessions, setSessions] = useState<SessionConnexion[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    defaultValues: {
      ancienMotDePasse: '',
      nouveauMotDePasse: '',
      confirmationMotDePasse: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        nom: user.nom ?? '',
        prenom: user.prenom ?? '',
        email: user.email ?? '',
        telephone: user.telephone ?? '',
        adresse: user.adresse ?? '',
        ville: user.ville ?? '',
        pays: user.pays ?? '',
      });
    }
  }, [user, reset]);

  useEffect(() => {
    setSessionsLoading(true);
    authApi
      .sessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  const onPhotoChange = async (url: string) => {
    if (!user?.id) return;
    try {
      const updated = await utilisateurApi.update(user.id, { photoProfilUrl: url });
      setUser(updated);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!user?.id) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        adresse: data.adresse || undefined,
        ville: data.ville || undefined,
        pays: data.pays || undefined,
      };
      const updated = await utilisateurApi.update(user.id, payload);
      setUser(updated);
      toast.success('Profil mis à jour.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err.message || 'Erreur lors de la mise à jour';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setIsChangingPassword(true);
    try {
      await authApi.changePassword(data);
      resetPassword();
      toast.success('Mot de passe modifié. Veuillez vous reconnecter.');
      logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors du changement du mot de passe';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  const initials = [user.nom?.charAt(0), user.prenom?.charAt(0)].filter(Boolean).join('').toUpperCase() || '?';
  const passwordMinLength = entreprise?.motDePasseLongueurMin ?? 8;
  const passwordRequiresSpecial = entreprise?.motDePasseExigerSpecial ?? false;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">
          Consultez et modifiez vos informations personnelles.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Bloc Identité */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-5">
            Identité
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
            <div className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-3">
              <ImageUpload
                value={user.photoProfilUrl}
                onChange={onPhotoChange}
                editable
                placeholderType="initials"
                placeholderText={initials}
                folder="collect_app/utilisateurs"
                size="lg"
                shape="circle"
              />
              <p className="text-sm text-gray-500 sm:text-left text-center">
                Cliquez sur la photo pour la modifier.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <Input
                label="Nom *"
                placeholder="Votre nom"
                error={errors.nom?.message}
                {...register('nom', { required: 'Le nom est requis' })}
              />
              <Input
                label="Prénom"
                placeholder="Votre prénom"
                {...register('prenom')}
              />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {roleLabels[user.role] ?? user.role}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Le rôle n&apos;est pas modifiable.
                </p>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@exemple.com"
                  disabled
                  {...register('email')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  L&apos;email de connexion n&apos;est pas modifiable depuis cette page.
                </p>
              </div>
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
                    className="sm:col-span-2"
                  />
                )}
              />
            </div>
          </div>
        </Card>

        {/* Bloc Adresse */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-5">
            Adresse
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Adresse"
              placeholder="Numéro, rue, quartier"
              className="sm:col-span-2"
              {...register('adresse')}
            />
            <Input
              label="Ville"
              placeholder="Ex. Douala"
              {...register('ville')}
            />
            <Input
              label="Pays"
              placeholder="Ex. Cameroun"
              {...register('pays')}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="sm:min-w-[140px]"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>

      {user.authMode !== 'CENTRAL' && <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-2">
          Sécurité
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Après modification, toutes vos sessions seront déconnectées et vous devrez vous reconnecter.
        </p>
        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
          <Input
            label="Mot de passe actuel"
            type="password"
            passwordToggle
            autoComplete="current-password"
            error={passwordErrors.ancienMotDePasse?.message}
            {...registerPassword('ancienMotDePasse', {
              required: 'Le mot de passe actuel est requis',
            })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nouveau mot de passe"
              type="password"
              passwordToggle
              autoComplete="new-password"
              error={passwordErrors.nouveauMotDePasse?.message}
              {...registerPassword('nouveauMotDePasse', {
                required: 'Le nouveau mot de passe est requis',
                minLength: {
                  value: passwordMinLength,
                  message: `Minimum ${passwordMinLength} caractères`,
                },
                validate: (value) => {
                  if (!/[A-Z]/.test(value)) return 'Ajoutez au moins une majuscule';
                  if (!/[a-z]/.test(value)) return 'Ajoutez au moins une minuscule';
                  if ((entreprise?.motDePasseExigerChiffre ?? true) && !/\d/.test(value)) {
                    return 'Ajoutez au moins un chiffre';
                  }
                  if (passwordRequiresSpecial && !/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~]/.test(value)) {
                    return 'Ajoutez au moins un caractère spécial';
                  }
                  if (value === watchPassword('ancienMotDePasse')) {
                    return 'Le nouveau mot de passe doit être différent';
                  }
                  return true;
                },
              })}
            />
            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              passwordToggle
              autoComplete="new-password"
              error={passwordErrors.confirmationMotDePasse?.message}
              {...registerPassword('confirmationMotDePasse', {
                required: 'La confirmation est requise',
                validate: (value) =>
                  value === watchPassword('nouveauMotDePasse')
                    || 'Les mots de passe ne correspondent pas',
              })}
            />
          </div>
          <p className="text-xs text-gray-500">
            Minimum {passwordMinLength} caractères, avec une majuscule, une minuscule
            {(entreprise?.motDePasseExigerChiffre ?? true) ? ', un chiffre' : ''}
            {passwordRequiresSpecial ? ' et un caractère spécial' : ''}.
          </p>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isChangingPassword}>
              Modifier le mot de passe
            </Button>
          </div>
        </form>
      </Card>}

      {/* Mes connexions (E8.2.3) */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-2">
          Mes connexions récentes
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Les 50 dernières connexions sur les 30 derniers jours. En cas de connexion inconnue, changez votre mot de passe.
        </p>
        {sessionsLoading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune connexion enregistrée.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">IP</th>
                  <th className="pb-2 font-medium">Appareil / navigateur</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      {format(parseISO(s.dateConnexion), "dd MMM yyyy HH:mm", { locale: fr })}
                    </td>
                    <td className="py-2 pr-4">{s.ip ?? '—'}</td>
                    <td className="py-2 truncate max-w-[200px]" title={s.userAgent ?? undefined}>
                      {s.userAgent ?? s.deviceInfo ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
