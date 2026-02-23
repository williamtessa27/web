import apiClient from './api.client';
import type {
  PaginatedResponse,
  Entreprise,
  CompleteEntrepriseRequest,
  Utilisateur,
  CreateUtilisateurRequest,
  CreateGestionnaireRequest,
  CreateCollecteurRequest,
  CreateClientRequest,
  UploadResponse,
  Collecteur,
  Client,
  Collecte,
  Produit,
  Souscription,
  Tournee,
  Commission,
  CommissionEntreprise,
  DemandeRetrait,
  DossierCredit,
  Echeance,
  Zone,
  Agence,
  Notification,
  ClotureJournaliere,
  ClotureRecap,
  HistoriqueAffectationClient,
  AuditLog,
} from '@/types';

// ─── Helper générique ─────────────────────────────
function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  return q.toString();
}

// ─── Entreprises ──────────────────────────────────
export const entrepriseApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Entreprise>>(`/entreprises?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Entreprise>(`/entreprises/${id}`).then((r) => r.data),
  create: (data: Partial<Entreprise>) => apiClient.post<Entreprise>('/entreprises', data).then((r) => r.data),
  update: (id: string, data: Partial<Entreprise>) =>
    apiClient.patch<Entreprise>(`/entreprises/${id}`, data).then((r) => r.data),
  completeProfile: (data: CompleteEntrepriseRequest) =>
    apiClient.patch<Entreprise>('/entreprises/complete-profile', data).then((r) => r.data),
  getDetail: (id: string) =>
    apiClient.get<Entreprise & { _stats: { utilisateurs: number; collecteurs: number; clients: number } }>(`/entreprises/${id}/detail`).then((r) => r.data),
  platformStats: () =>
    apiClient.get<{
      entreprises: { total: number; actives: number; bloquees: number; profilIncomplet: number };
      utilisateurs: number;
      collecteurs: number;
      clients: number;
    }>('/entreprises/platform/stats').then((r) => r.data),
  activer: (id: string) => apiClient.patch<Entreprise>(`/entreprises/${id}/activer`).then((r) => r.data),
  bloquer: (id: string) => apiClient.patch<Entreprise>(`/entreprises/${id}/bloquer`).then((r) => r.data),
  debloquer: (id: string) => apiClient.patch<Entreprise>(`/entreprises/${id}/debloquer`).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/entreprises/${id}`),
};

// ─── Utilisateurs ────────────────────────────────
export const utilisateurApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Utilisateur>>(`/utilisateurs?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Utilisateur>(`/utilisateurs/${id}`).then((r) => r.data),
  create: (data: CreateUtilisateurRequest) =>
    apiClient.post<Utilisateur>('/utilisateurs', data).then((r) => r.data),
  createGestionnaire: (data: CreateGestionnaireRequest) =>
    apiClient.post<Utilisateur>('/utilisateurs/gestionnaire', data).then((r) => r.data),
  createCollecteur: (data: CreateCollecteurRequest) =>
    apiClient.post<{ utilisateur: Utilisateur; collecteur: Collecteur }>('/utilisateurs/collecteur', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<Utilisateur>(`/utilisateurs/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/utilisateurs/${id}`),
  countByRole: () =>
    apiClient.get<Record<string, number>>('/utilisateurs/stats/count').then((r) => r.data),
};

// ─── Upload ──────────────────────────────────────
export const uploadApi = {
  /** Upload une image (backend: POST /upload/image). Retourne l’URL à enregistrer (secureUrl). */
  image: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const url = folder ? `/upload/image?folder=${encodeURIComponent(folder)}` : '/upload/image';
    return apiClient.post<UploadResponse>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  /** Upload plusieurs images (backend: POST /upload/images). */
  images: (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const url = folder ? `/upload/images?folder=${encodeURIComponent(folder)}` : '/upload/images';
    return apiClient.post<UploadResponse[]>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

// ─── Zones ────────────────────────────────────────
export const zoneApi = {
  list: () => apiClient.get<Zone[]>('/zones').then((r) => r.data),
  get: (id: string) => apiClient.get<Zone>(`/zones/${id}`).then((r) => r.data),
  create: (data: Partial<Zone>) => apiClient.post<Zone>('/zones', data).then((r) => r.data),
  update: (id: string, data: Partial<Zone>) => apiClient.patch<Zone>(`/zones/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/zones/${id}`),
};

// ─── Agences (Sprint 5) ───────────────────────────
export const agenceApi = {
  list: (inclureInactives = false) =>
    apiClient.get<Agence[]>(`/agences?inclureInactives=${inclureInactives}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Agence>(`/agences/${id}`).then((r) => r.data),
  create: (data: Partial<Agence>) => apiClient.post<Agence>('/agences', data).then((r) => r.data),
  update: (id: string, data: Partial<Agence>) => apiClient.patch<Agence>(`/agences/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/agences/${id}`),
};

// ─── Collecteurs ──────────────────────────────────
export const collecteurApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Collecteur>>(`/collecteurs?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Collecteur>(`/collecteurs/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => apiClient.post<Collecteur>('/collecteurs', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<Collecteur>(`/collecteurs/${id}`, data).then((r) => r.data),
};

// ─── Clients ──────────────────────────────────────
export const clientApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Client>>(`/clients?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Client>(`/clients/${id}`).then((r) => r.data),
  /** Vérifier si téléphone et email sont disponibles (non utilisés par un utilisateur). */
  checkAvailability: (telephone: string, email: string) =>
    apiClient
      .post<{ telephoneAvailable: boolean; emailAvailable: boolean }>('/clients/check-availability', {
        telephone,
        email,
      })
      .then((r) => r.data),
  create: (data: CreateClientRequest) => apiClient.post<Client>('/clients', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateClientRequest & { actif: boolean; statut?: import('@/types').Client['statut']; photoUrl?: string }>) =>
    apiClient.patch<Client>(`/clients/${id}`, data).then((r) => r.data),
  /** Changement d'agence (opération distincte : audit + notifications Admin/Chef agence). */
  changerAgence: (id: string, idAgence: string) =>
    apiClient.patch<Client>(`/clients/${id}/changer-agence`, { idAgence }).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/clients/${id}`),
  stats: () => apiClient.get<{ total: number; actifs: number; inactifs: number }>('/clients/stats').then((r) => r.data),
  getHistoriqueAffectation: (id: string) =>
    apiClient.get<HistoriqueAffectationClient[]>(`/clients/${id}/historique-affectation`).then((r) => r.data),
  /** Sprint 11 — Score client (0–100, collectes validées, échéances en retard, ancienneté) */
  getScore: (id: string) =>
    apiClient.get<import('@/types').ClientScoreResult>(`/clients/${id}/score`).then((r) => r.data),
  addAdhesion: (id: string, typeModule: 'COLLECTE' | 'EPARGNE' | 'CREDIT') =>
    apiClient.post<Client>(`/clients/${id}/adhesions`, { typeModule }).then((r) => r.data),
  removeAdhesion: (id: string, typeModule: 'COLLECTE' | 'EPARGNE' | 'CREDIT') =>
    apiClient.delete<Client>(`/clients/${id}/adhesions/${typeModule}`).then((r) => r.data),
};

// ─── Produits ─────────────────────────────────────
export const produitApi = {
  list: () => apiClient.get<Produit[]>('/produits').then((r) => r.data),
  get: (id: string) => apiClient.get<Produit>(`/produits/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => apiClient.post<Produit>('/produits', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<Produit>(`/produits/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/produits/${id}`),
  simulation: (id: string, params?: { montantJournalier?: number; dureeJours?: number }) => {
    const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get<import('@/types').SimulationEpargneResult>(`/produits/${id}/simulation${qs}`).then((r) => r.data);
  },
};

// ─── Souscriptions ────────────────────────────────
export const souscriptionApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Souscription>>(`/souscriptions?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Souscription>(`/souscriptions/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    apiClient.post<Souscription>('/souscriptions', data).then((r) => r.data),
  cancel: (id: string) => apiClient.patch<Souscription>(`/souscriptions/${id}/annuler`).then((r) => r.data),
};

// ─── Collectes ────────────────────────────────────
export interface JoursCollectesResponse {
  dateDebut: string;
  dateFin: string;
  datesCollectes: string[];
}

export const collecteApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Collecte>>(`/collectes?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Collecte>(`/collectes/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => apiClient.post<Collecte>('/collectes', data).then((r) => r.data),
  valider: (id: string) => apiClient.patch<Collecte>(`/collectes/${id}/valider`).then((r) => r.data),
  rejeter: (id: string) => apiClient.patch<Collecte>(`/collectes/${id}/rejeter`).then((r) => r.data),
  /** Télécharge le reçu PDF (retourne l'URL blob pour téléchargement) */
  getRecuPdf: async (id: string) => {
    const r = await apiClient.get(`/collectes/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recu-collecte-${id.slice(0, 8)}.pdf`);
    link.click();
    window.URL.revokeObjectURL(url);
  },
  cancel: (id: string) => apiClient.patch<Collecte>(`/collectes/${id}/annuler`).then((r) => r.data),
  dailySummary: (collecteurId: string, date: string) =>
    apiClient.get(`/collectes/summary/daily?collecteurId=${collecteurId}&date=${date}`).then((r) => r.data),
  joursCollectes: (clientId: string, souscriptionId: string) =>
    apiClient
      .get<JoursCollectesResponse>(
        `/collectes/jours-collectes?clientId=${encodeURIComponent(clientId)}&souscriptionId=${encodeURIComponent(souscriptionId)}`
      )
      .then((r) => r.data),
};

// ─── Tournées ─────────────────────────────────────
export const tourneeApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Tournee>>(`/tournees?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Tournee>(`/tournees/${id}`).then((r) => r.data),
  start: (data: Record<string, unknown>) => apiClient.post<Tournee>('/tournees/start', data).then((r) => r.data),
  end: (id: string) => apiClient.patch<Tournee>(`/tournees/${id}/end`).then((r) => r.data),
  active: (collecteurId: string) =>
    apiClient.get<Tournee | null>(`/tournees/active/${collecteurId}`).then((r) => r.data),
};

// ─── Commissions entreprise ───────────────────────
export const commissionApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<CommissionEntreprise>>(`/commissions?${buildQuery(params)}`).then((r) => r.data),
  calculerEntreprise: (data: { dateDebut: string; dateFin: string; periode?: string }) =>
    apiClient.post<CommissionEntreprise>('/commissions/calculer-entreprise', data).then((r) => r.data),
  markPaid: (id: string) => apiClient.patch<CommissionEntreprise>(`/commissions/${id}/payer`).then((r) => r.data),
};

// ─── Crédit (Sprint 3) ───────────────────────────
export const creditApi = {
  getDashboard: () =>
    apiClient.get<{
      nbCreditsActifs: number;
      encoursTotal: number;
      nbEcheancesEnRetard: number;
      impayesTotal: number;
      tauxRemboursement: number;
    }>('/credit/dashboard').then((r) => r.data),
  listDossiers: (params: Record<string, string | undefined> = {}) =>
    apiClient.get<PaginatedResponse<DossierCredit>>(`/credit/dossiers?${buildQuery(params)}`).then((r) => r.data),
  getDossier: (id: string) => apiClient.get<DossierCredit>(`/credit/dossiers/${id}`).then((r) => r.data),
  createDossier: (data: Record<string, unknown>) =>
    apiClient.post<DossierCredit>('/credit/dossiers', data).then((r) => r.data),
  soumettre: (id: string) => apiClient.post<DossierCredit>(`/credit/dossiers/${id}/soumettre`, {}).then((r) => r.data),
  valider: (id: string, data?: { montantAccorde?: number }) =>
    apiClient.post<DossierCredit>(`/credit/dossiers/${id}/valider`, data ?? {}).then((r) => r.data),
  rejeter: (id: string, data?: { motifRefus?: string }) =>
    apiClient.post<DossierCredit>(`/credit/dossiers/${id}/rejeter`, data ?? {}).then((r) => r.data),
  octroyer: (id: string) => apiClient.post<DossierCredit>(`/credit/dossiers/${id}/octroyer`, {}).then((r) => r.data),
  getEcheances: (id: string) =>
    apiClient.get<Echeance[]>(`/credit/dossiers/${id}/echeances`).then((r) => r.data),
  simulationRemboursementAnticipe: (id: string) =>
    apiClient.get<{ montantTotal: number; capitalRestant: number; interetsRestants: number; nbEcheancesRestantes: number }>(
      `/credit/dossiers/${id}/simulation-remboursement-anticipe`,
    ).then((r) => r.data),
  remboursementAnticipe: (id: string) =>
    apiClient.post<DossierCredit>(`/credit/dossiers/${id}/remboursement-anticipe`, {}).then((r) => r.data),
};

// ─── Demandes de retrait ─────────────────────────
export const demandeRetraitApi = {
  list: (params: Record<string, string | undefined> = {}) =>
    apiClient.get<PaginatedResponse<DemandeRetrait>>(`/demandes-retrait?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<DemandeRetrait>(`/demandes-retrait/${id}`).then((r) => r.data),
  create: (data: { idClient: string; montantDemande: number; idSouscription?: string }) =>
    apiClient.post<DemandeRetrait>('/demandes-retrait', data).then((r) => r.data),
  creerEtValider: (data: { idClient: string; montantDemande: number; idSouscription?: string }) =>
    apiClient.post<DemandeRetrait>('/demandes-retrait/creer-et-valider', data).then((r) => r.data),
  valider: (id: string) => apiClient.patch<DemandeRetrait>(`/demandes-retrait/${id}/valider`).then((r) => r.data),
  refuser: (id: string, data?: { motifRefus?: string }) =>
    apiClient.patch<DemandeRetrait>(`/demandes-retrait/${id}/refuser`, data ?? {}).then((r) => r.data),
};

// ─── Rapports (totaux collectes VALIDEE) ───────────
export interface RapportTotauxCollectes {
  totalMontant: number;
  nombreCollectes: number;
  parCollecteur: { idCollecteur: string; nomCollecteur: string; totalMontant: number; nombreCollectes: number }[];
  parZone: { idZone: string; nomZone: string; totalMontant: number; nombreCollectes: number }[];
}
export interface KPIAgence {
  idAgence: string;
  nomAgence: string;
  totalMontant: number;
  nombreCollectes: number;
  nbCollecteurs: number;
  nbClients: number;
}

export interface RapportEcarts {
  dateDebut: string;
  dateFin: string;
  incidents: Array<{
    id: string;
    dateCollecte: string;
    nomClient: string;
    nomCollecteur: string;
    montant: number;
    typeSignalement: string;
    note?: string;
  }>;
  ecarts: Array<{
    id: string;
    dateCollecte: string;
    nomClient: string;
    nomCollecteur: string;
    montant: number;
    montantAttendu: number;
    ecart: number;
    note?: string;
  }>;
}

export const rapportApi = {
  totauxCollectes: (params: { dateDebut: string; dateFin: string; collecteurId?: string; zoneId?: string }) =>
    apiClient.get<RapportTotauxCollectes>(`/rapports/totaux-collectes?${buildQuery(params)}`).then((r) => r.data),
  kpisAgences: (params?: { dateDebut?: string; dateFin?: string }) =>
    apiClient.get<KPIAgence[]>(`/rapports/kpis-agences?${buildQuery(params ?? {})}`).then((r) => r.data),
  /** Sprint 9.3 — Rapport écarts et incidents collecte */
  getEcarts: (params: { dateDebut: string; dateFin: string; collecteurId?: string }) =>
    apiClient.get<RapportEcarts>(`/rapports/ecarts?${buildQuery(params)}`).then((r) => r.data),
};

// ─── Comptabilité (Sprint 6) ───────────────────────────
export interface JournalEntry {
  id: string;
  dateEcriture: string;
  libelle: string;
  compteDebitCode: string;
  compteCreditCode: string;
  montant: number;
  typeSource: string;
}

export interface BalanceEntry {
  idCompte: string;
  code: string;
  libelle: string;
  type: string;
  debit: number;
  credit: number;
  solde: number;
}

export const comptabiliteApi = {
  journal: (params: { dateDebut: string; dateFin: string; idAgence?: string }) =>
    apiClient.get<JournalEntry[]>(`/comptabilite/journal?${buildQuery(params)}`).then((r) => r.data),
  balance: (params: { date: string; idAgence?: string }) =>
    apiClient.get<BalanceEntry[]>(`/comptabilite/balance?${buildQuery(params)}`).then((r) => r.data),
};

// ─── Clôture journalière ──────────────────────────
export const clotureApi = {
  list: () => apiClient.get<ClotureJournaliere[]>('/clotures').then((r) => r.data),
  recap: (date: string) =>
    apiClient.get<ClotureRecap>(`/clotures/recap?date=${encodeURIComponent(date)}`).then((r) => r.data),
  create: (data: { date: string; commentaire?: string }) =>
    apiClient.post<ClotureJournaliere>('/clotures', data).then((r) => r.data),
};

// ─── Notifications ────────────────────────────────
export const notificationApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Notification>>(`/notifications?${buildQuery(params)}`).then((r) => r.data),
  markAsRead: (ids: string[]) =>
    apiClient.patch('/notifications/mark-as-read', { ids }),
  markAllRead: () => apiClient.patch('/notifications/mark-all-as-read'),
  unreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
};

// ─── Garanties & Assurances (Sprint 10) ───────────
export interface TypeGarantie {
  id: string;
  code: string;
  libelle: string;
  valeurMin: number | null;
  valeurMax: number | null;
  ratioCouvertureMin: number;
  dureeValiditeMois: number;
  actif: boolean;
  idEntreprise: string;
  createdAt: string;
}

export interface Garantie {
  id: string;
  idDossierCredit: string;
  idTypeGarantie: string;
  typeGarantie?: TypeGarantie;
  valeurEstimee: number;
  dateValidite: string;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE' | 'EXPIREE';
  note: string | null;
  idEntreprise: string;
  createdAt: string;
}

export interface TypeAssurance {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
  idEntreprise: string;
  createdAt: string;
}

export interface Assurance {
  id: string;
  idDossierCredit: string | null;
  idSouscription: string | null;
  idTypeAssurance: string;
  typeAssurance?: TypeAssurance;
  montantCouvert: number;
  dateDebut: string;
  dateFin: string;
  prime: number;
  statut: 'ACTIVE' | 'EXPIREE' | 'RESILIEE';
  idEntreprise: string;
  createdAt: string;
}

export const typeGarantieApi = {
  list: (actifOnly = true) =>
    apiClient.get<TypeGarantie[]>(`/types-garantie?actifOnly=${actifOnly}`).then((r) => r.data),
  get: (id: string) => apiClient.get<TypeGarantie>(`/types-garantie/${id}`).then((r) => r.data),
  create: (data: Partial<TypeGarantie>) =>
    apiClient.post<TypeGarantie>('/types-garantie', data).then((r) => r.data),
  update: (id: string, data: Partial<TypeGarantie>) =>
    apiClient.patch<TypeGarantie>(`/types-garantie/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/types-garantie/${id}`),
};

export const garantieApi = {
  listByDossier: (idDossierCredit: string) =>
    apiClient.get<Garantie[]>(`/garanties/dossier/${idDossierCredit}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Garantie>(`/garanties/${id}`).then((r) => r.data),
  create: (data: { idDossierCredit: string; idTypeGarantie: string; valeurEstimee: number; dateValidite: string; note?: string }) =>
    apiClient.post<Garantie>('/garanties', data).then((r) => r.data),
  update: (id: string, data: Partial<Garantie>) =>
    apiClient.patch<Garantie>(`/garanties/${id}`, data).then((r) => r.data),
  valider: (id: string, data: { statut: 'VALIDEE' | 'REFUSEE'; note?: string }) =>
    apiClient.post<Garantie>(`/garanties/${id}/valider`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/garanties/${id}`),
};

export const typeAssuranceApi = {
  list: (actifOnly = true) =>
    apiClient.get<TypeAssurance[]>(`/types-assurance?actifOnly=${actifOnly}`).then((r) => r.data),
  get: (id: string) => apiClient.get<TypeAssurance>(`/types-assurance/${id}`).then((r) => r.data),
  create: (data: Partial<TypeAssurance>) =>
    apiClient.post<TypeAssurance>('/types-assurance', data).then((r) => r.data),
  update: (id: string, data: Partial<TypeAssurance>) =>
    apiClient.patch<TypeAssurance>(`/types-assurance/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/types-assurance/${id}`),
};

export const assuranceApi = {
  listByDossier: (idDossierCredit: string) =>
    apiClient.get<Assurance[]>(`/assurances/dossier/${idDossierCredit}`).then((r) => r.data),
  listBySouscription: (idSouscription: string) =>
    apiClient.get<Assurance[]>(`/assurances/souscription/${idSouscription}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Assurance>(`/assurances/${id}`).then((r) => r.data),
  create: (data: { idDossierCredit?: string; idSouscription?: string; idTypeAssurance: string; montantCouvert: number; dateDebut: string; dateFin: string; prime?: number }) =>
    apiClient.post<Assurance>('/assurances', data).then((r) => r.data),
  update: (id: string, data: Partial<Assurance>) =>
    apiClient.patch<Assurance>(`/assurances/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/assurances/${id}`),
};

// ─── Audit ────────────────────────────────────────
export const auditApi = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    apiClient.get<PaginatedResponse<AuditLog>>(`/audit?${buildQuery(params)}`).then((r) => r.data),
};

// ─── Permissions (Sprint 7) ────────────────────────
export interface MatricePermission {
  roles: string[];
  permissions: { code: string; libelle: string; module: string }[];
  matrix: Record<string, Record<string, boolean>>;
}

export const permissionApi = {
  getMatrice: () => apiClient.get<MatricePermission>('/permissions').then((r) => r.data),
  updateMatrice: (role: string, permissionCodes: string[]) =>
    apiClient.patch('/permissions/matrice', { role, permissionCodes }),
};
