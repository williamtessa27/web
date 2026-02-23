import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { utilisateurApi, zoneApi, agenceApi } from '@/core/api';
import type { CreateCollecteurRequest, Zone, Agence } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

export default function CreateCollecteurPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [selectedAgenceId, setSelectedAgenceId] = useState<string>('');
  const [loadingZones, setLoadingZones] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCollecteurRequest>({
    defaultValues: { tauxCommission: 0 },
  });

  useEffect(() => {
    Promise.all([zoneApi.list(), agenceApi.list(true)])
      .then(([z, a]) => { setZones(z); setAgences(a ?? []); })
      .catch(() => toast.error('Erreur chargement des zones'))
      .finally(() => setLoadingZones(false));
  }, []);

  const toggleZone = (zoneId: string) => {
    setSelectedZoneIds((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    );
  };

  const onSubmit = async (data: CreateCollecteurRequest) => {
    setIsSubmitting(true);
    try {
      await utilisateurApi.createCollecteur({
        ...data,
        zoneIds: selectedZoneIds.length ? selectedZoneIds : undefined,
        idAgence: selectedAgenceId || undefined,
      });
      toast.success('Collecteur créé avec succès.');
      navigate(AppRoutes.COLLECTEURS);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la création';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={AppRoutes.COLLECTEURS}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Retour aux collecteurs
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau collecteur</h1>
        <p className="text-gray-500 mt-1">
          Créez un compte collecteur pour un agent terrain. Il pourra se connecter sur l'app mobile.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Identité</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom *"
                placeholder="Nom de famille"
                error={errors.nom?.message}
                {...register('nom', { required: 'Le nom est requis' })}
              />
              <Input
                label="Prénom *"
                placeholder="Prénom"
                error={errors.prenom?.message}
                {...register('prenom', { required: 'Le prénom est requis' })}
              />
              <Input
                label="Email *"
                type="email"
                placeholder="email@exemple.com"
                error={errors.email?.message}
                {...register('email', { required: "L'email est requis" })}
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
                label="Mot de passe *"
                type="password"
                passwordToggle
                placeholder="Min. 8 caractères, 1 maj, 1 min, 1 chiffre"
                error={errors.motDePasse?.message}
                {...register('motDePasse', {
                  required: 'Le mot de passe est requis',
                  minLength: { value: 8, message: 'Minimum 8 caractères' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Au moins une majuscule, une minuscule et un chiffre',
                  },
                })}
              />
              <Input label="Ville" placeholder="Ville" {...register('ville')} />
              <Input label="Adresse" placeholder="Adresse" {...register('adresse')} />
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Zones assignées</h2>
            <p className="text-sm text-gray-600 mb-3">
              Sélectionnez une ou plusieurs zones. Le collecteur verra tous les clients de ces zones dans l&apos;app mobile.
            </p>
            {loadingZones ? (
              <p className="text-gray-500">Chargement des zones...</p>
            ) : zones.length === 0 ? (
              <p className="text-amber-600">Aucune zone. Créez des zones dans les paramètres.</p>
            ) : (
              <ul className="space-y-2">
                {zones.map((z) => (
                  <li key={z.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`zone-${z.id}`}
                      checked={selectedZoneIds.includes(z.id)}
                      onChange={() => toggleZone(z.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor={`zone-${z.id}`} className="flex-1 cursor-pointer font-medium text-gray-900">
                      {z.nom}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-gray-500 mt-2">Le collecteur n&apos;a pas de commission ; il travaille pour l&apos;entreprise.</p>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Agence</h2>
            <Select
              label="Agence (optionnel)"
              value={selectedAgenceId}
              onChange={(e) => setSelectedAgenceId(e.target.value)}
            >
              <option value="">— Aucune —</option>
              {agences.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </Select>
          </section>

          <div className="flex justify-end gap-2 pt-4">
            <Link to={AppRoutes.COLLECTEURS}>
              <Button type="button" variant="secondary">
                Annuler
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Créer le collecteur
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
