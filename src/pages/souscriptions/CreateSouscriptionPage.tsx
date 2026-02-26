import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { souscriptionApi, clientApi, produitApi } from '@/core/api';
import type { Client, Produit, Souscription } from '@/types';
import type { PaginatedResponse } from '@/types';
import { TypeProduit } from '@/types/enums';
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

/** Types produit « épargne » : le client doit en plus être lié au module Épargne pour souscrire. */
const TYPES_PRODUIT_EPARGNE: TypeProduit[] = [
  TypeProduit.EPARGNE,
  TypeProduit.EPARGNE_BLOQUEE,
  TypeProduit.EPARGNE_PROGRAMMEE,
];

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
  const selectedProduitId = watch('idProduit');
  const selectedProduit = produits.find((p) => p.id === selectedProduitId);
  const isProduitEpargne = selectedProduit != null && TYPES_PRODUIT_EPARGNE.includes(selectedProduit.type as TypeProduit);

  // Charger les produits une fois au montage
  useEffect(() => {
    produitApi
      .list()
      .then((list) => setProduits(Array.isArray(list) ? list : []))
      .catch(() => toast.error('Erreur lors du chargement des produits'))
      .finally(() => setLoading(false));
  }, []);

  // Recharger les clients selon le produit sélectionné : si plan épargne, seuls les clients liés à l'épargne sont éligibles
  useEffect(() => {
    if (!selectedProduitId) {
      clientApi
        .list({ limit: 500, onlyWithAdhesionCollecte: true })
        .then((res) => setClients((res as PaginatedResponse<Client>)?.data ?? []))
        .catch(() => setClients([]));
      return;
    }
    const needEpargne = selectedProduit != null && TYPES_PRODUIT_EPARGNE.includes(selectedProduit.type as TypeProduit);
    const params = { limit: 500, onlyWithAdhesionCollecte: true, ...(needEpargne ? { onlyWithAdhesionEpargne: true } : {}) };
    clientApi
      .list(params)
      .then((res) => {
        const list = (res as PaginatedResponse<Client>)?.data ?? [];
        setClients(list);
        if (selectedClientId && !list.some((c: Client) => c.id === selectedClientId)) {
          setValue('idClient', '');
        }
      })
      .catch(() => setClients([]));
  }, [selectedProduitId, selectedProduit?.type, selectedClientId, setValue]);

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
        <p
          className="text-gray-500 mt-1"
          title="Pour un plan épargne, le client doit être lié au produit Collecte et au produit Épargne (fiche client → Produits / modules)."
        >
          Inscrivez un client à un plan de collecte (épargne, tontine, libre). Seuls les clients <strong>déjà liés au produit Collecte</strong> apparaissent ; pour un plan <strong>épargne</strong>, seuls ceux aussi liés au produit <strong>Épargne</strong> sont proposés. Liez les clients depuis la fiche client si besoin. La date de début par défaut est aujourd&apos;hui.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" title="La liste dépend du plan choisi : tous les clients Collecte, ou seulement ceux aussi liés à l'Épargne pour un plan épargne.">
                Client *
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                title={isProduitEpargne ? "Seuls les clients liés au produit Épargne peuvent souscrire à ce plan." : "Clients liés au produit Collecte."}
                {...register('idClient', { required: 'Sélectionnez un client' })}
              >
                <option value="">— Sélectionnez un client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom ? ` ${c.prenom}` : ''} ({c.codeClient})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500" title="Pour un plan épargne, le client doit en plus être lié au module Épargne dans la fiche client.">
                {isProduitEpargne
                  ? 'Uniquement les clients liés au Collecte et au produit Épargne (fiche client → Produits).'
                  : 'Uniquement les clients liés au produit Collecte (fiche client → Produits).'}
              </p>
              {!clients.length && !loading && (
                <p className="mt-1 text-sm text-amber-600" title="Lie d'abord le client au produit Collecte (et à l'Épargne si vous créez un plan épargne) dans la fiche client.">
                  {isProduitEpargne
                    ? "Aucun client lié au Collecte et à l'Épargne. Liez-les depuis la fiche client (Produits / modules)."
                    : "Aucun client lié au Collecte. Liez d'abord des clients au produit Collecte depuis la fiche client."}
                </p>
              )}
              {errors.idClient && (
                <p className="mt-1 text-sm text-red-600">{errors.idClient.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" title="Plans épargne (Épargne, Épargne bloquée, Épargne programmée) : réservés aux clients liés au module Épargne.">
                Produit / Plan *
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                title="En choisissant un plan épargne, la liste des clients se restreint à ceux liés à l'Épargne."
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
                <p className="mt-1 text-xs text-gray-500" title="Les plans déjà souscrits par ce client (statut en cours ou en attente) ne sont pas proposés.">
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
