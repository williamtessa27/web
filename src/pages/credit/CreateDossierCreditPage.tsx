import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi2';
import { creditApi, clientApi, produitApi } from '@/core/api';
import type { Client, ClientCreditProfile, Produit } from '@/types';
import { FrequenceRemboursementCredit, TypeCalculCredit, TypeProduit } from '@/types/enums';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import MoneyInput from '@/components/ui/MoneyInput';
import Badge from '@/components/ui/Badge';
import { formatMoneyInput, formatXaf, parseMoneyInput } from '@/lib/money';

const freqOptions = [
  { value: FrequenceRemboursementCredit.MENSUEL, label: 'Mensuel' },
  { value: FrequenceRemboursementCredit.HEBDOMADAIRE, label: 'Hebdomadaire' },
  { value: FrequenceRemboursementCredit.JOURNALIER, label: 'Journalier' },
];

export default function CreateDossierCreditPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [creditProfile, setCreditProfile] = useState<ClientCreditProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    idClient: '',
    idProduit: '',
    montantDemande: '',
    tauxInteret: '12',
    dureeMois: '12',
    dureeJours: '',
    frequenceRemboursement: FrequenceRemboursementCredit.MENSUEL,
    fraisDossier: '0',
    penaliteRetardPourcent: '0',
    objetCredit: '',
  });

  const selectedProduit = produits.find((p) => p.id === form.idProduit);
  const selectedClient = clients.find((c) => c.id === form.idClient);
  const agreement = creditProfile?.creditPartnerAgreement ?? null;
  const isCourtTerme =
    selectedProduit?.typeCalculCredit === TypeCalculCredit.FORFAITAIRE_COURT_TERME;
  const montantDemande = parseMoneyInput(form.montantDemande);
  const fraisDossier = parseMoneyInput(form.fraisDossier) ?? 0;
  const tauxInteret = Number(form.tauxInteret || 0);
  const penaliteRetardPourcent = Number(form.penaliteRetardPourcent || 0);
  const dureeJoursValue = Number(form.dureeJours || 0);
  const interetPreview =
    montantDemande && Number.isFinite(tauxInteret)
      ? Math.round(montantDemande * (tauxInteret / 100))
      : 0;
  const totalPreview = (montantDemande ?? 0) + interetPreview + fraisDossier;

  const eligibilityIssues: string[] = [];
  if (form.idClient && !profileLoading) {
    if (!creditProfile) {
      eligibilityIssues.push('Profil crédit non renseigné.');
    } else {
      if (!creditProfile.verifie) eligibilityIssues.push('Profil crédit non vérifié.');
      if (!creditProfile.idCreditPartnerAgreement || !agreement) eligibilityIssues.push('Convention partenaire non renseignée.');
      if (creditProfile.salaireMensuel == null || Number(creditProfile.salaireMensuel) <= 0) {
        eligibilityIssues.push('Salaire mensuel non renseigné.');
      }
      if (!creditProfile.employeur && !creditProfile.organisation) {
        eligibilityIssues.push('Employeur ou organisation non renseigné.');
      }
      if (agreement) {
        if (agreement.statut !== 'ACTIVE') eligibilityIssues.push(`Convention ${agreement.reference} non active.`);
        if (agreement.plafondParClient != null && montantDemande && montantDemande > Number(agreement.plafondParClient)) {
          eligibilityIssues.push(`Montant demandé supérieur au plafond par client (${formatXaf(agreement.plafondParClient)}).`);
        }
        if (agreement.tauxInteretMax != null && tauxInteret > Number(agreement.tauxInteretMax)) {
          eligibilityIssues.push(`Taux d'intérêt supérieur au maximum convention (${agreement.tauxInteretMax}%).`);
        }
        if (agreement.tauxPenaliteMax != null && penaliteRetardPourcent > Number(agreement.tauxPenaliteMax)) {
          eligibilityIssues.push(`Pénalité supérieure au maximum convention (${agreement.tauxPenaliteMax}%/jour).`);
        }
      }
    }
  }

  useEffect(() => {
    Promise.all([
      clientApi.list({
        limit: 500,
        actif: true,
        statut: 'ACTIF',
        onlyWithAdhesionCredit: true,
      }),
      produitApi.list(),
    ]).then(([clientsRes, produitsRes]) => {
      setClients(clientsRes?.data ?? []);
      setProduits(Array.isArray(produitsRes) ? produitsRes : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.idClient) {
      setCreditProfile(null);
      return;
    }
    setProfileLoading(true);
    clientApi.getCreditProfile(form.idClient)
      .then((profile) => setCreditProfile(profile))
      .catch(() => {
        setCreditProfile(null);
        toast.error('Impossible de charger le profil crédit du client.');
      })
      .finally(() => setProfileLoading(false));
  }, [form.idClient]);

  useEffect(() => {
    if (!selectedProduit) return;
    if (selectedProduit.typeCalculCredit === TypeCalculCredit.FORFAITAIRE_COURT_TERME) {
      const dureeJours = selectedProduit.dureeMaxJoursCredit ?? selectedProduit.dureeJours ?? 30;
      setForm((f) => ({
        ...f,
        tauxInteret: String(selectedProduit.tauxInteretCredit ?? 10),
        dureeJours: String(dureeJours),
        dureeMois: String(Math.max(1, Math.ceil(Number(dureeJours) / 30))),
        frequenceRemboursement: FrequenceRemboursementCredit.JOURNALIER,
        penaliteRetardPourcent: String(selectedProduit.penaliteRetardPourcent ?? 2),
      }));
      return;
    }
    setForm((f) => ({
      ...f,
      tauxInteret: selectedProduit.tauxInteretCredit != null ? String(selectedProduit.tauxInteretCredit) : f.tauxInteret,
      penaliteRetardPourcent:
        selectedProduit.penaliteRetardPourcent != null ? String(selectedProduit.penaliteRetardPourcent) : f.penaliteRetardPourcent,
    }));
  }, [selectedProduit?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montant = parseMoneyInput(form.montantDemande) ?? 0;
    const taux = parseFloat(form.tauxInteret);
    const duree = parseInt(form.dureeMois, 10);
    const dureeJours = parseInt(form.dureeJours, 10);
    const frais = parseMoneyInput(form.fraisDossier) ?? 0;
    const penalite = parseFloat(form.penaliteRetardPourcent) || 0;
    if (!form.idClient || !montant || montant <= 0 || !Number.isFinite(taux) || taux < 0 || !duree || duree < 1) {
      toast.error('Remplissez les champs obligatoires (client, montant, taux, durée).');
      return;
    }
    if (eligibilityIssues.length > 0) {
      toast.error(`Demande impossible : ${eligibilityIssues[0]}`);
      return;
    }
    if (selectedProduit?.montantMin != null && montant < Number(selectedProduit.montantMin)) {
      toast.error(`Montant trop faible pour ce produit : minimum ${formatXaf(selectedProduit.montantMin)}.`);
      return;
    }
    if (selectedProduit?.montantMax != null && montant > Number(selectedProduit.montantMax)) {
      toast.error(`Montant trop élevé pour ce produit : maximum ${formatXaf(selectedProduit.montantMax)}.`);
      return;
    }
    if (selectedProduit?.dureeMinMois != null && duree < Number(selectedProduit.dureeMinMois)) {
      toast.error(`Durée trop courte pour ce produit : minimum ${selectedProduit.dureeMinMois} mois.`);
      return;
    }
    if (selectedProduit?.dureeMaxMois != null && duree > Number(selectedProduit.dureeMaxMois)) {
      toast.error(`Durée trop longue pour ce produit : maximum ${selectedProduit.dureeMaxMois} mois.`);
      return;
    }
    if (isCourtTerme) {
      const dureeMaxJours = Number(selectedProduit?.dureeMaxJoursCredit ?? selectedProduit?.dureeJours ?? 30);
      if (!dureeJours || dureeJours < 1) {
        toast.error('Renseignez la durée en jours pour ce crédit court terme.');
        return;
      }
      if (dureeJours > dureeMaxJours) {
        toast.error(`Durée trop longue pour ce produit : maximum ${dureeMaxJours} jours.`);
        return;
      }
    }
    setLoading(true);
    try {
      const dossier = await creditApi.createDossier({
        idClient: form.idClient,
        idProduit: form.idProduit || undefined,
        montantDemande: montant,
        tauxInteret: taux,
        dureeMois: duree,
        ...(isCourtTerme ? { dureeJours } : {}),
        frequenceRemboursement: form.frequenceRemboursement,
        fraisDossier: frais,
        penaliteRetardPourcent: penalite,
        objetCredit: form.objetCredit || undefined,
      });
      toast.success('Demande de crédit créée.');
      navigate(AppRoutes.CREDIT_DETAIL.replace(':id', dossier.id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.CREDIT}>
          <Button variant="ghost" size="sm">← Retour</Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande de crédit</h1>
        <p className="text-gray-500 mt-1">Créez un dossier pour un client.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              required
              value={form.idClient}
              onChange={(e) => setForm((f) => ({ ...f, idClient: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.nom, c.prenom].filter(Boolean).join(' ')} — {c.codeClient}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Seuls les clients actifs et liés au module Crédit dans « Produits (modules) » sont proposés.
            </p>
          </div>

          {form.idClient && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    Profil crédit {selectedClient ? `— ${[selectedClient.nom, selectedClient.prenom].filter(Boolean).join(' ')}` : ''}
                  </p>
                  <p className="text-gray-500">
                    {profileLoading ? 'Chargement du profil crédit...' : 'Contrôle du salaire, de la convention et des plafonds avant création.'}
                  </p>
                </div>
                {!profileLoading && (
                  <Badge variant={eligibilityIssues.length ? 'warning' : 'success'}>
                    {eligibilityIssues.length ? 'À compléter' : 'Éligible'}
                  </Badge>
                )}
              </div>
              {!profileLoading && creditProfile && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div><span className="text-gray-500">Statut</span><p>{creditProfile.verifie ? 'Vérifié' : 'Non vérifié'}</p></div>
                  <div><span className="text-gray-500">Salaire</span><p>{formatXaf(creditProfile.salaireMensuel)}</p></div>
                  <div><span className="text-gray-500">Convention</span><p>{agreement ? `${agreement.partner?.nom ?? 'Partenaire'} · ${agreement.reference}` : '—'}</p></div>
                  <div><span className="text-gray-500">Plafond/client</span><p>{agreement ? formatXaf(agreement.plafondParClient) : '—'}</p></div>
                </div>
              )}
              {!profileLoading && eligibilityIssues.length > 0 && (
                <div className="mt-3 flex flex-col gap-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                  <span>{eligibilityIssues[0]}</span>
                  <Link to={AppRoutes.CLIENT_DETAIL.replace(':id', form.idClient)} className="shrink-0">
                    <Button type="button" size="sm" variant="secondary">
                      Voir la fiche client
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produit crédit (optionnel)</label>
            <div className="flex gap-2">
              <select
                value={form.idProduit}
                onChange={(e) => setForm((f) => ({ ...f, idProduit: e.target.value }))}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Aucun</option>
                {produits.filter((p) => p.type === 'PRET').map((p) => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
              <Link
                to={AppRoutes.PRODUIT_CREATE}
                state={{
                  returnTo: AppRoutes.CREDIT_CREATE,
                  initialType: TypeProduit.PRET,
                  initialTypeCalculCredit: TypeCalculCredit.FORFAITAIRE_COURT_TERME,
                }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                title="Créer un produit crédit"
                aria-label="Créer un produit crédit"
              >
                <HiOutlinePlus className="h-5 w-5" />
              </Link>
            </div>
            {selectedProduit && (
              <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                <p className="font-medium">{selectedProduit.nom}</p>
                <p>
                  Montant : {formatXaf(selectedProduit.montantMin)} à {formatXaf(selectedProduit.montantMax)} ·{' '}
                  {isCourtTerme
                    ? `Court terme : ${selectedProduit.dureeMaxJoursCredit ?? selectedProduit.dureeJours ?? 30} jours max, intérêt ${selectedProduit.tauxInteretCredit ?? 10}%, pénalité ${selectedProduit.penaliteRetardPourcent ?? 2}%/jour`
                    : `Durée : ${selectedProduit.dureeMinMois ?? '—'} à ${selectedProduit.dureeMaxMois ?? '—'} mois`}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MoneyInput
              label="Montant demandé (XAF) *"
              value={form.montantDemande}
              onChange={(montantDemande) => setForm((f) => ({ ...f, montantDemande }))}
            />
            <Input
              label={isCourtTerme ? 'Intérêt forfaitaire (%) *' : 'Taux intérêt annuel (%) *'}
              type="number"
              min={0}
              step={0.1}
              value={form.tauxInteret}
              onChange={(e) => setForm((f) => ({ ...f, tauxInteret: e.target.value }))}
            />
            <Input
              label="Durée (mois) *"
              type="number"
              min={1}
              disabled={isCourtTerme}
              value={form.dureeMois}
              onChange={(e) => setForm((f) => ({ ...f, dureeMois: e.target.value }))}
            />
          </div>

          {isCourtTerme && (
            <Input
              label="Durée court terme (jours) *"
              type="number"
              min={1}
              max={Number(selectedProduit?.dureeMaxJoursCredit ?? selectedProduit?.dureeJours ?? 30)}
              value={form.dureeJours}
              onChange={(e) => {
                const days = Number(e.target.value);
                setForm((f) => ({
                  ...f,
                  dureeJours: e.target.value,
                  dureeMois: days > 0 ? String(Math.max(1, Math.ceil(days / 30))) : f.dureeMois,
                }));
              }}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence remboursement</label>
              <select
                value={form.frequenceRemboursement}
                onChange={(e) => setForm((f) => ({ ...f, frequenceRemboursement: e.target.value as FrequenceRemboursementCredit }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {freqOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <MoneyInput
              label="Frais de dossier (XAF)"
              value={form.fraisDossier}
              onChange={(fraisDossier) => setForm((f) => ({ ...f, fraisDossier }))}
            />
          </div>

          <Input
            label="Pénalité de retard (% par jour)"
            type="number"
            min={0}
            step={0.1}
            value={form.penaliteRetardPourcent}
            onChange={(e) => setForm((f) => ({ ...f, penaliteRetardPourcent: e.target.value }))}
          />

          <Input
            label="Objet du crédit (optionnel)"
            value={form.objetCredit}
            onChange={(e) => setForm((f) => ({ ...f, objetCredit: e.target.value }))}
          />

          {montantDemande != null && montantDemande > 0 && (
            <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-950">
              <p className="font-semibold mb-2">Résumé financier</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div><span className="text-primary-700">Montant</span><p className="font-medium">{formatXaf(montantDemande)}</p></div>
                <div><span className="text-primary-700">Intérêt</span><p className="font-medium">{formatXaf(interetPreview)}</p></div>
                <div><span className="text-primary-700">Frais</span><p className="font-medium">{formatXaf(fraisDossier)}</p></div>
                <div><span className="text-primary-700">Total estimé</span><p className="font-semibold">{formatXaf(totalPreview)}</p></div>
              </div>
              {isCourtTerme && dureeJoursValue > 0 && (
                <p className="mt-2 text-primary-700">Échéance estimée : {dureeJoursValue} jour(s).</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Link to={AppRoutes.CREDIT}>
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button type="submit" isLoading={loading} disabled={profileLoading || eligibilityIssues.length > 0}>Créer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
