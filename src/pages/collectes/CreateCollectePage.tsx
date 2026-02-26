import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  collecteApi,
  clientApi,
  collecteurApi,
  creditApi,
  type JoursCollectesResponse,
} from '@/core/api';
import { useAuthStore } from '@/core/store/auth.store';
import type { Client, Collecteur, Souscription, DossierCredit, Echeance, PaginatedResponse } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { StatutSouscription } from '@/types';
import { StatutEcheance } from '@/types/enums';
import { TypeProduit } from '@/types/enums';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import CalendrierJoursCollectes from '@/components/collecte/CalendrierJoursCollectes';
import { HiCalendarDays } from 'react-icons/hi2';

type TypeCollecte = 'normal' | 'absent' | 'nonPaye';
type ModeCollecte = 'epargne' | 'credit';

export default function CreateCollectePage() {
  const navigate = useNavigate();
  const { user, entreprise } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [clientDetail, setClientDetail] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modeCollecte, setModeCollecte] = useState<ModeCollecte>('epargne');
  const [idCollecteur, setIdCollecteur] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSouscription, setSelectedSouscription] = useState<Souscription | null>(null);
  const [typeCollecte, setTypeCollecte] = useState<TypeCollecte>('normal');

  const [dossiersActifs, setDossiersActifs] = useState<DossierCredit[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<DossierCredit | null>(null);
  const [echeancesDispo, setEcheancesDispo] = useState<Echeance[]>([]);
  const [selectedEcheance, setSelectedEcheance] = useState<Echeance | null>(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [dateCollecte, setDateCollecte] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [montant, setMontant] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [joursCollectes, setJoursCollectes] = useState<JoursCollectesResponse | null>(null);
  const [loadingJoursCollectes, setLoadingJoursCollectes] = useState(false);
  const [calendrierOpen, setCalendrierOpen] = useState(false);

  const entrepriseId = user?.idEntreprise ?? entreprise?.id;

  /** Types produit épargne : n'affichés que si le client a une adhésion EPARGNE active. */
  const TYPES_EPARGNE: TypeProduit[] = [
    TypeProduit.EPARGNE,
    TypeProduit.EPARGNE_BLOQUEE,
    TypeProduit.EPARGNE_PROGRAMMEE,
  ];

  const souscriptionsActives = useMemo(() => {
    if (!clientDetail?.souscriptions) return [];
    const hasEpargne = clientDetail.adhesionsProduits?.some(
      (a) => a.typeModule === 'EPARGNE' && a.actif
    );
    return clientDetail.souscriptions.filter((s) => {
      if (s.statut !== StatutSouscription.EN_COURS) return false;
      const type = s.produit?.type as TypeProduit | undefined;
      if (type && TYPES_EPARGNE.includes(type)) return !!hasEpargne;
      return true;
    });
  }, [clientDetail?.souscriptions, clientDetail?.adhesionsProduits]);

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
        const collecteursRes = await collecteurApi.list({ limit: 200 });
        const collecteursData = (collecteursRes as PaginatedResponse<Collecteur>).data ?? [];
        setCollecteurs(collecteursData);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string | string[] } }; message?: string })
            ?.response?.data?.message ??
          (err as { message?: string })?.message ??
          'Erreur lors du chargement des collecteurs';
        toast.error(Array.isArray(msg) ? msg[0] : msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entrepriseId]);

  /** Charge les clients liés au collecteur sélectionné. En mode crédit : tous les clients assignés (sans onlyWithPlanCollecte). */
  useEffect(() => {
    if (!idCollecteur || !entrepriseId) {
      setClients([]);
      setSelectedClientId('');
      setClientDetail(null);
      setSelectedSouscription(null);
      setDossiersActifs([]);
      setSelectedDossier(null);
      setEcheancesDispo([]);
      setSelectedEcheance(null);
      return;
    }
    setLoadingClients(true);
    const params: Record<string, unknown> = {
      limit: 500,
      actif: true,
      collecteurId: idCollecteur,
      onlyAssignedToCollecteur: true,
    };
    if (modeCollecte === 'epargne') {
      params.onlyWithPlanCollecte = true;
    }
    clientApi
      .list(params as Parameters<typeof clientApi.list>[0])
      .then((res) => {
        const clientsData = (res as PaginatedResponse<Client>).data ?? [];
        setClients(clientsData);
        setSelectedClientId('');
        setClientDetail(null);
        setSelectedSouscription(null);
        setDossiersActifs([]);
        setSelectedDossier(null);
        setEcheancesDispo([]);
        setSelectedEcheance(null);
      })
      .catch(() => {
        setClients([]);
        toast.error('Erreur lors du chargement des clients.');
      })
      .finally(() => setLoadingClients(false));
  }, [idCollecteur, entrepriseId, modeCollecte]);

  /** Mode crédit : charger les dossiers actifs du client. */
  useEffect(() => {
    if (!selectedClientId || modeCollecte !== 'credit') {
      setDossiersActifs([]);
      setSelectedDossier(null);
      setEcheancesDispo([]);
      setSelectedEcheance(null);
      return;
    }
    setLoadingCredit(true);
    creditApi
      .listDossiers({ clientId: selectedClientId, statut: 'ACTIF' })
      .then((res) => {
        const data = (res as PaginatedResponse<DossierCredit>).data ?? [];
        setDossiersActifs(data);
        setSelectedDossier(data.length === 1 ? data[0]! : null);
        setSelectedEcheance(null);
        setMontant('');
      })
      .catch(() => {
        setDossiersActifs([]);
        setSelectedDossier(null);
      })
      .finally(() => setLoadingCredit(false));
  }, [selectedClientId, modeCollecte]);

  /** Mode crédit : charger les échéances du dossier sélectionné. */
  useEffect(() => {
    if (!selectedDossier?.id || modeCollecte !== 'credit') {
      setEcheancesDispo([]);
      setSelectedEcheance(null);
      return;
    }
    setLoadingCredit(true);
    creditApi
      .getEcheances(selectedDossier.id)
      .then((ech) => {
        const nonPayees = (ech ?? []).filter(
          (e) => e.statut !== StatutEcheance.PAYEE
        );
        setEcheancesDispo(nonPayees);
        const restant = Number(nonPayees[0]?.montantTotal ?? 0) - Number(nonPayees[0]?.montantPaye ?? 0);
        setMontant(restant > 0 ? String(Math.round(restant)) : '');
        setSelectedEcheance(nonPayees.length === 1 ? nonPayees[0]! : null);
      })
      .catch(() => {
        setEcheancesDispo([]);
        setSelectedEcheance(null);
      })
      .finally(() => setLoadingCredit(false));
  }, [selectedDossier?.id, modeCollecte]);

  useEffect(() => {
    if (!selectedClientId || modeCollecte !== 'epargne') {
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
  }, [selectedClientId, modeCollecte]);

  useEffect(() => {
    if (!selectedClientId || !selectedSouscription?.id || !entrepriseId || modeCollecte !== 'epargne') {
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
  }, [selectedClientId, selectedSouscription?.id, entrepriseId, modeCollecte]);

  useEffect(() => {
    if (modeCollecte === 'credit' && selectedEcheance) {
      const restant = Number(selectedEcheance.montantTotal) - Number(selectedEcheance.montantPaye);
      setMontant(String(Math.round(restant)));
      return;
    }
    if (selectedSouscription?.produit?.montantJournalier != null && typeCollecte === 'normal') {
      setMontant(
        String(Math.round(Number(selectedSouscription.produit!.montantJournalier)))
      );
    }
    if (typeCollecte !== 'normal') setMontant('0');
  }, [selectedSouscription?.produit?.montantJournalier, typeCollecte, modeCollecte, selectedEcheance]);

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

    if (modeCollecte === 'credit') {
      if (!selectedEcheance?.id) {
        toast.error('Veuillez sélectionner une échéance à rembourser.');
        return;
      }
      const montantNum = Number(montant);
      const restant = Number(selectedEcheance.montantTotal) - Number(selectedEcheance.montantPaye);
      if (isNaN(montantNum) || montantNum <= 0 || montantNum > restant + 0.01) {
        toast.error(`Montant invalide. Reste à payer : ${restant.toLocaleString('fr-FR')} XAF`);
        return;
      }
      setIsSubmitting(true);
      try {
        await collecteApi.create({
          montant: montantNum,
          idClient: selectedClientId,
          idCollecteur,
          idEcheance: selectedEcheance.id,
          dateCollecte,
          note: note.trim() || undefined,
        });
        toast.success('Remboursement crédit enregistré.');
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
          Collecte épargne/tontine ou remboursement crédit. Sélectionnez le collecteur, puis le client.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de collecte *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModeCollecte('epargne')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  modeCollecte === 'epargne'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Épargne / Tontine
              </button>
              <button
                type="button"
                onClick={() => setModeCollecte('credit')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  modeCollecte === 'credit'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Remboursement crédit
              </button>
            </div>
          </div>

          <Select
            label="Collecteur *"
            value={idCollecteur}
            onChange={(e) => setIdCollecteur(e.target.value)}
            placeholder={loading ? 'Chargement des collecteurs...' : 'Sélectionnez un collecteur'}
            disabled={loading}
          >
            <option value="">— Sélectionnez un collecteur —</option>
            {collecteurs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codeCollecteur} — {c.utilisateur?.nom ?? ''}{' '}
                {c.utilisateur?.prenom ?? ''}
              </option>
            ))}
          </Select>
          <p className="text-xs text-gray-500 -mt-4">
            {modeCollecte === 'epargne'
              ? 'Clients assignés à ce collecteur et ayant un plan de collecte (épargne, tontine, libre).'
              : 'Clients assignés à ce collecteur (pour remboursement crédit).'}
          </p>

          <Select
            label="Client *"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            placeholder={
              !idCollecteur
                ? 'Sélectionnez d\'abord un collecteur'
                : loadingClients
                  ? 'Chargement des clients...'
                  : clients.length === 0
                    ? 'Aucun client assigné à ce collecteur'
                    : 'Sélectionnez un client'
            }
            disabled={!idCollecteur || loadingClients}
          >
            <option value="">— Sélectionnez —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codeClient} — {c.nom} {c.prenom ?? ''}{' '}
                {c.telephone ? `(${c.telephone})` : ''}
              </option>
            ))}
          </Select>

          {modeCollecte === 'credit' && selectedClientId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de remboursement *</label>
                <input
                  type="date"
                  value={dateCollecte}
                  onChange={(e) => setDateCollecte(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {loadingCredit ? (
                <p className="text-sm text-gray-500">Chargement des crédits actifs...</p>
              ) : dossiersActifs.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Ce client n&apos;a pas de crédit actif.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dossier crédit *</label>
                    <Select
                      value={selectedDossier?.id ?? ''}
                      onChange={(e) => {
                        const d = dossiersActifs.find((x) => x.id === e.target.value);
                        setSelectedDossier(d ?? null);
                        setSelectedEcheance(null);
                      }}
                    >
                      <option value="">— Sélectionnez un dossier —</option>
                      {dossiersActifs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.codeDossier} — {Number(d.montantAccorde ?? d.montantDemande).toLocaleString('fr-FR')} XAF
                        </option>
                      ))}
                    </Select>
                  </div>
                  {selectedDossier && echeancesDispo.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Échéance à rembourser *</label>
                      <div className="flex flex-wrap gap-2">
                        {echeancesDispo.map((ech) => {
                          const restant = Number(ech.montantTotal) - Number(ech.montantPaye);
                          const isSelected = selectedEcheance?.id === ech.id;
                          return (
                            <button
                              key={ech.id}
                              type="button"
                              onClick={() => {
                                setSelectedEcheance(isSelected ? null : ech);
                                setMontant(restant > 0 ? String(Math.round(restant)) : '');
                              }}
                              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              Éch. {ech.numero} — {format(new Date(ech.dateEcheance), 'dd/MM/yy', { locale: fr })} — restant {Math.round(restant).toLocaleString('fr-FR')} XAF
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedDossier && echeancesDispo.length === 0 && !loadingCredit && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                      Toutes les échéances de ce dossier sont payées.
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {modeCollecte === 'epargne' && souscriptionsActives.length > 0 && (
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                title="Les plans épargne ne sont proposés que si le client est lié au produit Épargne (fiche client → Produits)."
              >
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

          {modeCollecte === 'epargne' && selectedSouscription && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date de collecte *
                  </label>
                  {dateDebut && dateFin && !loadingJoursCollectes && (
                    <button
                      type="button"
                      onClick={() => setCalendrierOpen(true)}
                      className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                      title="Voir les jours déjà collectés"
                    >
                      <HiCalendarDays className="h-5 w-5" />
                    </button>
                  )}
                </div>
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
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateCollecte}
                        min={dateDebut}
                        max={lastSelectable}
                        onChange={(e) => setDateCollecte(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setCalendrierOpen(true)}
                        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                        title="Voir les jours déjà collectés et choisir une date"
                      >
                        <HiCalendarDays className="h-5 w-5" />
                      </button>
                    </div>
                    {joursCollectes && joursCollectes.datesCollectes.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {joursCollectes.datesCollectes.length} jour(s) déjà
                        collecté(s) dans la période du produit. Cliquez sur le calendrier pour voir lesquels.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Sélectionnez un produit ci-dessus pour voir la période.
                  </p>
                )}
              </div>

              {joursCollectes && dateDebut && dateFin && (
                <CalendrierJoursCollectes
                  open={calendrierOpen}
                  onClose={() => setCalendrierOpen(false)}
                  dateDebut={dateDebut}
                  dateFin={dateFin}
                  datesCollectes={joursCollectes.datesCollectes}
                  lastSelectable={lastSelectable}
                  onSelectDate={(dateStr) => setDateCollecte(dateStr)}
                />
              )}
            </>
          )}

          {modeCollecte === 'epargne' && (
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
          )}

          {typeCollecte === 'normal' && (modeCollecte === 'epargne' || (modeCollecte === 'credit' && selectedEcheance)) && (
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
              {(modeCollecte === 'epargne' && typeCollecte === 'absent')
                ? 'Justification (obligatoire)'
                : (modeCollecte === 'epargne' && typeCollecte === 'nonPaye')
                  ? 'Raison (obligatoire)'
                  : 'Note / commentaire'}
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={2}
              placeholder={
                (modeCollecte === 'epargne' && typeCollecte === 'normal') || modeCollecte === 'credit'
                  ? 'Optionnel'
                  : typeCollecte === 'absent'
                    ? 'Ex: portail fermé, pas de monnaie...'
                    : 'Ex: refus du client...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

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
