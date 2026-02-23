import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { souscriptionApi, clientApi, produitApi } from '@/core/api';
import type { Client, Produit, Souscription } from '@/types';
import type { PaginatedResponse } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';

interface CreateSouscriptionForm {
  idClient: string;
  idProduit: string;
  dateDebut?: string;
}

/** Statuts considérés comme "souscription active" (on ne peut pas en recréer une pour le même produit). */
const SOUSCRIPTION_ACTIVE_STATUTS = ['EN_COURS', 'EN_ATTENTE'];

export default function CreateSouscriptionPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [souscriptionsDuClient, setSouscriptionsDuClient] = useState<Souscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSouscriptionForm>();

  const selectedClientId = watch('idClient');

  useEffect(() => {
    const load = async () => {
      try {
        const [clientsRes, produitsList] = await Promise.all([
          clientApi.list({ limit: 500 }),
          produitApi.list(),
        ]);
        setClients((clientsRes as PaginatedResponse<Client>)?.data ?? []);
        setProduits(Array.isArray(produitsList) ? produitsList : []);
      } catch {
        toast.error('Erreur lors du chargement des clients et produits');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setSouscriptionsDuClient([]);
      setValue('idProduit', '');
      return;
    }
    clientApi
      .get(selectedClientId)
      .then((c) => {
        const list = c?.souscriptions ?? [];
        setSouscriptionsDuClient(list.filter((s: Souscription) => SOUSCRIPTION_ACTIVE_STATUTS.includes(s.statut)));
      })
      .catch(() => setSouscriptionsDuClient([]));
  }, [selectedClientId, setValue]);

  const onSubmit = async (data: CreateSouscriptionForm) => {
    if (!data.idClient || !data.idProduit) {
      toast.error('Veuillez sélectionner un client et un produit.');
      return;
    }
    setIsSubmitting(true);
    try {
      await souscriptionApi.create({
        idClient: data.idClient,
        idProduit: data.idProduit,
        ...(data.dateDebut ? { dateDebut: data.dateDebut } : {}),
      });
      toast.success('Souscription créée avec succès.');
      navigate(AppRoutes.SOUSCRIPTIONS);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data
          ?.message ?? (err as { message?: string }).message ?? 'Erreur lors de la création';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.SOUSCRIPTIONS}>
          <Button variant="ghost" size="sm">← Retour aux souscriptions</Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle souscription</h1>
        <p className="text-gray-500 mt-1">
          Inscrivez un client à un plan de collecte (produit). La date de début par défaut est aujourd&apos;hui.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...register('idClient', { required: 'Sélectionnez un client' })}
              >
                <option value="">— Sélectionnez un client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom ? ` ${c.prenom}` : ''} ({c.codeClient})
                  </option>
                ))}
              </select>
              {errors.idClient && (
                <p className="mt-1 text-sm text-red-600">{errors.idClient.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produit / Plan *</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...register('idProduit', { required: 'Sélectionnez un produit' })}
              >
                <option value="">— Sélectionnez un produit —</option>
                {produits
                  .filter((p) => p.actif !== false)
                  .filter((p) => !souscriptionsDuClient.some((s: Souscription) => s.idProduit === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} — {Number(p.montantJournalier).toLocaleString('fr-FR')} XAF/jour
                      {p.dureeJours ? `, ${p.dureeJours} j` : ''}
                    </option>
                  ))}
              </select>
              {souscriptionsDuClient.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Seuls les produits pas encore souscrits par ce client sont proposés.
                </p>
              )}
              {errors.idProduit && (
                <p className="mt-1 text-sm text-red-600">{errors.idProduit.message}</p>
              )}
            </div>
          </div>
          <div className="max-w-xs">
            <Input
              label="Date de début (optionnel)"
              type="date"
              {...register('dateDebut')}
            />
            <p className="text-xs text-gray-500 mt-1">Par défaut : aujourd&apos;hui</p>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Link to={AppRoutes.SOUSCRIPTIONS}>
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>Créer la souscription</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
