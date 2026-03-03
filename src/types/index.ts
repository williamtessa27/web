export * from './enums';

// ─── Utilisateur ──────────────────────────────────
export interface Utilisateur {
  id: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  genre?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  typePieceIdentite?: string;
  numeroPieceIdentite?: string;
  pieceIdentiteRecto?: string;
  pieceIdentiteVerso?: string;
  dateExpirationPiece?: string;
  role: import('./enums').RoleUtilisateur;
  authMode: 'LOCAL' | 'CENTRAL';
  idEntreprise?: string;
  idAgence?: string | null;
  agence?: Agence | null;
  entreprise?: Entreprise;
  photoProfilUrl?: string;
  actif: boolean;
  /** E8.1.1 — Date de validité du compte (optionnelle). Après cette date, la connexion est refusée. */
  dateFinValidite?: string | null;
  nombreConnexions: number;
  createdAt: string;
}

// ─── Entreprise ───────────────────────────────────
export interface Entreprise {
  id: string;
  nom: string;
  telephone?: string;
  emailContact?: string;
  description?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  codePostal?: string;
  secteurActivite?: string;
  rccm?: string;
  numeroFiscal?: string;
  siteWeb?: string;
  nbrEmployes?: number;
  dateCreationEntreprise?: string;
  logoUrl?: string;
  /** Sprint 12 — Branding white-label */
  couleurPrimaire?: string;
  couleurSecondaire?: string;
  nomCourt?: string;
  slogan?: string;
  devise: string;
  tauxCommissionDefaut: number;
  modeCommission?: import('./enums').ModeCommission;
  montantFixeCommissionParClient?: number;
  frequenceCollecte?: import('./enums').FrequenceCollecte;
  toleranceRetardJours?: number;
  validationCollecteManuelle?: boolean;
  autoriserModificationCollecte?: boolean;
  baseMensuelleCommission?: number;
  tauxCommissionNormale?: number;
  tauxCommissionRetraitAnticipe?: number;
  dureeMinJoursAvantRetrait?: number;
  montantMinCotisationJournaliere?: number;
  tauxInteretEpargne?: number;
  frequenceCalculInteret?: import('./enums').FrequenceCalculInteret | null;
  methodeCalculInteret?: import('./enums').MethodeCalculInteret | null;
  precisionArrondiInteret?: number;
  /** Modules activés (ex: COLLECTE, EPARGNE, CREDIT) */
  modulesActives?: string[];
  /** Sprint 8 — SMS confirmation collecte */
  smsConfirmationCollecte?: boolean;
  /** Sprint 8 — SMS rappel échéance crédit */
  smsRappelEcheance?: boolean;
  /** Sprint 13 — Archivage KYC : durée de rétention (années) des pièces d'identité. Null = pas de purge. */
  retentionKycAnnee?: number | null;
  /** Sprint 11 — Seuil minimum score client (0–100) pour octroi crédit. Null = non utilisé. */
  scoreSeuilCredit?: number | null;
  /** E8.2.2 — Politique mot de passe (longueur min, complexité). */
  motDePasseLongueurMin?: number;
  motDePasseExigerChiffre?: boolean;
  motDePasseExigerMajuscule?: boolean;
  motDePasseExigerSpecial?: boolean;
  /** E8.2.2 — Expiration MDP (jours). Null = pas d'expiration. */
  motDePasseExpirationJours?: number | null;
  /** E8.2.2 — Nombre de MDP à ne pas réutiliser. Null = pas de vérification. */
  motDePasseHistoriqueCount?: number | null;
  /** E8 — Crédit : seuil (montant) au-dessus duquel double validation obligatoire. Null = validation simple. */
  seuilMontantDoubleValidation?: number | null;
  /** Module 10 — Au-dessus de ce montant accordé, une assurance active est obligatoire avant octroi. Null = pas d'exigence. */
  seuilMontantCreditAssuranceObligatoire?: number | null;
  /** Date de fin de la période d'essai (Super Admin). Null = pas de limite. */
  dateFinEssai?: string | null;
  statut: import('./enums').StatutEntreprise;
  profilComplete: boolean;
  actif: boolean;
  createdAt: string;
}

// ─── Abonnement plateforme (SaaS) ─────────────────
export interface Abonnement {
  id: string;
  entrepriseId: string;
  montant: number;
  dateDebut: string;
  dateFin: string;
  dureeMois: number;
  createdBy?: string | null;
  createdAt: string;
}

// ─── Agence (Sprint 5) ───────────────────────────
export interface Agence {
  id: string;
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  idEntreprise: string;
  actif: boolean;
  zones?: Zone[];
  collecteurs?: Collecteur[];
  createdAt?: string;
}

// ─── Zone ─────────────────────────────────────────
export interface Zone {
  id: string;
  nom: string;
  description?: string;
  idEntreprise: string;
  idAgence?: string | null;
  agence?: Agence | null;
  actif: boolean;
  collecteurs?: Collecteur[];
  clients?: Client[];
}

// ─── Collecteur ───────────────────────────────────
export interface Collecteur {
  id: string;
  codeCollecteur: string;
  idUtilisateur: string;
  utilisateur?: Utilisateur;
  /** Zones assignées (un collecteur peut couvrir plusieurs zones) */
  zones?: Zone[];
  idAgence?: string | null;
  agence?: Agence | null;
  idEntreprise: string;
  tauxCommission: number;
  actif: boolean;
  createdAt: string;
}

// ─── Client (niveau bancaire) ────────────────────
/** Sprint 9 — Type client */
export type TypeClient = 'PERSONNE_PHYSIQUE' | 'GROUPEMENT';

export interface Client {
  id: string;
  codeClient: string;
  /** Sprint 9 — Type client (défaut: PERSONNE_PHYSIQUE) */
  typeClient?: TypeClient;
  /** Nombre de membres (groupement uniquement) */
  nombreMembres?: number | null;
  /** ID du client représentant (groupement) */
  idRepresentant?: string | null;
  representant?: Client | null;
  nom: string;
  prenom?: string;
  genre?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  situationMatrimoniale?: string;
  profession?: string;
  telephone?: string;
  telephoneSecondaire?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  quartier?: string;
  pays?: string;
  typePieceIdentite?: string;
  numeroPieceIdentite?: string;
  pieceIdentiteRectoUrl?: string;
  pieceIdentiteVersoUrl?: string;
  dateDelivrancePiece?: string;
  dateExpirationPiece?: string;
  lieuDelivrancePiece?: string;
  photoUrl?: string;
  nomPersonneReference?: string;
  telephonePersonneReference?: string;
  relationPersonneReference?: string;
  adressePersonneReference?: string;
  notes?: string;
  solde: number;
  idUtilisateur?: string;
  utilisateur?: Utilisateur;
  idCollecteur?: string;
  collecteur?: Collecteur;
  idAgence?: string | null;
  agence?: { id: string; nom: string } | null;
  idZone?: string;
  zone?: Zone;
  idEntreprise: string;
  statut?: import('./enums').StatutClient;
  actif: boolean;
  createdAt: string;
  souscriptions?: Souscription[];
  /** Adhésions aux produits microfinance (Collecte, Épargne, Crédit) */
  adhesionsProduits?: ClientProduitAdhesion[];
}

export type TypeModuleProduit = 'COLLECTE' | 'EPARGNE' | 'CREDIT';

export interface ClientProduitAdhesion {
  id: string;
  idClient: string;
  typeModule: TypeModuleProduit;
  idEntreprise: string;
  dateOuverture: string;
  actif: boolean;
  createdAt: string;
}

/** Sprint 11 — Score client (0–100) et détails */
export interface ClientScoreResult {
  score: number;
  details: {
    nbCollectesValidees: number;
    nbEcheancesEnRetard: number;
    moisAnciennete: number;
  };
}

export interface HistoriqueAffectationClient {
  id: string;
  idClient: string;
  idCollecteurAncien: string | null;
  collecteurAncien?: Collecteur | null;
  idCollecteurNouveau: string | null;
  collecteurNouveau?: Collecteur | null;
  idUtilisateurAuteur: string;
  utilisateurAuteur?: Utilisateur;
  createdAt: string;
}

// ─── Produit / Plan ───────────────────────────────
export interface Produit {
  id: string;
  nom: string;
  description?: string;
  type: import('./enums').TypeProduit;
  montantJournalier: number;
  dureeJours?: number;
  montantCible?: number;
  fraisRetenue: number;
  dureeBlocageJours?: number;
  objectifEpargne?: string;
  idEntreprise: string;
  actif: boolean;
  createdAt: string;
}

// ─── Crédit (Sprint 3) ─────────────────────────────
export interface DossierCredit {
  id: string;
  codeDossier: string;
  idClient: string;
  client?: Client;
  idProduit?: string | null;
  produit?: Produit | null;
  montantDemande: number;
  montantAccorde?: number | null;
  tauxInteret: number;
  dureeMois: number;
  frequenceRemboursement: import('./enums').FrequenceRemboursementCredit;
  fraisDossier: number;
  objetCredit?: string | null;
  motifRefus?: string | null;
  dateDemande: string;
  dateOctroi?: string | null;
  dateCloture?: string | null;
  statut: import('./enums').StatutDossierCredit;
  echeances?: Echeance[];
  createdAt: string;
}

export interface Echeance {
  id: string;
  idDossierCredit: string;
  numero: number;
  dateEcheance: string;
  montantCapital: number;
  montantInteret: number;
  montantTotal: number;
  montantPaye: number;
  datePaiement?: string | null;
  statut: import('./enums').StatutEcheance;
}

export interface SimulationEpargneResult {
  montantCotisations: number;
  montantInterets: number;
  montantBrut: number;
  fraisRetenue: number;
  montantNet: number;
  dateFin: string;
  dureeJours: number;
  montantJournalier: number;
  tauxInteret: number;
}

// ─── Souscription ─────────────────────────────────
export interface Souscription {
  id: string;
  codeSouscription: string;
  idClient: string;
  client?: Client;
  idProduit: string;
  produit?: Produit;
  dateDebut: string;
  dateFin?: string;
  montantCollecte: number;
  montantCible: number;
  joursCollectes: number;
  /** Cumul des intérêts crédités (E3.4) */
  montantInterets?: number;
  statut: import('./enums').StatutSouscription;
  idEntreprise: string;
  createdAt: string;
  /** Liste des collectes (rempli par GET /souscriptions/:id) */
  collectes?: Collecte[];
}

// ─── Mouvement compte (épargne : dépôt, retrait, commission, intérêt) ─
export type TypeMouvementCompte = 'COLLECTE' | 'RETRAIT' | 'COMMISSION' | 'INTERET' | 'AJUSTEMENT' | 'REMBOURSEMENT';

export interface MouvementCompte {
  id: string;
  idClient: string;
  type: TypeMouvementCompte;
  montant: number;
  soldeAvant: number;
  soldeApres: number;
  reference?: string | null;
  description?: string | null;
  idSouscription?: string | null;
  idAuteur?: string | null;
  idEntreprise: string;
  createdAt: string;
}

// ─── Collecte (paiement journalier) ───────────────
export interface Collecte {
  id: string;
  montant: number;
  dateCollecte: string;
  heureCollecte?: string;
  statut: import('./enums').StatutCollecte;
  latitude?: number;
  longitude?: number;
  note?: string;
  idClient: string;
  client?: Client;
  idCollecteur: string;
  collecteur?: Collecteur;
  idSouscription?: string;
  souscription?: Souscription;
  idTournee?: string;
  idEntreprise: string;
  createdAt: string;
}

// ─── Tournée ──────────────────────────────────────
export interface Tournee {
  id: string;
  idCollecteur: string;
  collecteur?: Collecteur;
  dateTournee: string;
  dateDebut: string;
  dateFin?: string;
  nombreClients: number;
  montantTotal: number;
  nombreCollectes: number;
  statut: import('./enums').StatutTournee;
  collectes?: Collecte[];
  idEntreprise: string;
  createdAt: string;
}

// ─── Clôture journalière ──────────────────────────
export interface ClotureJournaliere {
  id: string;
  idEntreprise: string;
  dateCloture: string;
  idUtilisateurCloture: string;
  utilisateurCloture?: Utilisateur;
  dateClotureAt: string;
  commentaire?: string;
}

export interface ClotureRecap {
  date: string;
  byCollecteur: Array<{
    idCollecteur: string;
    codeCollecteur: string;
    nomCollecteur: string;
    montantTotal: number;
    nombreCollectes: number;
  }>;
  totalMontant: number;
  totalCollectes: number;
}

/** E6.3.1 — Avance de fonds attribuée à un collecteur */
export interface AvanceCollecteur {
  id: string;
  idCollecteur: string;
  idEntreprise: string;
  montant: number;
  dateAvance: string;
  idUtilisateur: string;
  idAgence: string | null;
  commentaire: string | null;
  createdAt: string;
  collecteur?: { id: string; codeCollecteur: string; utilisateur?: { nom?: string } };
}

/** E5.3 / E6.3 — Rapprochement collecte terrain vs caisse agence (par date) */
export interface RapprochementLigne {
  idCollecteur: string;
  codeCollecteur: string;
  nomCollecteur: string;
  montantTerrain: number;
  montantDepose: number | null;
  ecart: number;
  nombreCollectes: number;
}

export interface RapprochementResponse {
  date: string;
  lignes: RapprochementLigne[];
}

// ─── Audit ─────────────────────────────────────────
export type AuditEntityType = 'ENTREPRISE' | 'UTILISATEUR' | 'CLIENT' | 'COLLECTE' | 'CLOTURE' | 'DEMANDE_RETRAIT';
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'VALIDATE'
  | 'REJECT'
  | 'CLOTURE'
  | 'REAFFECTATION'
  | 'CANCEL'
  | 'SOFT_DELETE'
  | 'CHANGEMENT_AGENCE';

export interface AuditLog {
  id: string;
  idUtilisateur: string;
  idEntreprise: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  oldState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  createdAt: string;
  utilisateur?: { nom: string; prenom?: string; email: string };
}

// ─── Commission (legacy collecteur) ───────────────
export interface Commission {
  id: string;
  idCollecteur: string;
  collecteur?: Collecteur;
  montant: number;
  montantCollectesBase: number;
  tauxApplique: number;
  periode: import('./enums').PeriodeCommission;
  dateDebut: string;
  dateFin: string;
  statut: import('./enums').StatutCommission;
  datePaiement?: string;
  idEntreprise: string;
  createdAt: string;
}

// ─── Commission entreprise (Sprint 10b) ───────────
export interface CommissionEntreprise {
  id: string;
  idEntreprise: string;
  montantCotiseTotal: number;
  tauxApplique: number;
  montantCommission: number;
  periode: import('./enums').PeriodeCommission;
  dateDebut: string;
  dateFin: string;
  statut: import('./enums').StatutCommission;
  datePaiement?: string;
  createdAt: string;
}

// ─── Demande de retrait ───────────────────────────
export interface DemandeRetrait {
  id: string;
  idClient: string;
  client?: Client;
  idSouscription?: string;
  souscription?: Souscription;
  montantDemande: number;
  dateDemande: string;
  statut: import('./enums').StatutDemandeRetrait;
  typeRetrait: import('./enums').TypeRetrait;
  commissionPrelevee?: number;
  dateTraitement?: string;
  idUtilisateurTraitant?: string;
  motifRefus?: string;
  idEntreprise: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────
export interface Notification {
  id: string;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  idDestinataire?: string;
  idUtilisateur?: string | null;
  idEntite?: string | null;
  typeEntite?: string | null;
  createdAt: string;
}

// ─── Pagination ───────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Auth ─────────────────────────────────────────
/** Connexion par email (admin, gestionnaire, super admin) ou par téléphone E.164 (collecteur, client). */
export interface LoginCredentials {
  email?: string;
  telephone?: string;
  motDePasse: string;
}

export interface LoginResponse {
  utilisateur: Utilisateur;
  token: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  motDePasse: string;
  confirmMotDePasse: string;
}

export interface RegisterResponse {
  utilisateur: Utilisateur;
  entreprise: Entreprise;
  token: string;
}

export interface CompleteEntrepriseRequest {
  nom: string;
  telephone: string;
  ville: string;
  pays: string;
  secteurActivite: string;
  emailContact?: string;
  description?: string;
  adresse?: string;
  codePostal?: string;
  rccm?: string;
  numeroFiscal?: string;
  siteWeb?: string;
  nbrEmployes?: number;
  dateCreationEntreprise?: string;
  devise?: string;
  tauxCommissionDefaut?: number;
}

/** Données modifiables depuis la page Paramètres (profil + paramétrage métier). */
export interface ParametresEntrepriseRequest extends CompleteEntrepriseRequest {
  modeCommission?: import('./enums').ModeCommission;
  montantFixeCommissionParClient?: number;
  frequenceCollecte?: import('./enums').FrequenceCollecte;
  toleranceRetardJours?: number;
  validationCollecteManuelle?: boolean;
  autoriserModificationCollecte?: boolean;
  baseMensuelleCommission?: number;
  tauxCommissionNormale?: number;
  tauxCommissionRetraitAnticipe?: number;
  dureeMinJoursAvantRetrait?: number;
  montantMinCotisationJournaliere?: number;
  tauxInteretEpargne?: number;
  frequenceCalculInteret?: import('./enums').FrequenceCalculInteret | null;
  methodeCalculInteret?: import('./enums').MethodeCalculInteret | null;
  precisionArrondiInteret?: number;
  /** Modules activés (ex: COLLECTE, EPARGNE, CREDIT) */
  modulesActives?: string[];
  /** Sprint 8 — SMS confirmation collecte */
  smsConfirmationCollecte?: boolean;
  /** Sprint 8 — SMS rappel échéance crédit */
  smsRappelEcheance?: boolean;
  /** Sprint 13 — Archivage KYC : durée de rétention (années). Null = pas de purge. */
  retentionKycAnnee?: number | null;
  /** Sprint 11 — Seuil minimum score client pour octroi crédit (0–100). Null = non utilisé. */
  scoreSeuilCredit?: number | null;
  /** E8 — Crédit : seuil montant double validation. Null = validation simple. */
  seuilMontantDoubleValidation?: number | null;
  /** Module 10 — Seuil montant au-dessus duquel une assurance active est obligatoire avant octroi. Null = pas d'exigence. */
  seuilMontantCreditAssuranceObligatoire?: number | null;
  /** E8.2.2 — Politique mot de passe */
  motDePasseLongueurMin?: number;
  motDePasseExigerChiffre?: boolean;
  motDePasseExigerMajuscule?: boolean;
  motDePasseExigerSpecial?: boolean;
  motDePasseExpirationJours?: number | null;
  motDePasseHistoriqueCount?: number | null;
  /** Sprint 12 — Branding white-label */
  logoUrl?: string;
  couleurPrimaire?: string;
  couleurSecondaire?: string;
  nomCourt?: string;
  slogan?: string;
}

// ─── Création utilisateur générique ──────────────
export interface CreateUtilisateurRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  motDePasse: string;
  role: import('./enums').RoleUtilisateur;
  idAgence?: string | null;
}

// ─── Création Gestionnaire ───────────────────────
export interface CreateGestionnaireRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  genre?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  adresse?: string;
  ville?: string;
  typePieceIdentite?: string;
  numeroPieceIdentite?: string;
}

// ─── Création Collecteur complet ─────────────────
export interface CreateCollecteurRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  genre?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  adresse?: string;
  ville?: string;
  typePieceIdentite?: string;
  numeroPieceIdentite?: string;
  zoneIds?: string[];
  /** @deprecated Préférer zoneIds */
  idZone?: string;
  idAgence?: string;
  tauxCommission?: number;
}

// ─── Création Client détaillé ────────────────────
export interface CreateClientRequest {
  /** Sprint 9 — Type client (défaut: PERSONNE_PHYSIQUE) */
  typeClient?: TypeClient;
  nombreMembres?: number;
  idRepresentant?: string;
  nom: string;
  prenom?: string;
  telephone: string;
  genre?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  situationMatrimoniale?: string;
  profession?: string;
  telephoneSecondaire?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  quartier?: string;
  pays?: string;
  typePieceIdentite?: string;
  numeroPieceIdentite?: string;
  dateDelivrancePiece?: string;
  dateExpirationPiece?: string;
  lieuDelivrancePiece?: string;
  /** URL de l'image recto de la pièce d'identité (upload). */
  pieceIdentiteRectoUrl?: string;
  /** URL de l'image verso de la pièce d'identité (upload). */
  pieceIdentiteVersoUrl?: string;
  nomPersonneReference?: string;
  telephonePersonneReference?: string;
  relationPersonneReference?: string;
  adressePersonneReference?: string;
  notes?: string;
  idAgence: string;
  idCollecteur?: string;
  idZone?: string;
  /** Mot de passe pour créer un accès app mobile (connexion téléphone + mot de passe). Si fourni, un compte utilisateur Client est créé. */
  motDePasse?: string;
  souscriptions?: { idProduit: string; dateDebut?: string }[];
}

// ─── Upload ──────────────────────────────────────
export interface UploadResponse {
  url: string;
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}
