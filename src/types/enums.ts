export enum RoleUtilisateur {
  SuperAdmin = 'SuperAdmin',
  AdminEntreprise = 'AdminEntreprise',
  Directeur = 'Directeur',
  ChefAgence = 'ChefAgence',
  Gestionnaire = 'Gestionnaire',
  GestionnaireCredit = 'GestionnaireCredit',
  Caissier = 'Caissier',
  Collecteur = 'Collecteur',
  Auditeur = 'Auditeur',
  Client = 'Client',
}

export enum StatutEntreprise {
  EN_ATTENTE = 'EN_ATTENTE',
  ACTIVE = 'ACTIVE',
  SUSPENDUE = 'SUSPENDUE',
  BLOQUEE = 'BLOQUEE',
}

export enum Genre {
  MASCULIN = 'MASCULIN',
  FEMININ = 'FEMININ',
}

export enum TypePieceIdentite {
  CNI = 'CNI',
  PASSEPORT = 'PASSEPORT',
  PERMIS_CONDUIRE = 'PERMIS_CONDUIRE',
  CARTE_SEJOUR = 'CARTE_SEJOUR',
  AUTRE = 'AUTRE',
}

export enum SituationMatrimoniale {
  CELIBATAIRE = 'CELIBATAIRE',
  MARIE = 'MARIE',
  DIVORCE = 'DIVORCE',
  VEUF = 'VEUF',
}

export enum TypeProduit {
  EPARGNE = 'EPARGNE',
  EPARGNE_BLOQUEE = 'EPARGNE_BLOQUEE',
  EPARGNE_PROGRAMMEE = 'EPARGNE_PROGRAMMEE',
  TONTINE = 'TONTINE',
  PRET = 'PRET',
  LIBRE = 'LIBRE',
}

export enum StatutSouscription {
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
  EN_ATTENTE = 'EN_ATTENTE',
}

export enum StatutCollecte {
  VALIDEE = 'VALIDEE',
  EN_ATTENTE = 'EN_ATTENTE',
  REJETEE = 'REJETEE',
  ANNULEE = 'ANNULEE',
}

export enum StatutTournee {
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
}

export enum StatutClient {
  EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  RESILIE = 'RESILIE',
}

export enum StatutCommission {
  CALCULEE = 'CALCULEE',
  PAYEE = 'PAYEE',
  ANNULEE = 'ANNULEE',
}

export enum PeriodeCommission {
  JOURNALIERE = 'JOURNALIERE',
  HEBDOMADAIRE = 'HEBDOMADAIRE',
  MENSUELLE = 'MENSUELLE',
}

export enum ModeCommission {
  POURCENTAGE = 'POURCENTAGE',
  MONTANT_FIXE = 'MONTANT_FIXE',
  AUCUN = 'AUCUN',
}

export enum FrequenceCollecte {
  QUOTIDIENNE = 'QUOTIDIENNE',
  HEBDOMADAIRE = 'HEBDOMADAIRE',
  LIBRE = 'LIBRE',
}

export enum FrequenceCalculInteret {
  MENSUEL = 'MENSUEL',
  TRIMESTRIEL = 'TRIMESTRIEL',
}

export enum MethodeCalculInteret {
  SIMPLE = 'SIMPLE',
  CAPITALISE = 'CAPITALISE',
}

export enum StatutDemandeRetrait {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDEE = 'VALIDEE',
  REFUSEE = 'REFUSEE',
}

export enum TypeRetrait {
  NORMAL = 'NORMAL',
  ANTICIPE = 'ANTICIPE',
}

export enum StatutDossierCredit {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE = 'EN_ATTENTE',
  EN_ATTENTE_VALIDATION_DIRECTION = 'EN_ATTENTE_VALIDATION_DIRECTION',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  ACTIF = 'ACTIF',
  CLOTURE = 'CLOTURE',
  CONTENTIEUX = 'CONTENTIEUX',
}

export enum TypeCredit {
  INDIVIDUEL = 'INDIVIDUEL',
  GROUPE = 'GROUPE',
  SOLIDAIRE = 'SOLIDAIRE',
}

export enum TypeCalculCredit {
  AMORTI = 'AMORTI',
  FORFAITAIRE_COURT_TERME = 'FORFAITAIRE_COURT_TERME',
}

export enum TypeCreditPartner {
  ENTREPRISE = 'ENTREPRISE',
  BANQUE = 'BANQUE',
  MICROFINANCE = 'MICROFINANCE',
  ASSOCIATION = 'ASSOCIATION',
  MUTUELLE = 'MUTUELLE',
  MARCHAND = 'MARCHAND',
  AUTRE = 'AUTRE',
}

export enum ModeRecouvrementCredit {
  RETENUE_SALAIRE = 'RETENUE_SALAIRE',
  PRELEVEMENT_BANCAIRE = 'PRELEVEMENT_BANCAIRE',
  REMBOURSEMENT_MOBILE_MONEY = 'REMBOURSEMENT_MOBILE_MONEY',
  REMBOURSEMENT_CAISSE = 'REMBOURSEMENT_CAISSE',
  MIXTE = 'MIXTE',
}

export enum StatutCreditConvention {
  ACTIVE = 'ACTIVE',
  SUSPENDUE = 'SUSPENDUE',
  EXPIREE = 'EXPIREE',
}

export enum StatutEcheance {
  A_PAYER = 'A_PAYER',
  PARTIEL = 'PARTIEL',
  PAYEE = 'PAYEE',
  EN_RETARD = 'EN_RETARD',
}

export enum ModeRemboursementCredit {
  MANUEL = 'MANUEL',
  MOBILE_MONEY = 'MOBILE_MONEY',
  ORANGE_MONEY = 'ORANGE_MONEY',
  VIREMENT = 'VIREMENT',
  PRELEVEMENT = 'PRELEVEMENT',
  RETENUE_SALAIRE = 'RETENUE_SALAIRE',
}

export enum StatutRemboursementCredit {
  VALIDE = 'VALIDE',
  ANNULE = 'ANNULE',
}

export enum FrequenceRemboursementCredit {
  JOURNALIER = 'JOURNALIER',
  HEBDOMADAIRE = 'HEBDOMADAIRE',
  MENSUEL = 'MENSUEL',
}
