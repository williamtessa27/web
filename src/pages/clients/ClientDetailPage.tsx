import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineUserPlus, HiOutlineTrash, HiOutlinePencil, HiOutlineArrowDownTray, HiOutlineCheckCircle, HiOutlineArrowsPointingOut } from 'react-icons/hi2';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { clientApi, collecteurApi, zoneApi, produitApi, souscriptionApi, utilisateurApi, agenceApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import { useAuthStore } from '@/core/store/auth.store';
import { RoleUtilisateur } from '@/types';
import type { Client, ClientScoreResult, HistoriqueAffectationClient, Collecteur, Zone, Produit, Souscription, TypeModuleProduit, Agence } from '@/types';
import { StatutClient } from '@/types/enums';
import { TypeProduit } from '@/types';

/** Types considérés comme plans de collecte (montants journaliers 1000, 2000 F, etc.) */
const TYPES_PLANS_COLLECTE: TypeProduit[] = [
  TypeProduit.EPARGNE,
  TypeProduit.EPARGNE_BLOQUEE,
  TypeProduit.EPARGNE_PROGRAMMEE,
  TypeProduit.TONTINE,
  TypeProduit.LIBRE,
];

const MODULE_LABELS: Record<TypeModuleProduit, string> = {
  COLLECTE: 'Collecte',
  EPARGNE: 'Épargne',
  CREDIT: 'Crédit',
};
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import PhoneInput from '@/components/ui/PhoneInput';
import Input from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import NationaliteCombobox from '@/components/ui/NationaliteCombobox';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { PageLoader } from '@/components/ui/LoadingSpinner';

/** Champs requis pour pouvoir valider un client (passage EN_ATTENTE_VALIDATION → ACTIF). */
function getMissingValidationFields(c: Client | null): string[] {
  if (!c) return [];
  const missing: string[] = [];
  if (!(c.email || '').trim()) missing.push('Email');
  if (!c.idAgence) missing.push('Agence');
  if (!c.idZone) missing.push('Zone');
  if (!(c.pieceIdentiteRectoUrl || '').trim()) missing.push('Image recto pièce d\'identité');
  if (!(c.pieceIdentiteVersoUrl || '').trim()) missing.push('Image verso pièce d\'identité');
  if (!(c.nationalite || '').trim()) missing.push('Nationalité');
  if (!(c.profession || '').trim()) missing.push('Profession');
  return missing;
}

const statutBadge = (statut?: StatutClient) => {
  switch (statut) {
    case StatutClient.EN_ATTENTE_VALIDATION: return <Badge variant="warning">En attente de validation</Badge>;
    case StatutClient.ACTIF: return <Badge variant="success">Actif</Badge>;
    case StatutClient.SUSPENDU: return <Badge variant="warning">Suspendu</Badge>;
    case StatutClient.RESILIE: return <Badge variant="danger">Résilié</Badge>;
    default: return <Badge>{statut ?? '—'}</Badge>;
  }
};

const canEditClient = (role?: string) =>
  role === RoleUtilisateur.SuperAdmin ||
  role === RoleUtilisateur.AdminEntreprise ||
  role === RoleUtilisateur.ChefAgence ||
  role === RoleUtilisateur.Gestionnaire;

const canEditAgence = (role?: string) =>
  role === RoleUtilisateur.SuperAdmin ||
  role === RoleUtilisateur.AdminEntreprise ||
  role === RoleUtilisateur.ChefAgence;

const canValidateClient = (role?: string) =>
  role === RoleUtilisateur.SuperAdmin ||
  role === RoleUtilisateur.AdminEntreprise ||
  role === RoleUtilisateur.Directeur ||
  role === RoleUtilisateur.ChefAgence ||
  role === RoleUtilisateur.Gestionnaire;

const canRemettreActif = (role?: string) =>
  role === RoleUtilisateur.SuperAdmin ||
  role === RoleUtilisateur.AdminEntreprise ||
  role === RoleUtilisateur.ChefAgence;

const isClientValidated = (c: Client) =>
  c.statut === StatutClient.ACTIF && c.actif;

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [client, setClient] = useState<Client | null>(null);
  const [historique, setHistorique] = useState<HistoriqueAffectationClient[]>([]);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReaffecter, setShowReaffecter] = useState(false);
  const [newCollecteurId, setNewCollecteurId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddSouscription, setShowAddSouscription] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [selectedProduitId, setSelectedProduitId] = useState('');
  const [addingSouscription, setAddingSouscription] = useState(false);
  const [togglingCompte, setTogglingCompte] = useState(false);
  const [showConfirmDesactiverCompte, setShowConfirmDesactiverCompte] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [submittingInfo, setSubmittingInfo] = useState(false);
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAdresse, setFormAdresse] = useState('');
  const [formIdZone, setFormIdZone] = useState('');
  const [formIdAgence, setFormIdAgence] = useState('');
  const [formPieceIdentiteRectoUrl, setFormPieceIdentiteRectoUrl] = useState('');
  const [formPieceIdentiteVersoUrl, setFormPieceIdentiteVersoUrl] = useState('');
  const [formGenre, setFormGenre] = useState('');
  const [formDateNaissance, setFormDateNaissance] = useState('');
  const [formLieuNaissance, setFormLieuNaissance] = useState('');
  const [formNationalite, setFormNationalite] = useState('');
  const [formSituationMatrimoniale, setFormSituationMatrimoniale] = useState('');
  const [formProfession, setFormProfession] = useState('');
  const [formVille, setFormVille] = useState('');
  const [formQuartier, setFormQuartier] = useState('');
  const [formPays, setFormPays] = useState('');
  const [formTypePieceIdentite, setFormTypePieceIdentite] = useState('');
  const [formNumeroPieceIdentite, setFormNumeroPieceIdentite] = useState('');
  const [formDateDelivrancePiece, setFormDateDelivrancePiece] = useState('');
  const [formDateExpirationPiece, setFormDateExpirationPiece] = useState('');
  const [formLieuDelivrancePiece, setFormLieuDelivrancePiece] = useState('');
  const [formNomPersonneReference, setFormNomPersonneReference] = useState('');
  const [formTelephonePersonneReference, setFormTelephonePersonneReference] = useState('');
  const [formRelationPersonneReference, setFormRelationPersonneReference] = useState('');
  const [formAdressePersonneReference, setFormAdressePersonneReference] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTypeClient, setFormTypeClient] = useState('');
  const [formNombreMembres, setFormNombreMembres] = useState<string>('');
  const [formTelephoneSecondaire, setFormTelephoneSecondaire] = useState('');
  const [showRemettreAcces, setShowRemettreAcces] = useState(false);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [submittingRemettreAcces, setSubmittingRemettreAcces] = useState(false);
  const [score, setScore] = useState<ClientScoreResult | null>(null);
  const [validatingClient, setValidatingClient] = useState(false);
  const [submittingRemettreActif, setSubmittingRemettreActif] = useState(false);
  const [showConfirmResilier, setShowConfirmResilier] = useState(false);
  const [showConfirmRemettreActif, setShowConfirmRemettreActif] = useState(false);
  const [submittingAdhesion, setSubmittingAdhesion] = useState<string | null>(null);

  const modulesActives: TypeModuleProduit[] = ['COLLECTE', 'EPARGNE', 'CREDIT'];
  const adhesions = client?.adhesionsProduits?.filter((a) => a.actif) ?? [];
  const hasAdhesion = (mod: TypeModuleProduit) => adhesions.some((a) => a.typeModule === mod);
  const hasAdhesionCollecte = hasAdhesion('COLLECTE');
  const hasAdhesionCredit = hasAdhesion('CREDIT');
  const hasAdhesionEpargne = hasAdhesion('EPARGNE');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      clientApi.get(id),
      clientApi.getHistoriqueAffectation(id).catch(() => []),
      collecteurApi.list({ limit: 200 }).then((r) => r.data ?? []),
      agenceApi.list(false).catch(() => []),
      zoneApi.list().catch(() => []),
      clientApi.getScore(id).catch(() => null),
    ])
      .then(([c, h, col, agencesList, zonesList, scoreData]) => {
        setClient(c);
        setHistorique(h);
        setCollecteurs(col);
        setAgences(Array.isArray(agencesList) ? agencesList : []);
        setZones(Array.isArray(zonesList) ? zonesList : []);
        setScore(scoreData ?? null);
        setNewCollecteurId(c.idCollecteur ?? '');
        setFormNom(c.nom ?? '');
        setFormPrenom(c.prenom ?? '');
        setFormTelephone(c.telephone ?? '');
        setFormTelephoneSecondaire(c.telephoneSecondaire ?? '');
        setFormEmail(c.email ?? '');
        setFormAdresse(c.adresse ?? '');
        setFormVille(c.ville ?? '');
        setFormQuartier(c.quartier ?? '');
        setFormPays(c.pays ?? '');
        setFormIdZone(c.idZone ?? '');
        setFormIdAgence(c.idAgence ?? '');
        setFormPieceIdentiteRectoUrl(c.pieceIdentiteRectoUrl ?? '');
        setFormPieceIdentiteVersoUrl(c.pieceIdentiteVersoUrl ?? '');
        setFormGenre(c.genre ?? '');
        setFormDateNaissance(c.dateNaissance ? c.dateNaissance.toString().slice(0, 10) : '');
        setFormLieuNaissance(c.lieuNaissance ?? '');
        setFormNationalite(c.nationalite ?? '');
        setFormSituationMatrimoniale(c.situationMatrimoniale ?? '');
        setFormProfession(c.profession ?? '');
        setFormTypePieceIdentite(c.typePieceIdentite ?? '');
        setFormNumeroPieceIdentite(c.numeroPieceIdentite ?? '');
        setFormDateDelivrancePiece(c.dateDelivrancePiece ? c.dateDelivrancePiece.toString().slice(0, 10) : '');
        setFormDateExpirationPiece(c.dateExpirationPiece ? c.dateExpirationPiece.toString().slice(0, 10) : '');
        setFormLieuDelivrancePiece(c.lieuDelivrancePiece ?? '');
        setFormNomPersonneReference(c.nomPersonneReference ?? '');
        setFormTelephonePersonneReference(c.telephonePersonneReference ?? '');
        setFormRelationPersonneReference(c.relationPersonneReference ?? '');
        setFormAdressePersonneReference(c.adressePersonneReference ?? '');
        setFormNotes(c.notes ?? '');
        setFormTypeClient(c.typeClient ?? 'PERSONNE_PHYSIQUE');
        setFormNombreMembres(c.nombreMembres != null ? String(c.nombreMembres) : '');
      })
      .catch(() => toast.error('Client introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReaffecter = async () => {
    if (!id || newCollecteurId === client?.idCollecteur) return;
    setSubmitting(true);
    try {
      const updated = await clientApi.update(id, { idCollecteur: newCollecteurId || undefined });
      setClient(updated);
      const h = await clientApi.getHistoriqueAffectation(id);
      setHistorique(h);
      setShowReaffecter(false);
      toast.success('Collecteur mis à jour.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupprimer = async () => {
    if (!id) return;
    if (!window.confirm('Confirmer la suppression (résiliation) de ce client ? Elle est impossible si le client a déjà des collectes.')) return;
    setSubmitting(true);
    try {
      await clientApi.delete(id);
      toast.success('Client supprimé (résilié).');
      setClient(null);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarquerResilie = async () => {
    if (!id) return;
    setSubmitting(true);
    setShowConfirmResilier(false);
    try {
      const updated = await clientApi.update(id, { statut: StatutClient.RESILIE });
      setClient(updated);
      toast.success('Client marqué comme résilié.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdhesion = async (typeModule: TypeModuleProduit) => {
    if (!id) return;
    setSubmittingAdhesion(typeModule);
    try {
      const updated = await clientApi.addAdhesion(id, typeModule);
      setClient(updated);
      toast.success(`Client lié au produit ${MODULE_LABELS[typeModule]}.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmittingAdhesion(null);
    }
  };

  const handleRemoveAdhesion = async (typeModule: TypeModuleProduit) => {
    if (!id) return;
    setSubmittingAdhesion(typeModule);
    try {
      const updated = await clientApi.removeAdhesion(id, typeModule);
      setClient(updated);
      toast.success(`Adhésion au produit ${MODULE_LABELS[typeModule]} retirée.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmittingAdhesion(null);
    }
  };

  const handleRemettreActif = async () => {
    if (!id) return;
    setSubmittingRemettreActif(true);
    setShowConfirmRemettreActif(false);
    try {
      const updated = await clientApi.update(id, { statut: StatutClient.ACTIF, actif: true });
      setClient(updated);
      toast.success('Client remis en statut actif.');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmittingRemettreActif(false);
    }
  };

  const loadProduits = async () => {
    try {
      const list = await produitApi.list();
      setProduits(Array.isArray(list) ? list.filter((p: Produit) => p.actif !== false) : []);
    } catch {
      toast.error('Erreur chargement produits');
    }
  };

  const handleAddSouscription = async () => {
    if (!id || !selectedProduitId) return;
    setAddingSouscription(true);
    try {
      await souscriptionApi.create({ idClient: id, idProduit: selectedProduitId });
      const updated = await clientApi.get(id);
      setClient(updated);
      setShowAddSouscription(false);
      setSelectedProduitId('');
      toast.success('Souscription ajoutée : le produit apparaît dans la liste ci‑dessous.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur');
    } finally {
      setAddingSouscription(false);
    }
  };

  const onClientPhotoChange = async (url: string) => {
    if (!id) return;
    try {
      const updated = await clientApi.update(id, { photoUrl: url });
      setClient(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleSaveInfo = async () => {
    if (!id) return;
    const tel = (formTelephone || '').trim();
    if (!tel) {
      toast.error('Le téléphone est requis');
      return;
    }
    setSubmittingInfo(true);
    try {
      // Changement d'agence : opération distincte (audit + notifications Admin/Chef agence).
      if (canEditAgence(currentUser?.role) && formIdAgence && formIdAgence !== client?.idAgence) {
        await clientApi.changerAgence(id, formIdAgence);
      }
      const payload: Parameters<typeof clientApi.update>[1] = {
        typeClient: (formTypeClient === 'PERSONNE_PHYSIQUE' || formTypeClient === 'GROUPEMENT' ? formTypeClient : undefined) as Client['typeClient'] | undefined,
        nombreMembres: formNombreMembres ? parseInt(formNombreMembres, 10) : undefined,
        nom: formNom,
        prenom: formPrenom || undefined,
        genre: formGenre || undefined,
        dateNaissance: formDateNaissance || undefined,
        lieuNaissance: formLieuNaissance || undefined,
        nationalite: formNationalite || undefined,
        situationMatrimoniale: formSituationMatrimoniale || undefined,
        profession: formProfession || undefined,
        telephone: tel,
        telephoneSecondaire: formTelephoneSecondaire || undefined,
        email: formEmail || undefined,
        adresse: formAdresse || undefined,
        ville: formVille || undefined,
        quartier: formQuartier || undefined,
        pays: formPays || undefined,
        typePieceIdentite: formTypePieceIdentite || undefined,
        numeroPieceIdentite: formNumeroPieceIdentite || undefined,
        dateDelivrancePiece: formDateDelivrancePiece || undefined,
        dateExpirationPiece: formDateExpirationPiece || undefined,
        lieuDelivrancePiece: formLieuDelivrancePiece || undefined,
        pieceIdentiteRectoUrl: formPieceIdentiteRectoUrl || undefined,
        pieceIdentiteVersoUrl: formPieceIdentiteVersoUrl || undefined,
        nomPersonneReference: formNomPersonneReference || undefined,
        telephonePersonneReference: formTelephonePersonneReference || undefined,
        relationPersonneReference: formRelationPersonneReference || undefined,
        adressePersonneReference: formAdressePersonneReference || undefined,
        notes: formNotes || undefined,
        idZone: formIdZone || undefined,
      };
      if (canEditAgence(currentUser?.role) && formIdAgence) {
        payload.idAgence = formIdAgence;
      }
      const updated = await clientApi.update(id, payload);
      setClient(updated);
      setEditingInfo(false);
      toast.success('Informations mises à jour.');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmittingInfo(false);
    }
  };

  const handleToggleCompteConnexion = async () => {
    if (!client?.idUtilisateur) return;
    setTogglingCompte(true);
    setShowConfirmDesactiverCompte(false);
    try {
      const actif = !(client.utilisateur?.actif ?? true);
      await utilisateurApi.update(client.idUtilisateur, { actif });
      const updated = await clientApi.get(id!);
      setClient(updated);
      toast.success(actif ? 'Compte activé. Le client peut se connecter (web et mobile).' : 'Compte désactivé. Le client ne peut plus se connecter.');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setTogglingCompte(false);
    }
  };

  const handleValiderClient = async () => {
    if (!id) return;
    setValidatingClient(true);
    try {
      const updated = await clientApi.update(id, { statut: StatutClient.ACTIF, actif: true });
      setClient(updated);
      toast.success('Client validé. Vous pouvez maintenant lui affecter des produits et souscriptions.');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setValidatingClient(false);
    }
  };

  const handleRemettreAcces = async () => {
    if (!id || !nouveauMotDePasse || nouveauMotDePasse.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères (majuscule, minuscule, chiffre).');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(nouveauMotDePasse)) {
      toast.error('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.');
      return;
    }
    const hadAccount = !!client?.idUtilisateur;
    setSubmittingRemettreAcces(true);
    try {
      const updated = await clientApi.update(id, { motDePasse: nouveauMotDePasse });
      setClient(updated);
      setShowRemettreAcces(false);
      setNouveauMotDePasse('');
      toast.success(
        hadAccount
          ? 'Mot de passe mis à jour. Vous pouvez remettre ces accès au client (téléphone + ce mot de passe pour l\'app mobile).'
          : 'Compte créé. Le client peut maintenant se connecter à l\'app mobile avec son téléphone et le mot de passe défini.'
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmittingRemettreAcces(false);
    }
  };

  if (loading || !client) return <PageLoader />;

  const souscriptions = client.souscriptions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.CLIENTS}>
          <Button variant="ghost" size="sm"><HiOutlineArrowLeft className="h-4 w-4" /> Retour</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.nom} {client.prenom}</h1>
          <p className="text-gray-500 mt-1">{client.codeClient} — {statutBadge(client.statut)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowReaffecter(!showReaffecter)}>
            <HiOutlineUserPlus className="h-4 w-4" /> Réaffecter
          </Button>
          {client.statut !== StatutClient.RESILIE && (
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmResilier(true)} disabled={submitting}>
              Marquer résilié
            </Button>
          )}
          {client.statut === StatutClient.RESILIE && canRemettreActif(currentUser?.role) && (
            <Button variant="primary" size="sm" onClick={() => setShowConfirmRemettreActif(true)} disabled={submittingRemettreActif} isLoading={submittingRemettreActif}>
              <HiOutlineCheckCircle className="h-4 w-4" /> Remettre actif
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={handleSupprimer}
            disabled={submitting}
            title="Supprimer (résilié). Impossible si le client a déjà des collectes."
          >
            <HiOutlineTrash className="h-4 w-4" /> Supprimer
          </Button>
        </div>
      </div>

      {showReaffecter && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Changer de collecteur</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau collecteur</label>
              <Select
                value={newCollecteurId}
                onChange={(e) => setNewCollecteurId(e.target.value)}
              >
                <option value="">— Aucun —</option>
                {collecteurs.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.utilisateur?.nom ?? col.codeCollecteur}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={handleReaffecter} disabled={submitting || newCollecteurId === client.idCollecteur}>
              Enregistrer
            </Button>
            <Button variant="ghost" onClick={() => setShowReaffecter(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      {client.statut === StatutClient.EN_ATTENTE_VALIDATION && canValidateClient(currentUser?.role) && (() => {
        const missingValidation = getMissingValidationFields(client);
        const canValidate = missingValidation.length === 0;
        return (
          <Card className="border-primary-200 bg-primary-50/50">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HiOutlineCheckCircle className="h-5 w-5 text-primary-600" />
                  Valider le client
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Ce client est en attente de validation. Une fois validé par le chef d&apos;agence ou le gestionnaire, vous pourrez lui affecter des produits et souscriptions.
                </p>
                {!canValidate && (
                  <p className="text-sm text-amber-700 mt-2 font-medium">
                    La validation n&apos;est possible que si les informations sensibles sont complètes. Manquant : {missingValidation.join(', ')}. Modifiez les informations du client pour débloquer la validation.
                  </p>
                )}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleValiderClient}
                isLoading={validatingClient}
                disabled={!canValidate}
                title={!canValidate ? `Renseignez : ${missingValidation.join(', ')}` : undefined}
              >
                Valider le compte
              </Button>
            </div>
          </Card>
        );
      })()}

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Pièce d&apos;identité</h2>
        <p className="text-sm text-gray-500 mb-4">
          Documents KYC pour la vérification et l&apos;activation du compte client. Consultez les images en grand pour valider les informations.
        </p>
        {client.pieceIdentiteRectoUrl || client.pieceIdentiteVersoUrl ? (
          <div className="flex flex-wrap gap-8">
            {client.pieceIdentiteRectoUrl && (
              <div className="flex flex-col">
                <span className="block text-sm font-medium text-gray-700 mb-2">Recto</span>
                <a href={client.pieceIdentiteRectoUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 hover:border-primary-300 transition-colors">
                  <img
                    src={client.pieceIdentiteRectoUrl}
                    alt="Recto pièce d'identité"
                    className="w-full max-w-sm min-w-[240px] h-auto max-h-72 object-contain"
                  />
                </a>
                <div className="mt-2 flex flex-wrap gap-4">
                  <a href={client.pieceIdentiteRectoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline font-medium">
                    <HiOutlineArrowsPointingOut className="h-4 w-4" /> Ouvrir en grand
                  </a>
                  <a href={client.pieceIdentiteRectoUrl} download="piece-identite-recto.jpg" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
                    <HiOutlineArrowDownTray className="h-4 w-4" /> Télécharger
                  </a>
                </div>
              </div>
            )}
            {client.pieceIdentiteVersoUrl && (
              <div className="flex flex-col">
                <span className="block text-sm font-medium text-gray-700 mb-2">Verso</span>
                <a href={client.pieceIdentiteVersoUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 hover:border-primary-300 transition-colors">
                  <img
                    src={client.pieceIdentiteVersoUrl}
                    alt="Verso pièce d'identité"
                    className="w-full max-w-sm min-w-[240px] h-auto max-h-72 object-contain"
                  />
                </a>
                <div className="mt-2 flex flex-wrap gap-4">
                  <a href={client.pieceIdentiteVersoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline font-medium">
                    <HiOutlineArrowsPointingOut className="h-4 w-4" /> Ouvrir en grand
                  </a>
                  <a href={client.pieceIdentiteVersoUrl} download="piece-identite-verso.jpg" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
                    <HiOutlineArrowDownTray className="h-4 w-4" /> Télécharger
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
            Aucune pièce d&apos;identité enregistrée. Les images recto/verso sont requises pour la vérification KYC et l&apos;activation du compte. Modifiez les informations du client pour les ajouter.
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Informations</h2>
          {canEditClient(currentUser?.role) && (
          !editingInfo ? (
            <Button variant="secondary" size="sm" onClick={() => setEditingInfo(true)}>
              <HiOutlinePencil className="h-4 w-4" /> Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormNom(client.nom ?? '');
                  setFormPrenom(client.prenom ?? '');
                  setFormTelephone(client.telephone ?? '');
                  setFormTelephoneSecondaire(client.telephoneSecondaire ?? '');
                  setFormEmail(client.email ?? '');
                  setFormAdresse(client.adresse ?? '');
                  setFormVille(client.ville ?? '');
                  setFormQuartier(client.quartier ?? '');
                  setFormPays(client.pays ?? '');
                  setFormIdZone(client.idZone ?? '');
                  setFormIdAgence(client.idAgence ?? '');
                  setFormPieceIdentiteRectoUrl(client.pieceIdentiteRectoUrl ?? '');
                  setFormPieceIdentiteVersoUrl(client.pieceIdentiteVersoUrl ?? '');
                  setFormGenre(client.genre ?? '');
                  setFormDateNaissance(client.dateNaissance ? client.dateNaissance.toString().slice(0, 10) : '');
                  setFormLieuNaissance(client.lieuNaissance ?? '');
                  setFormNationalite(client.nationalite ?? '');
                  setFormSituationMatrimoniale(client.situationMatrimoniale ?? '');
                  setFormProfession(client.profession ?? '');
                  setFormTypePieceIdentite(client.typePieceIdentite ?? '');
                  setFormNumeroPieceIdentite(client.numeroPieceIdentite ?? '');
                  setFormDateDelivrancePiece(client.dateDelivrancePiece ? client.dateDelivrancePiece.toString().slice(0, 10) : '');
                  setFormDateExpirationPiece(client.dateExpirationPiece ? client.dateExpirationPiece.toString().slice(0, 10) : '');
                  setFormLieuDelivrancePiece(client.lieuDelivrancePiece ?? '');
                  setFormNomPersonneReference(client.nomPersonneReference ?? '');
                  setFormTelephonePersonneReference(client.telephonePersonneReference ?? '');
                  setFormRelationPersonneReference(client.relationPersonneReference ?? '');
                  setFormAdressePersonneReference(client.adressePersonneReference ?? '');
                  setFormNotes(client.notes ?? '');
                  setFormTypeClient(client.typeClient ?? 'PERSONNE_PHYSIQUE');
                  setFormNombreMembres(client.nombreMembres != null ? String(client.nombreMembres) : '');
                  setEditingInfo(false);
                }}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={handleSaveInfo} isLoading={submittingInfo}>Enregistrer</Button>
            </div>
          )
          )}
        </div>
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
          {canEditClient(currentUser?.role) && editingInfo ? (
            <ImageUpload
              value={client.photoUrl}
              onChange={onClientPhotoChange}
              editable
              placeholderType="initials"
              placeholderText={[client.nom, client.prenom].filter(Boolean).map((x) => x?.charAt(0)).join('').toUpperCase() || '?'}
              folder="collect_app/clients"
              size="md"
              shape="circle"
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
                {client.photoUrl ? (
                  <img src={client.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  [client.nom, client.prenom].filter(Boolean).map((x) => x?.charAt(0)).join('').toUpperCase() || '?'
                )}
              </div>
              {client.photoUrl && (
                <a href={client.photoUrl} download="photo-client.jpg" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                  <HiOutlineArrowDownTray className="h-3.5 w-3.5" /> Télécharger
                </a>
              )}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{[client.nom, client.prenom].filter(Boolean).join(' ') || client.codeClient}</p>
            <p className="text-sm text-gray-500">{client.codeClient}</p>
          </div>
        </div>
        {!editingInfo ? (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><dt className="text-sm text-gray-500">Nom</dt><dd className="text-gray-900">{client.nom || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Prénom</dt><dd className="text-gray-900">{client.prenom || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Type client</dt><dd className="text-gray-900">{client.typeClient === 'GROUPEMENT' ? 'Groupement' : 'Personne physique'}</dd></div>
            {client.typeClient === 'GROUPEMENT' && (
              <div><dt className="text-sm text-gray-500">Nombre de membres</dt><dd className="text-gray-900">{client.nombreMembres ?? '—'}</dd></div>
            )}
            <div><dt className="text-sm text-gray-500">Genre</dt><dd className="text-gray-900">{client.genre === 'MASCULIN' ? 'Masculin' : client.genre === 'FEMININ' ? 'Féminin' : client.genre || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Date de naissance</dt><dd className="text-gray-900">{client.dateNaissance ? format(new Date(client.dateNaissance), 'dd MMM yyyy', { locale: fr }) : '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Lieu de naissance</dt><dd className="text-gray-900">{client.lieuNaissance || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Nationalité</dt><dd className="text-gray-900">{client.nationalite || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Profession</dt><dd className="text-gray-900">{client.profession || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Situation matrimoniale</dt><dd className="text-gray-900">{client.situationMatrimoniale === 'CELIBATAIRE' ? 'Célibataire' : client.situationMatrimoniale === 'MARIE' ? 'Marié(e)' : client.situationMatrimoniale === 'DIVORCE' ? 'Divorcé(e)' : client.situationMatrimoniale === 'VEUF' ? 'Veuf(ve)' : client.situationMatrimoniale || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Téléphone</dt><dd className="text-gray-900">{client.telephone || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Téléphone secondaire</dt><dd className="text-gray-900">{client.telephoneSecondaire || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Email</dt><dd className="text-gray-900">{client.email || '—'}</dd></div>
            <div className="md:col-span-2"><dt className="text-sm text-gray-500">Adresse</dt><dd className="text-gray-900">{client.adresse || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Ville</dt><dd className="text-gray-900">{client.ville || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Quartier</dt><dd className="text-gray-900">{client.quartier || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Pays</dt><dd className="text-gray-900">{client.pays || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Agence</dt>
              <dd className="mt-0.5">
                <Badge variant="info">
                  {client.agence?.nom ?? agences.find((a) => a.id === client.idAgence)?.nom ?? (client.idAgence ? '—' : 'Non assignée')}
                </Badge>
              </dd>
            </div>
            <div><dt className="text-sm text-gray-500">Zone</dt>
              <dd className="text-gray-900">
                {client.zone?.nom ?? zones.find((z) => z.id === client.idZone)?.nom ?? (client.idZone ? '—' : 'Non assignée')}
              </dd>
            </div>
            <div><dt className="text-sm text-gray-500">Collecteur assigné</dt>
              <dd className="mt-0.5">
                <Badge variant="info">
                  {client.collecteur?.utilisateur?.nom ?? client.collecteur?.codeCollecteur ?? 'Aucun'}
                </Badge>
              </dd>
            </div>
            {hasAdhesionEpargne && (
              <div className="md:col-span-2 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-4 ring-1 ring-emerald-100/50">
                <dt className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">$</span>
                  Solde
                  <InfoTooltip
                    content={
                      <>
                        <strong>Épargne disponible</strong> sur le compte client (en XAF).
                        <br /><br />
                        <strong>Calcul :</strong> somme des collectes validées, moins les retraits effectués. Seules les collectes validées augmentent le solde ; les retraits validés le diminuent.
                        <br /><br />
                        Le client peut consulter son solde sur l&apos;app mobile et demander un retrait (sous conditions : période minimale, commission, etc.).
                      </>
                    }
                  />
                </dt>
                <dd className="text-emerald-900 font-bold text-lg">
                  {Number(client.solde).toLocaleString('fr-FR')} XAF
                </dd>
              </div>
            )}
            {score !== null && hasAdhesionCredit && (
              <div className="md:col-span-2 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
                <dt className="text-sm font-semibold text-primary-800 mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">#</span>
                  Score client
                  <InfoTooltip
                    content={
                      <>
                        <strong>Indicateur de confiance (0–100)</strong> utilisé pour l&apos;aide à la décision crédit.
                        <br /><br />
                        <strong>Calcul :</strong> base 50, puis +2 pts par collecte validée (max +25), −10 pts par échéance en retard (max −40), +1 pt par mois d&apos;ancienneté (max +15).
                        <br /><br />
                        Un score élevé reflète un bon historique de collectes et peu de retards de remboursement.
                      </>
                    }
                  />
                </dt>
                <dd className="flex flex-wrap items-center gap-3">
                  <Badge variant="info" className="text-base font-bold px-3 py-1">
                    {score.score} / 100
                  </Badge>
                  <span className="text-sm text-gray-600 border-l border-gray-300 pl-3">
                    Collectes validées : <strong>{score.details.nbCollectesValidees}</strong>
                    {' · '}Échéances en retard : <strong>{score.details.nbEcheancesEnRetard}</strong>
                    {' · '}Ancienneté : <strong>{score.details.moisAnciennete} mois</strong>
                  </span>
                </dd>
              </div>
            )}
            <div><dt className="text-sm text-gray-500">Type pièce d&apos;identité</dt><dd className="text-gray-900">{client.typePieceIdentite === 'CNI' ? 'CNI' : client.typePieceIdentite === 'PASSEPORT' ? 'Passeport' : client.typePieceIdentite === 'PERMIS_CONDUIRE' ? 'Permis de conduire' : client.typePieceIdentite === 'CARTE_SEJOUR' ? 'Carte de séjour' : client.typePieceIdentite === 'AUTRE' ? 'Autre' : client.typePieceIdentite || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">N° pièce d&apos;identité</dt><dd className="text-gray-900">{client.numeroPieceIdentite || '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Date délivrance pièce</dt><dd className="text-gray-900">{client.dateDelivrancePiece ? format(new Date(client.dateDelivrancePiece), 'dd MMM yyyy', { locale: fr }) : '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Date expiration pièce</dt><dd className="text-gray-900">{client.dateExpirationPiece ? format(new Date(client.dateExpirationPiece), 'dd MMM yyyy', { locale: fr }) : '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Lieu délivrance pièce</dt><dd className="text-gray-900">{client.lieuDelivrancePiece || '—'}</dd></div>
            <div className="md:col-span-2"><dt className="text-sm text-gray-500">Personne de référence</dt>
              <dd className="text-gray-900">
                {client.nomPersonneReference || client.telephonePersonneReference || client.relationPersonneReference ? (
                  <span>{client.nomPersonneReference || '—'}{client.telephonePersonneReference && ` • ${client.telephonePersonneReference}`}{client.relationPersonneReference && ` • ${client.relationPersonneReference}`}</span>
                ) : '—'}
              </dd>
            </div>
            {client.adressePersonneReference && (
              <div className="md:col-span-2"><dt className="text-sm text-gray-500">Adresse personne de référence</dt><dd className="text-gray-900">{client.adressePersonneReference}</dd></div>
            )}
            {client.notes && (
              <div className="md:col-span-2"><dt className="text-sm text-gray-500">Notes</dt><dd className="text-gray-900 whitespace-pre-wrap">{client.notes}</dd></div>
            )}
            <div><dt className="text-sm text-gray-500">Créé le</dt><dd className="text-gray-900">{format(new Date(client.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}</dd></div>
          </dl>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de client</label>
              <Select value={formTypeClient} onChange={(e) => setFormTypeClient(e.target.value)}>
                <option value="PERSONNE_PHYSIQUE">Personne physique</option>
                <option value="GROUPEMENT">Groupement</option>
              </Select>
            </div>
            {formTypeClient === 'GROUPEMENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de membres</label>
                <input
                  type="number"
                  min={2}
                  value={formNombreMembres}
                  onChange={(e) => setFormNombreMembres(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                value={formPrenom}
                onChange={(e) => setFormPrenom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <Select value={formGenre} onChange={(e) => setFormGenre(e.target.value)}>
                <option value="">—</option>
                <option value="MASCULIN">Masculin</option>
                <option value="FEMININ">Féminin</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              <input
                type="date"
                value={formDateNaissance}
                onChange={(e) => setFormDateNaissance(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
              <input
                type="text"
                value={formLieuNaissance}
                onChange={(e) => setFormLieuNaissance(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationalité</label>
              <NationaliteCombobox
                label=""
                value={formNationalite}
                onChange={setFormNationalite}
                placeholder="Rechercher ou sélectionner..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Situation matrimoniale</label>
              <Select value={formSituationMatrimoniale} onChange={(e) => setFormSituationMatrimoniale(e.target.value)}>
                <option value="">—</option>
                <option value="CELIBATAIRE">Célibataire</option>
                <option value="MARIE">Marié(e)</option>
                <option value="DIVORCE">Divorcé(e)</option>
                <option value="VEUF">Veuf(ve)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
              <input
                type="text"
                value={formProfession}
                onChange={(e) => setFormProfession(e.target.value)}
                placeholder="Ex: Commerçant"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <PhoneInput
              label="Téléphone *"
              value={formTelephone}
              onChange={setFormTelephone}
            />
            <PhoneInput
              label="Téléphone secondaire"
              value={formTelephoneSecondaire}
              onChange={setFormTelephoneSecondaire}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={formAdresse}
                onChange={(e) => setFormAdresse(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={formVille}
                onChange={(e) => setFormVille(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
              <input
                type="text"
                value={formQuartier}
                onChange={(e) => setFormQuartier(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <NationaliteCombobox
                label=""
                value={formPays}
                onChange={setFormPays}
                placeholder="Rechercher ou sélectionner..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type pièce d&apos;identité</label>
              <Select value={formTypePieceIdentite} onChange={(e) => setFormTypePieceIdentite(e.target.value)}>
                <option value="">—</option>
                <option value="CNI">CNI</option>
                <option value="PASSEPORT">Passeport</option>
                <option value="AUTRE">Autre</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° pièce d&apos;identité</label>
              <input
                type="text"
                value={formNumeroPieceIdentite}
                onChange={(e) => setFormNumeroPieceIdentite(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date délivrance pièce</label>
              <input
                type="date"
                value={formDateDelivrancePiece}
                onChange={(e) => setFormDateDelivrancePiece(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date expiration pièce</label>
              <input
                type="date"
                value={formDateExpirationPiece}
                onChange={(e) => setFormDateExpirationPiece(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu délivrance pièce</label>
              <input
                type="text"
                value={formLieuDelivrancePiece}
                onChange={(e) => setFormLieuDelivrancePiece(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom personne de référence</label>
              <input
                type="text"
                value={formNomPersonneReference}
                onChange={(e) => setFormNomPersonneReference(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <PhoneInput
              label="Téléphone personne de référence"
              value={formTelephonePersonneReference}
              onChange={setFormTelephonePersonneReference}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relation personne de référence</label>
              <input
                type="text"
                value={formRelationPersonneReference}
                onChange={(e) => setFormRelationPersonneReference(e.target.value)}
                placeholder="Ex: Parent, conjoint"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse personne de référence</label>
              <input
                type="text"
                value={formAdressePersonneReference}
                onChange={(e) => setFormAdressePersonneReference(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={3}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agence</label>
              {canEditAgence(currentUser?.role) ? (
                <>
                  <Select
                    value={formIdAgence}
                    onChange={(e) => setFormIdAgence(e.target.value)}
                  >
                    <option value="">— Aucune —</option>
                    {agences.map((a) => (
                      <option key={a.id} value={a.id}>{a.nom}</option>
                    ))}
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Seuls Admin et Chef d&apos;agence peuvent modifier l&apos;agence.</p>
                </>
              ) : (
                <Badge variant="info">
                  {client?.agence?.nom ?? agences.find((a) => a.id === formIdAgence || a.id === client?.idAgence)?.nom ?? (client?.idAgence ? '—' : 'Non assignée')}
                </Badge>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <Select
                value={formIdZone}
                onChange={(e) => setFormIdZone(e.target.value)}
              >
                <option value="">— Aucune —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.nom}</option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">La zone détermine quels collecteurs voient ce client dans l&apos;app mobile.</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Pièce d&apos;identité (recto / verso)</p>
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Recto</label>
                  <ImageUpload
                    value={formPieceIdentiteRectoUrl || undefined}
                    onChange={(url) => setFormPieceIdentiteRectoUrl(url)}
                    editable
                    placeholderType="user"
                    placeholderText="Recto"
                    folder="collect_app/clients/piece_identite"
                    size="lg"
                    shape="square"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Verso</label>
                  <ImageUpload
                    value={formPieceIdentiteVersoUrl || undefined}
                    onChange={(url) => setFormPieceIdentiteVersoUrl(url)}
                    editable
                    placeholderType="user"
                    placeholderText="Verso"
                    folder="collect_app/clients/piece_identite"
                    size="lg"
                    shape="square"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {!client.idUtilisateur && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Compte app mobile</h2>
          <p className="text-sm text-gray-500 mb-4">
            Ce client n&apos;a pas encore de compte pour l&apos;application mobile. Vous pouvez lui en créer un : il pourra se connecter avec son <strong>numéro de téléphone</strong> (ci-dessus) et un mot de passe que vous définissez. Vérifiez que le téléphone du client est bien renseigné avant de créer le compte.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowRemettreAcces(true)}
            title="Créer un compte (téléphone + mot de passe) pour ce client"
          >
            Créer un compte pour l&apos;app mobile
          </Button>
        </Card>
      )}

      {client.idUtilisateur && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Compte de connexion</h2>
          <p className="text-sm text-gray-500 mb-4">
            Ce client dispose d&apos;un compte pour se connecter (web et mobile). Connexion possible avec <strong>téléphone + mot de passe</strong>. Vous pouvez remettre les accès en définissant un nouveau mot de passe, ou désactiver/réactiver le compte.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={(client.utilisateur?.actif ?? true) ? 'success' : 'neutral'}>
              {(client.utilisateur?.actif ?? true) ? 'Compte actif' : 'Compte désactivé'}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRemettreAcces(true)}
              title="Définir un nouveau mot de passe et le communiquer au client"
            >
              Remettre les accès
            </Button>
            <Button
              variant={(client.utilisateur?.actif ?? true) ? 'secondary' : 'primary'}
              size="sm"
              onClick={(client.utilisateur?.actif ?? true) ? () => setShowConfirmDesactiverCompte(true) : handleToggleCompteConnexion}
              isLoading={togglingCompte}
              title={(client.utilisateur?.actif ?? true) ? 'Désactiver le compte (le client ne pourra plus se connecter)' : 'Activer le compte'}
            >
              {(client.utilisateur?.actif ?? true) ? 'Désactiver le compte' : 'Activer le compte'}
            </Button>
          </div>
        </Card>
      )}

      <Modal
        open={showRemettreAcces}
        onClose={() => { setShowRemettreAcces(false); setNouveauMotDePasse(''); }}
        title={client.idUtilisateur ? 'Remettre les accès au client' : 'Créer un compte pour l\'app mobile'}
        size="sm"
      >
        <p className="text-gray-600 text-sm mb-4">
          {client.idUtilisateur ? (
            <>Définissez un nouveau mot de passe pour <strong>{client.nom} {client.prenom}</strong>. Le client pourra se connecter à l&apos;app mobile avec son numéro de téléphone et ce mot de passe. Communiquez-le-lui de manière sécurisée.</>
          ) : (
            <>Créez un compte pour <strong>{client.nom} {client.prenom}</strong>. Le client pourra se connecter à l&apos;app mobile avec son numéro de téléphone (<strong>{client.telephone || '—'}</strong>) et le mot de passe ci-dessous. Vérifiez que le téléphone est correct avant de valider.</>
          )}
        </p>
        <div className="mb-4">
          <Input
            type="password"
            passwordToggle
            label="Nouveau mot de passe *"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            placeholder="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => { setShowRemettreAcces(false); setNouveauMotDePasse(''); }}>Annuler</Button>
          <Button onClick={handleRemettreAcces} isLoading={submittingRemettreAcces} disabled={nouveauMotDePasse.length < 8}>
            {client.idUtilisateur ? 'Enregistrer le mot de passe' : 'Créer le compte'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={showConfirmDesactiverCompte}
        onClose={() => setShowConfirmDesactiverCompte(false)}
        title="Désactiver le compte client"
        size="sm"
      >
        <p className="text-gray-600 text-sm">
          Confirmer la désactivation du compte de connexion de <strong>{client.nom} {client.prenom}</strong> ? Le client ne pourra plus se connecter sur le web ni sur l&apos;application mobile.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={() => setShowConfirmDesactiverCompte(false)}>Annuler</Button>
          <Button variant="secondary" onClick={handleToggleCompteConnexion} isLoading={togglingCompte}>Désactiver le compte</Button>
        </div>
      </Modal>

      <Modal
        open={showConfirmResilier}
        onClose={() => setShowConfirmResilier(false)}
        title="Marquer le client comme résilié"
        size="sm"
      >
        <p className="text-gray-600 text-sm">
          Confirmer que vous souhaitez marquer <strong>{client.nom} {client.prenom}</strong> comme résilié ? Le client ne pourra plus être utilisé pour de nouvelles collectes ou souscriptions.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={() => setShowConfirmResilier(false)}>Annuler</Button>
          <Button variant="secondary" onClick={handleMarquerResilie} isLoading={submitting}>Marquer résilié</Button>
        </div>
      </Modal>

      <Modal
        open={showConfirmRemettreActif}
        onClose={() => setShowConfirmRemettreActif(false)}
        title="Remettre le client en statut actif"
        size="sm"
      >
        <p className="text-gray-600 text-sm">
          Confirmer que vous souhaitez remettre <strong>{client.nom} {client.prenom}</strong> en statut actif ? Le client pourra à nouveau recevoir des souscriptions et participer aux collectes.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={() => setShowConfirmRemettreActif(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleRemettreActif} isLoading={submittingRemettreActif}>Remettre actif</Button>
        </div>
      </Modal>

      {isClientValidated(client) && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Produits (modules)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Liez d&apos;abord le client aux produits (Collecte, Épargne, Crédit) avant de pouvoir lui affecter des plans ou souscriptions.
          </p>
          <div className="flex flex-wrap gap-3">
            {modulesActives.map((mod) => (
              <div key={mod} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2">
                <span className="font-medium text-gray-900">{MODULE_LABELS[mod]}</span>
                {hasAdhesion(mod) ? (
                  <>
                    <Badge variant="success">Lié</Badge>
                    {canEditClient(currentUser?.role) && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveAdhesion(mod)} disabled={!!submittingAdhesion} isLoading={submittingAdhesion === mod}>
                        Retirer
                      </Button>
                    )}
                  </>
                ) : (
                  canEditClient(currentUser?.role) && (
                    <Button variant="secondary" size="sm" onClick={() => handleAddAdhesion(mod)} disabled={!!submittingAdhesion} isLoading={submittingAdhesion === mod}>
                      Lier
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Souscriptions (plans de collecte)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Une fois le client lié au produit Collecte, vous pouvez lui affecter des plans (1000 F/jour, 2000 F/jour, etc.). Chaque souscription permet au collecteur d&apos;enregistrer des collectes avec montant prédéfini.
        </p>
        {!isClientValidated(client) ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
            Le client doit être validé par le chef d&apos;agence ou le gestionnaire avant de pouvoir lui affecter des produits. Validez le compte ci-dessus pour activer les souscriptions.
          </div>
        ) : !hasAdhesionCollecte ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
            Liez d&apos;abord le client au produit <strong>Collecte</strong> dans la section « Produits (modules) » ci-dessus, puis vous pourrez lui affecter des plans (1000 F, 2000 F, etc.).
          </div>
        ) : souscriptions.length === 0 ? (
          <p className="text-gray-500 mb-3">Aucun plan de collecte assigné. Ajoutez une souscription (ex. 1000 F/jour, 2000 F/jour) pour que le collecteur puisse enregistrer des collectes.</p>
        ) : (
          <ul className="divide-y divide-gray-100 mb-4">
            {souscriptions.map((s: Souscription) => (
              <li key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{s.produit?.nom ?? 'Produit'}</span>
                  <span className="ml-2 text-gray-500">
                    — {s.produit ? Number(s.produit.montantJournalier).toLocaleString('fr-FR') : '?'} FCFA/jour
                  </span>
                </div>
                <span className="text-gray-500">
                  Collecté : {Number(s.montantCollecte).toLocaleString('fr-FR')} / {Number(s.produit?.montantCible ?? s.montantCible).toLocaleString('fr-FR')} FCFA
                  {s.statut !== 'EN_COURS' && ` • ${s.statut}`}
                </span>
              </li>
            ))}
          </ul>
        )}
        {isClientValidated(client) && hasAdhesionCollecte && (
        <div className="flex flex-col gap-3 mt-4">
          {!showAddSouscription ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-fit"
              onClick={() => {
                setShowAddSouscription(true);
                loadProduits();
              }}
            >
              {souscriptions.length === 0 ? 'Ajouter un plan de collecte (souscription)' : 'Ajouter une souscription'}
            </Button>
          ) : (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-4">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Choisir un plan de collecte</label>
                <Select
                  value={selectedProduitId}
                  onChange={(e) => setSelectedProduitId(e.target.value)}
                  className="w-full"
                >
                  <option value="">— Plan (1000 F, 2000 F, etc.) —</option>
                  {produits
                    .filter((p) => TYPES_PLANS_COLLECTE.includes(p.type as TypeProduit) && p.actif !== false)
                    .filter((p) => !souscriptions.some((s: Souscription) => s.idProduit === p.id))
                    .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} — {Number(p.montantJournalier).toLocaleString('fr-FR')} FCFA/jour
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleAddSouscription}
                  disabled={!selectedProduitId || addingSouscription}
                  isLoading={addingSouscription}
                >
                  Valider
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowAddSouscription(false); setSelectedProduitId(''); }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des réaffectations</h2>
        {historique.length === 0 ? (
          <p className="text-gray-500">Aucune réaffectation enregistrée.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {historique.map((h) => (
              <li key={h.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-gray-700">
                  {h.collecteurAncien?.utilisateur?.nom ?? h.collecteurAncien?.codeCollecteur ?? '—'} → {h.collecteurNouveau?.utilisateur?.nom ?? h.collecteurNouveau?.codeCollecteur ?? '—'}
                </span>
                <span className="text-gray-500">
                  {format(new Date(h.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                  {h.utilisateurAuteur && ` par ${h.utilisateurAuteur.nom}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
