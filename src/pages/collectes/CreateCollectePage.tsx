import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  collecteApi,
  clientApi,
  collecteurApi,
  type JoursCollectesResponse,
} from '@/core/api';
import { useAuthStore } from '@/core/store/auth.store';
import type { Client, Collecteur, Souscription, PaginatedResponse } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { StatutSouscription } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

type TypeCollecte = 'normal' | 'absent' | 'nonPaye';

export default function CreateCollectePage() {
  const navigate = useNavigate();
  const { user, entreprise } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [clientDetail, setClientDetail] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSouscription, setSelectedSouscription] = useState<Souscription | null>(null);
  const [typeCollecte, setTypeCollecte] = useState<TypeCollecte>('normal');
  const [dateCollecte, setDateCollecte] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [montant, setMontant] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [idCollecteur, setIdCollecteur] = useState<string>('');

  const [joursCollectes, setJoursCollectes] = useState<JoursCollectesResponse | null>(null);
  const [loadingJoursCollectes, setLoadingJoursCollectes] = useState(false);

  const entrepriseId = user?.idEntreprise ?? entreprise?.id;

  const souscriptionsActives = useMemo(() => {
    if (!clientDetail?.souscriptions) return [];
    return clientDetail.souscriptions.filter(
      (s) => s.statut === StatutSouscription.EN_COURS
    );
  }, [clientDetail?.souscriptions]);

  useEffect(() => {
    const load = async () => {
      if (!entrepriseId) {
        setLoading(false);
        toast.error(
          'Contexte entreprise requis. Connectez-vous avec un compte entreprise ou sélectionnez une entreprise.'
        );
        return;
      }
      try {
        const [clientsRes, collecteursRes] = await Promise.all([
          clientApi.list({ limit: 500 }),
          collecteurApi.list({ limit: 200 }),
        ]);
        const clientsData = (clientsRes as PaginatedResponse<Client>).data ?? [];
        const collecteursData = (collecteursRes as PaginatedResponse<Collecteur>).data ?? [];
        setClients(clientsData);
        setCollecteurs(collecteursData);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string | string[] } }; message?: string })
            ?.response?.data?.message ??
          (err as { message?: string })?.message ??
          'Erreur lors du chargement des clients et collecteurs';
        toast.error(Array.isArray(msg) ? msg[0] : msg);
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
      setJoursCollectes(null);
      setMontant('');
      setDateCollecte(new Date().toISOString().slice(0, 10));
      return;
    }
    const loadClient = async () => {
      try {
        const c = await clientApi.get(selectedClientId);
        setClientDetail(c);
        setSelectedSouscription(null);
        setJoursCollectes(null);
        setMontant('');
        setDateCollecte(new Date().toISOString().slice(0, 10));
        const subs = (c.souscriptions ?? []).filter(
          (s) => s.statut === StatutSouscription.EN_COURS
        );
        if (subs.length === 1) {
          setSelectedSouscription(subs[0]!);
          setMontant(
            String(
              Math.round(Number(subs[0]!.produit?.montantJournalier ?? 0))
            )
          );
        }
      } catch {
        setClientDetail(null);
      }
    };
    loadClient();
  }, [selectedClientId]);

  useEffect(() => {
    if (!selectedClientId || !selectedSouscription?.id || !entrepriseId) {
      setJoursCollectes(null);
      return;
    }
    setLoadingJoursCollectes(true);
    setJoursCollectes(null);
    collecteApi
      .joursCollectes(selectedClientId, selectedSouscription.id)
      .then((res) => {
        setJoursCollectes(res);
        const today = new Date().toISOString().slice(0, 10);
        const alreadyCollected = res.datesCollectes.includes(today);
        const debut = new Date(res.dateDebut);
        const fin = new Date(res.dateFin);
        const todayDate = new Date();
        if (
          !alreadyCollected &&
          todayDate >= debut &&
          todayDate <= fin
        ) {
          setDateCollecte(today);
        } else {
          const d = new Date(debut);
          const end = new Date(fin);
          while (d <= end) {
            const ds = d.toISOString().slice(0, 10);
            if (!res.datesCollectes.includes(ds)) {
              setDateCollecte(ds);
              break;
            }
            d.setDate(d.getDate() + 1);
          }
        }
      })
      .catch(() => setJoursCollectes(null))
      .finally(() => setLoadingJoursCollectes(false));
  }, [selectedClientId, selectedSouscription?.id, entrepriseId]);

  useEffect(() => {
    if (selectedSouscription?.produit?.montantJournalier != null && typeCollecte === 'normal') {
      setMontant(
        String(Math.round(Number(selectedSouscription.produit!.montantJournalier)))
      );
    }
    if (typeCollecte !== 'normal') setMontant('0');
  }, [selectedSouscription?.produit?.montantJournalier, typeCollecte]);

  const hasCollectedToday =
    joursCollectes?.datesCollectes.includes(new Date().toISOString().slice(0, 10)) ?? false;
  const isDateAlreadyCollected = (d: string) =>
    joursCollectes?.datesCollectes.includes(d) ?? false;

  const dateDebut = joursCollectes?.dateDebut ?? '';
  const dateFin = joursCollectes?.dateFin ?? '';
  const lastSelectable =
    dateFin && new Date(dateFin) < new Date()
      ? dateFin
      : new Date().toISOString().slice(0, 10);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !idCollecteur) {
      toast.error('Veuillez sélectionner un client et un collecteur.');
      return;
    }
    const montantNum = typeCollecte === 'normal' ? Number(montant) : 0;
    if (typeCollecte === 'normal' && (isNaN(montantNum) || montantNum < 0)) {
      toast.error('Montant invalide.');
      return;
    }
    if (
      (typeCollecte === 'absent' || typeCollecte === 'nonPaye') &&
      !note.trim()
    ) {
      toast.error(
        typeCollecte === 'absent'
          ? 'La justification est obligatoire pour un client absent.'
          : 'La raison est obligatoire pour un non-payé.'
      );
      return;
    }
    if (selectedSouscription && joursCollectes && isDateAlreadyCollected(dateCollecte)) {
      toast.error('Une collecte existe déjà pour ce client à cette date. Choisissez un autre jour.');
      return;
    }
    if (
      selectedSouscription &&
      dateDebut &&
      dateFin &&
      (dateCollecte < dateDebut || dateCollecte > dateFin)
    ) {
      toast.error(
        `La date doit être comprise entre le ${format(new Date(dateDebut), 'dd/MM/yyyy', { locale: fr })} et le ${format(new Date(dateFin), 'dd/MM/yyyy', { locale: fr })}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let noteFinal = note.trim();
      if (typeCollecte === 'absent' && noteFinal) noteFinal = `Client absent: ${noteFinal}`;
      if (typeCollecte === 'nonPaye' && noteFinal) noteFinal = `Refus de paiement: ${noteFinal}`;

      const montantAttendu =
        typeCollecte === 'normal' && selectedSouscription?.produit?.montantJournalier != null
          ? Number(selectedSouscription.produit.montantJournalier)
          : undefined;
      const typeSignalement =
        typeCollecte === 'normal'
          ? 'NORMAL'
          : typeCollecte === 'absent'
            ? 'CLIENT_ABSENT'
            : 'REFUS_PAIEMENT';

      await collecteApi.create({
        montant: montantNum,
        idClient: selectedClientId,
        idCollecteur,
        dateCollecte,
        idSouscription: selectedSouscription?.id ?? undefined,
        note: noteFinal || undefined,
        montantAttendu,
        typeSignalement,
      });
      toast.success('Collecte enregistrée.');
      navigate(AppRoutes.COLLECTES);
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
          to={AppRoutes.COLLECTES}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Retour aux collectes
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle collecte</h1>
        <p className="text-gray-500 mt-1">
          Même flux que sur mobile : client, produit, date dans la période, type (normal / absent /
          non payé), montant et note.
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

          {souscriptionsActives.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produits à collecter pour ce client
              </label>
              <div className="flex flex-wrap gap-2">
                {souscriptionsActives.map((s) => {
                  const isSelected = selectedSouscription?.id === s.id;
                  const nom = s.produit?.nom ?? 'Produit';
                  const montantJ = Math.round(
                    Number(s.produit?.montantJournalier ?? 0)
                  );
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSouscription(isSelected ? null : s);
                        if (!isSelected && s.produit?.montantJournalier != null) {
                          setMontant(
                            String(Math.round(Number(s.produit!.montantJournalier)))
                          );
                        }
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {nom} — {montantJ} F
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedSouscription && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de collecte *
                </label>
                {loadingJoursCollectes ? (
                  <p className="text-sm text-gray-500">
                    Chargement du calendrier...
                  </p>
                ) : dateDebut && dateFin ? (
                  <div className="space-y-2">
                    {hasCollectedToday && (
                      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                        <span className="font-medium">
                          Ce client a déjà collecté aujourd&apos;hui pour ce produit.
                        </span>
                      </div>
                    )}
                    <input
                      type="date"
                      value={dateCollecte}
                      min={dateDebut}
                      max={lastSelectable}
                      onChange={(e) => setDateCollecte(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    {joursCollectes &&
                      joursCollectes.datesCollectes.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {joursCollectes.datesCollectes.length} jour(s) déjà
                          collecté(s) dans la période du produit.
                        </p>
                      )}
                  </div>
                ) : null}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'normal' as const, label: 'Normal' },
                  { value: 'absent' as const, label: 'Client absent' },
                  { value: 'nonPaye' as const, label: 'Non payé' },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeCollecte(value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    typeCollecte === value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {(typeCollecte === 'absent' || typeCollecte === 'nonPaye') && (
              <p className="mt-1 text-sm text-amber-600">
                Montant sera 0.{' '}
                {typeCollecte === 'absent'
                  ? 'Indiquez la justification ci-dessous.'
                  : 'Indiquez la raison ci-dessous.'}
              </p>
            )}
          </div>

          {typeCollecte === 'normal' && (
            <Input
              label="Montant (XAF) *"
              type="number"
              placeholder="1000"
              min={0}
              step={1}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {typeCollecte === 'absent'
                ? 'Justification (obligatoire)'
                : typeCollecte === 'nonPaye'
                  ? 'Raison (obligatoire)'
                  : 'Note / commentaire'}
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={2}
              placeholder={
                typeCollecte === 'normal'
                  ? 'Optionnel'
                  : typeCollecte === 'absent'
                    ? 'Ex: portail fermé, pas de monnaie...'
                    : 'Ex: refus du client...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Select
            label="Collecteur *"
            value={idCollecteur}
            onChange={(e) => setIdCollecteur(e.target.value)}
            placeholder={loading ? 'Chargement...' : 'Sélectionnez un collecteur'}
            disabled={loading}
          >
            <option value="">— Sélectionnez —</option>
            {collecteurs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codeCollecteur} — {c.utilisateur?.nom ?? ''}{' '}
                {c.utilisateur?.prenom ?? ''}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-4">
            <Link to={AppRoutes.COLLECTES}>
              <Button type="button" variant="secondary">
                Annuler
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Enregistrer la collecte
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
