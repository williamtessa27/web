import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { depotAgenceApi, clientApi } from '@/core/api';
import type { Client, Souscription } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useAuthStore } from '@/core/store/auth.store';
import { StatutSouscription } from '@/types';
import { TypeProduit } from '@/types/enums';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const TYPES_EPARGNE: TypeProduit[] = [
  TypeProduit.EPARGNE,
  TypeProduit.EPARGNE_BLOQUEE,
  TypeProduit.EPARGNE_PROGRAMMEE,
];

export default function CreateDepotAgencePage() {
  const navigate = useNavigate();
  const { user, entreprise } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientDetail, setClientDetail] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSouscription, setSelectedSouscription] = useState<Souscription | null>(null);
  const [montant, setMontant] = useState<string>('');
  const [dateDepot, setDateDepot] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const entrepriseId = user?.idEntreprise ?? entreprise?.id;

  const souscriptionsEpargne = useMemo(() => {
    if (!clientDetail?.souscriptions) return [];
    const hasEpargne = clientDetail.adhesionsProduits?.some(
      (a) => a.typeModule === 'EPARGNE' && a.actif
    );
    return clientDetail.souscriptions.filter((s) => {
      if (s.statut !== StatutSouscription.EN_COURS) return false;
      const type = s.produit?.type as TypeProduit | undefined;
      if (type && TYPES_EPARGNE.includes(type)) return !!hasEpargne;
      return false;
    });
  }, [clientDetail?.souscriptions, clientDetail?.adhesionsProduits]);

  useEffect(() => {
    const load = async () => {
      if (!entrepriseId) {
        setLoading(false);
        toast.error('Contexte entreprise requis.');
        return;
      }
      try {
        const res = await clientApi.list({ limit: 500, onlyWithAdhesionEpargne: true });
        const data = (res as { data?: Client[] })?.data ?? [];
        setClients(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Erreur lors du chargement des clients');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entrepriseId]);

  useEffect(() => {
    if (!selectedClientId) {
      setClientDetail(null);
      setSelectedSouscription(null);
      setMontant('');
      setDateDepot(new Date().toISOString().slice(0, 10));
      return;
    }
    const loadClient = async () => {
      try {
        const c = await clientApi.get(selectedClientId);
        setClientDetail(c);
        setSelectedSouscription(null);
        setMontant('');
        const subs = (c.souscriptions ?? []).filter(
          (s) => s.statut === StatutSouscription.EN_COURS
        );
        const epargneSubs = subs.filter((s) => {
          const type = s.produit?.type as TypeProduit | undefined;
          const hasEpargne = c.adhesionsProduits?.some(
            (a) => a.typeModule === 'EPARGNE' && a.actif
          );
          return type && TYPES_EPARGNE.includes(type) && hasEpargne;
        });
        if (epargneSubs.length === 1) {
          setSelectedSouscription(epargneSubs[0]!);
          setMontant(
            String(Math.round(Number(epargneSubs[0]!.produit?.montantJournalier ?? 0)))
          );
        }
      } catch {
        setClientDetail(null);
      }
    };
    loadClient();
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedSouscription?.produit?.montantJournalier != null) {
      setMontant(
        String(Math.round(Number(selectedSouscription.produit.montantJournalier)))
      );
    }
  }, [selectedSouscription?.produit?.montantJournalier]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedSouscription) {
      toast.error('Veuillez sélectionner un client et un plan épargne.');
      return;
    }
    const montantNum = Number(montant);
    if (isNaN(montantNum) || montantNum < 1) {
      toast.error('Montant invalide (minimum 1 XAF).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Parameters<typeof depotAgenceApi.create>[0] = {
        idClient: selectedClientId,
        idSouscription: selectedSouscription.id,
        montant: montantNum,
        dateDepot,
      };
      if (user?.idAgence) payload.idAgence = user.idAgence;
      const result = await depotAgenceApi.create(payload);
      toast.success(
        `Dépôt enregistré. Solde client : ${result.soldeClient.toLocaleString('fr-FR')} XAF`
      );
      navigate(AppRoutes.DEPOT_AGENCE);
      setSelectedClientId('');
      setSelectedSouscription(null);
      setMontant('');
      setDateDepot(new Date().toISOString().slice(0, 10));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Erreur lors de l'enregistrement";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={AppRoutes.DASHBOARD}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Retour
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dépôt épargne guichet</h1>
        <p className="text-gray-500 mt-1">
          Enregistrer un dépôt d&apos;épargne en agence (sans collecteur). Seuls les clients liés au produit Épargne (fiche client → Produits) sont proposés. Client, plan épargne, montant et date.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <Select
            label="Client *"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            placeholder={loading ? 'Chargement...' : 'Sélectionnez un client'}
            disabled={loading}
          >
            <option value="">— Sélectionnez —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codeClient} — {c.nom} {c.prenom ?? ''}{' '}
                {c.telephone ? `(${c.telephone})` : ''}
              </option>
            ))}
          </Select>

          {souscriptionsEpargne.length > 0 && (
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                title="Les plans épargne ne sont proposés que si le client est lié au produit Épargne (fiche client → Produits)."
              >
                Plan épargne * 
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={selectedSouscription?.id ?? ''}
                onChange={(e) => {
                  const s = souscriptionsEpargne.find((sub) => sub.id === e.target.value);
                  setSelectedSouscription(s ?? null);
                }}
              >
                <option value="">— Sélectionnez —</option>
                {souscriptionsEpargne.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.produit?.nom ?? 'Produit'} — {Number(s.montantCollecte ?? 0).toLocaleString('fr-FR')} XAF collectés
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Seuls les clients liés au produit Épargne (fiche client → Produits) voient leurs plans épargne.
              </p>
            </div>
          )}

          {souscriptionsEpargne.length === 0 && selectedClientId && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Ce client n&apos;a pas de plan épargne en cours. Liez-le au produit Épargne et créez une souscription depuis la fiche client (Produits / modules).
            </p>
          )}

          {clients.length === 0 && !loading && (
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              Aucun client lié au produit Épargne. Liez les clients au produit Épargne depuis la fiche client (Produits / modules).
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Montant (XAF) *"
              type="number"
              min={1}
              step={1}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="1000"
              required
            />
            <Input
              label="Date du dépôt *"
              type="date"
              value={dateDepot}
              onChange={(e) => setDateDepot(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Link to={AppRoutes.DASHBOARD}>
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!selectedClientId || !selectedSouscription || !montant || Number(montant) < 1}
            >
              Enregistrer le dépôt
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
