import apiClient from './api.client';
export { authApi } from './auth.api';
export type { SessionAdminItem, SessionConnexion } from './auth.api';
import type {
  PaginatedResponse,
  MouvementCompte,
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
  Abonnement,
  Notification,
  ClotureJournaliere,
  ClotureRecap,
  RapprochementResponse,
  AvanceCollecteur,
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

// ─── Contact (public) ──────────────────────────────
export interface RendezVousRequest {
  typeRendezVous: 'presentiel' | 'en_ligne';
  date: string;
  heure: string;
  plateforme?: 'zoom' | 'google_meet' | 'whatsapp';
  nom: string;
  email: string;
  telephone: string;
  nomEntreprise?: string;
  lieuResidence?: string;
  recaptchaToken?: string;
}

export const contactApi = {
  rendezVous: (data: RendezVousRequest) =>
    apiClient.post<{ sent: boolean }>('/contact/rendez-vous', data).then((r) => r.data),
};

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
    apiClient
      .get<
        Entreprise & {
          _stats: {
            utilisateurs: number;
            collecteurs: number;
            clients: number;
            encoursEpargneTotal?: number;
            nbSouscriptionsEpargne?: number;
            encoursCreditTotal?: number;
            nbCreditsActifs?: number;
            nbEcheancesEnRetard?: number;
            impayesTotal?: number;
            tauxRemboursement?: number;
          };
        }
      >(`/entreprises/${id}/detail`)
      .then((r) => r.data),
  platformStats: () =>
    apiClient.get<{
      entreprises: { total: number; actives: number; bloquees: number; profilIncomplet: number };
      utilisateurs: number;
      collecteurs: number;
      clients: number;
    }>('/entreprises/platform/stats').then((r) => r.data),
  getPlatformParametres: () =>
    apiClient
      .get<{ defaultTrialMois: number; rappelAbonnementJours?: number[] }>('/entreprises/platform/parametres')
      .then((r) => r.data),
  updatePlatformParametres: (body: {
    defaultTrialMois?: number;
    rappelAbonnementJours?: number[];
  }) =>
    apiClient
      .patch<{ defaultTrialMois: number; rappelAbonnementJours: number[] }>(
        '/entreprises/platform/parametres',
        body,
      )
      .then((r) => r.data),
  activer: (id: string) => apiClient.patch<Entreprise>(`/entreprises/${id}/activer`).then((r) => r.data),
  bloquer: (id: string) => apiClient.patch<Entreprise>(`/entreprises/${id}/bloquer`).then((r) => r.data),
  debloquer: (id: string) => apiClient.patch<Entreprise>(`/entreprises/${id}/debloquer`).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/entreprises/${id}`),
};

// ─── Abonnements plateforme ──────────────────────
export const abonnementApi = {
  create: (data: { entrepriseId: string; montant: number; dateDebut: string; dureeMois: number }) =>
    apiClient.post<Abonnement>('/abonnements', data).then((r) => r.data),
  /** Sans filtre : tous les abonnements (relation entreprise), Super Admin uniquement. */
  listAll: () => apiClient.get<Abonnement[]>('/abonnements').then((r) => r.data),
  listByEntreprise: (entrepriseId: string) =>
    apiClient.get<Abonnement[]>(`/abonnements?entrepriseId=${encodeURIComponent(entrepriseId)}`).then((r) => r.data),
  mesAbonnements: () => apiClient.get<Abonnement[]>('/abonnements/mes').then((r) => r.data),
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
  /** Positions temps réel pour la carte des collecteurs */
  positions: () => apiClient.get<Collecteur[]>('/collecteurs/positions').then((r) => r.data),
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
  /** E3.5.1 — Historique des mouvements de compte (épargne) du client */
  mouvements: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<MouvementCompte>>(`/clients/${id}/mouvements?${buildQuery(params ?? {})}`).then((r) => r.data),
  addAdhesion: (id: string, typeModule: 'COLLECTE' | 'EPARGNE' | 'CREDIT') =>
    apiClient.post<Client>(`/clients/${id}/adhesions`, { typeModule }).then((r) => r.data),
  removeAdhesion: (id: string, typeModule: 'COLLECTE' | 'EPARGNE' | 'CREDIT') =>
    apiClient.delete<Client>(`/clients/${id}/adhesions/${typeModule}`).then((r) => r.data),
};

/** Paramètres pour l'export des clients (alignés sur le backend). */
export interface ExportClientsParams {
  format?: 'xlsx' | 'csv';
  dateDebut?: string;
  dateFin?: string;
  search?: string;
  statut?: string;
  actif?: boolean;
  zoneId?: string;
  idAgence?: string;
}

/** Télécharge le fichier d'export clients (Excel ou CSV) selon les filtres. Retourne le nom du fichier ou lance en cas d'erreur. */
export async function exportClients(params: ExportClientsParams = {}): Promise<string> {
  const query = buildQuery(params as Record<string, unknown>);
  try {
    const res = await apiClient.get<Blob>(`/exports/clients?${query}`, { responseType: 'blob' });
    const blob = res.data;
    const disposition = res.headers['content-disposition'];
    const filename =
      (typeof disposition === 'string' && /filename="?([^";\n]+)"?/.exec(disposition)?.[1]) ||
      `export-clients-${new Date().toISOString().slice(0, 10)}.${params.format === 'csv' ? 'csv' : 'xlsx'}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
  } catch (err: unknown) {
    const ax = err as { response?: { data?: Blob }; message?: string };
    if (ax.response?.data instanceof Blob) {
      const text = await ax.response.data.text();
      try {
        const json = JSON.parse(text) as { message?: string | string[] };
        const msg = Array.isArray(json.message) ? json.message[0] : json.message;
        throw new Error(msg ?? 'Erreur lors de l\'export');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Erreur lors de l\'export') throw e;
        throw new Error(text || ax.message || 'Erreur lors de l\'export');
      }
    }
    throw err;
  }
}

/** Paramètres pour l'export des collectes (alignés sur le backend). */
export interface ExportCollectesParams {
  format?: 'xlsx' | 'csv';
  dateDebut?: string;
  dateFin?: string;
  search?: string;
  statut?: string;
  collecteurId?: string;
  clientId?: string;
  montantMin?: number;
  montantMax?: number;
}

/** Télécharge le fichier d'export collectes (Excel ou CSV) selon les filtres. */
export async function exportCollectes(params: ExportCollectesParams = {}): Promise<string> {
  const query = buildQuery(params as Record<string, unknown>);
  try {
    const res = await apiClient.get<Blob>(`/exports/collectes?${query}`, { responseType: 'blob' });
    const blob = res.data;
    const disposition = res.headers['content-disposition'];
    const filename =
      (typeof disposition === 'string' && /filename="?([^";\n]+)"?/.exec(disposition)?.[1]) ||
      `export-collectes-${new Date().toISOString().slice(0, 10)}.${params.format === 'csv' ? 'csv' : 'xlsx'}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
  } catch (err: unknown) {
    const ax = err as { response?: { data?: Blob }; message?: string };
    if (ax.response?.data instanceof Blob) {
      const text = await ax.response.data.text();
      try {
        const json = JSON.parse(text) as { message?: string | string[] };
        const msg = Array.isArray(json.message) ? json.message[0] : json.message;
        throw new Error(msg ?? 'Erreur lors de l\'export');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Erreur lors de l\'export') throw e;
        throw new Error(text || ax.message || 'Erreur lors de l\'export');
      }
    }
    throw err;
  }
}

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
export interface ExportSouscriptionsParams {
  format?: 'xlsx' | 'csv';
  clientId?: string;
  produitId?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
}

export async function exportSouscriptions(params: ExportSouscriptionsParams = {}): Promise<string> {
  const query = buildQuery(params as Record<string, unknown>);
  try {
    const res = await apiClient.get<Blob>(`/exports/souscriptions?${query}`, { responseType: 'blob' });
    const blob = res.data;
    const disposition = res.headers['content-disposition'];
    const filename =
      (typeof disposition === 'string' && /filename="?([^";\n]+)"?/.exec(disposition)?.[1]) ||
      `export-souscriptions-${new Date().toISOString().slice(0, 10)}.${params.format === 'csv' ? 'csv' : 'xlsx'}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
  } catch (err: unknown) {
    const ax = err as { response?: { data?: Blob }; message?: string };
    if (ax.response?.data instanceof Blob) {
      const text = await ax.response.data.text();
      try {
        const json = JSON.parse(text) as { message?: string | string[] };
        const msg = Array.isArray(json.message) ? json.message[0] : json.message;
        throw new Error(msg ?? 'Erreur lors de l\'export');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Erreur lors de l\'export') throw e;
        throw new Error(text || ax.message || 'Erreur lors de l\'export');
      }
    }
    throw err;
  }
}

export const souscriptionApi = {
  list: (params = {}) =>
    apiClient.get<PaginatedResponse<Souscription>>(`/souscriptions?${buildQuery(params)}`).then((r) => r.data),
  get: (id: string) => apiClient.get<Souscription>(`/souscriptions/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    apiClient.post<Souscription>('/souscriptions', data).then((r) => r.data),
  cancel: (id: string) => apiClient.patch<Souscription>(`/souscriptions/${id}/annuler`).then((r) => r.data),
  /** E3.5.2 — Clôturer un compte épargne (souscription EN_COURS → TERMINEE) */
  cloture: (id: string) => apiClient.patch<Souscription>(`/souscriptions/${id}/cloture`).then((r) => r.data),
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

// ─── Dépôt épargne guichet (US-3.3.2) ─────────────────
export interface DepotAgenceResult {
  idMouvement: string;
  montant: number;
  soldeClient: number;
  dateDepot: string;
}

export const depotAgenceApi = {
  create: (data: { idClient: string; idSouscription: string; montant: number; dateDepot?: string; idAgence?: string }) =>
    apiClient.post<DepotAgenceResult>('/epargne/depot-agence', data).then((r) => r.data),
};

// ─── Collecteurs (export) ─────────────────────────
export interface ExportCollecteursParams {
  format?: 'xlsx' | 'csv';
  search?: string;
  actif?: boolean;
  zoneId?: string;
  idAgence?: string;
  dateDebut?: string;
  dateFin?: string;
}

export async function exportCollecteurs(params: ExportCollecteursParams = {}): Promise<string> {
  const query = buildQuery(params as Record<string, unknown>);
  try {
    const res = await apiClient.get<Blob>(`/exports/collecteurs?${query}`, { responseType: 'blob' });
    const blob = res.data;
    const disposition = res.headers['content-disposition'];
    const filename =
      (typeof disposition === 'string' && /filename="?([^";\n]+)"?/.exec(disposition)?.[1]) ||
      `export-collecteurs-${new Date().toISOString().slice(0, 10)}.${params.format === 'csv' ? 'csv' : 'xlsx'}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
  } catch (err: unknown) {
    const ax = err as { response?: { data?: Blob }; message?: string };
    if (ax.response?.data instanceof Blob) {
      const text = await ax.response.data.text();
      try {
        const json = JSON.parse(text) as { message?: string | string[] };
        const msg = Array.isArray(json.message) ? json.message[0] : json.message;
        throw new Error(msg ?? 'Erreur lors de l\'export');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Erreur lors de l\'export') throw e;
        throw new Error(text || ax.message || 'Erreur lors de l\'export');
      }
    }
    throw err;
  }
}

// ─── Tournées ─────────────────────────────────────
export interface ExportTourneesParams {
  format?: 'xlsx' | 'csv';
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  collecteurId?: string;
  montantMin?: number;
  montantMax?: number;
}

export async function exportTournees(params: ExportTourneesParams = {}): Promise<string> {
  const query = buildQuery(params as Record<string, unknown>);
  try {
    const res = await apiClient.get<Blob>(`/exports/tournees?${query}`, { responseType: 'blob' });
    const blob = res.data;
    const disposition = res.headers['content-disposition'];
    const filename =
      (typeof disposition === 'string' && /filename="?([^";\n]+)"?/.exec(disposition)?.[1]) ||
      `export-tournees-${new Date().toISOString().slice(0, 10)}.${params.format === 'csv' ? 'csv' : 'xlsx'}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
  } catch (err: unknown) {
    const ax = err as { response?: { data?: Blob }; message?: string };
    if (ax.response?.data instanceof Blob) {
      const text = await ax.response.data.text();
      try {
        const json = JSON.parse(text) as { message?: string | string[] };
        const msg = Array.isArray(json.message) ? json.message[0] : json.message;
        throw new Error(msg ?? 'Erreur lors de l\'export');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Erreur lors de l\'export') throw e;
        throw new Error(text || ax.message || 'Erreur lors de l\'export');
      }
    }
    throw err;
  }
}

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
export interface CreditDashboardDto {
  nbCreditsActifs: number;
  encoursTotal: number;
  nbEcheancesEnRetard: number;
  impayesTotal: number;
  tauxRemboursement: number;
  par30: number;
  par60: number;
  montantEnRetard0_30?: number;
  montantEnRetard31_60?: number;
  montantEnRetard61_90?: number;
  montantEnRetardPlus90?: number;
}

export interface AgingPortefeuilleDto {
  encoursTotal: number;
  tranche0_30: number;
  tranche31_60: number;
  tranche61_90: number;
  tranchePlus90: number;
  par30: number;
  par60: number;
}

export interface CreditsParStatutDto {
  statut: string;
  nbDossiers: number;
  encoursTotal: number;
  montantAccordeTotal: number;
}

export const creditApi = {
  getDashboard: (idAgence?: string) =>
    apiClient.get<CreditDashboardDto>(`/credit/dashboard?${idAgence ? `idAgence=${idAgence}` : ''}`).then((r) => r.data),
  getAging: (idAgence?: string) =>
    apiClient.get<AgingPortefeuilleDto>(`/credit/aging?${idAgence ? `idAgence=${idAgence}` : ''}`).then((r) => r.data),
  rapportStatuts: () =>
    apiClient.get<CreditsParStatutDto[]>('/credit/rapport-statuts').then((r) => r.data),
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
  passerEnContentieux: (id: string, motif?: string) =>
    apiClient.post<DossierCredit>(`/credit/dossiers/${id}/passer-en-contentieux`, { motif }).then((r) => r.data),
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

export interface DashboardDGDto {
  encoursEpargne: number;
  creditDashboard: {
    nbCreditsActifs: number;
    encoursTotal: number;
    tauxRemboursement: number;
    par30: number;
    par60: number;
    nbEcheancesEnRetard: number;
    impayesTotal: number;
  };
  collectesJour: { totalMontant: number; nombreCollectes: number };
  collectes30Jours: { totalMontant: number; nombreCollectes: number };
}

export interface DashboardAgenceDto {
  idAgence: string;
  date: string;
  collectesJour: { totalMontant: number; nombreCollectes: number; parCollecteur: { idCollecteur: string; nomCollecteur: string; totalMontant: number; nombreCollectes: number }[] };
  ecarts: RapportEcarts;
  creditAgence: { nbCreditsActifs: number; encoursTotal: number; par30: number; par60: number; nbEcheancesEnRetard: number };
  kpiAgence: KPIAgence | null;
}

export interface HistoriquePerformanceCollecteurDto {
  annee: number;
  mois: number;
  idCollecteur: string;
  nomCollecteur: string;
  totalMontant: number;
  nombreCollectes: number;
}

export const rapportApi = {
  /** E7.1.1 — Dashboard Direction Générale */
  dashboardDG: () => apiClient.get<DashboardDGDto>('/rapports/dashboard-dg').then((r) => r.data),
  /** E7.1.2 — Dashboard Chef d'agence */
  dashboardAgence: (idAgence: string, date?: string) =>
    apiClient.get<DashboardAgenceDto>(`/rapports/dashboard-agence?idAgence=${idAgence}${date ? `&date=${date}` : ''}`).then((r) => r.data),
  totauxCollectes: (params: { dateDebut: string; dateFin: string; collecteurId?: string; zoneId?: string; idAgence?: string }) =>
    apiClient.get<RapportTotauxCollectes>(`/rapports/totaux-collectes?${buildQuery(params)}`).then((r) => r.data),
  kpisAgences: (params?: { dateDebut?: string; dateFin?: string }) =>
    apiClient.get<KPIAgence[]>(`/rapports/kpis-agences?${buildQuery(params ?? {})}`).then((r) => r.data),
  /** Sprint 9.3 — Rapport écarts et incidents collecte */
  getEcarts: (params: { dateDebut: string; dateFin: string; collecteurId?: string; idAgence?: string }) =>
    apiClient.get<RapportEcarts>(`/rapports/ecarts?${buildQuery(params)}`).then((r) => r.data),
  /** E7.2.4 — Historique performance collecteur par mois */
  historiquePerformanceCollecteur: (params: { dateDebut: string; dateFin: string; collecteurId?: string }) =>
    apiClient.get<HistoriquePerformanceCollecteurDto[]>(`/rapports/historique-performance-collecteur?${buildQuery(params)}`).then((r) => r.data),
  /** E3.5 — Encours épargne : total, par produit, par agence */
  encoursEpargne: () =>
    apiClient.get<EncoursEpargneDto>('/rapports/encours-epargne').then((r) => r.data),
  /** Série temporelle : collectes par jour (graphiques dashboard) */
  collectesParJour: (params: { dateDebut: string; dateFin: string }) =>
    apiClient.get<CollectesParJourPoint[]>(`/rapports/collectes-par-jour?${buildQuery(params)}`).then((r) => r.data),
  /** Série temporelle : nouveaux clients par mois */
  nouveauxClientsParMois: (params?: { nbMois?: number }) =>
    apiClient.get<NouveauxClientsParMoisPoint[]>(`/rapports/nouveaux-clients-par-mois?${buildQuery(params ?? {})}`).then((r) => r.data),
};

export interface CollectesParJourPoint {
  date: string;
  totalMontant: number;
  nombreCollectes: number;
}

export interface NouveauxClientsParMoisPoint {
  annee: number;
  mois: number;
  moisLabel: string;
  nombre: number;
}

export interface EncoursEpargneParProduit {
  idProduit: string;
  nomProduit: string;
  encours: number;
  nbSouscriptions: number;
}

export interface EncoursEpargneParAgence {
  idAgence: string | null;
  nomAgence: string;
  encours: number;
  nbSouscriptions: number;
}

export interface EncoursEpargneDto {
  encoursTotal: number;
  nbSouscriptionsTotal: number;
  parProduit: EncoursEpargneParProduit[];
  parAgence: EncoursEpargneParAgence[];
}

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

export interface CompteDeResultatDto {
  dateDebut: string;
  dateFin: string;
  totalCharges: number;
  totalProduits: number;
  resultat: number;
  lignesCharges: { code: string; libelle: string; solde: number }[];
  lignesProduits: { code: string; libelle: string; solde: number }[];
}

export interface BilanDto {
  date: string;
  totalActif: number;
  totalPassif: number;
  lignesActif: { code: string; libelle: string; solde: number }[];
  lignesPassif: { code: string; libelle: string; solde: number }[];
}

export type TypeCompteComptable = 'ACTIF' | 'PASSIF' | 'CHARGES' | 'PRODUITS';
export type TypeSourceEcriture =
  | 'COLLECTE'
  | 'RETRAIT'
  | 'REMBOURSEMENT_CREDIT'
  | 'DECAISSEMENT_CREDIT'
  | 'COMMISSION'
  | 'AJUSTEMENT'
  | 'AVANCE_COLLECTEUR'
  | 'MOUVEMENT_CAISSE';

export interface CompteComptable {
  id: string;
  code: string;
  libelle: string;
  type: TypeCompteComptable;
  idEntreprise: string;
  actif: boolean;
  createdAt: string;
}

export interface MappingEcritureComptable {
  id: string;
  idEntreprise: string;
  typeSource: TypeSourceEcriture;
  codeCompteDebit: string;
  codeCompteCredit: string;
}

export const comptabiliteApi = {
  comptes: () => apiClient.get<CompteComptable[]>('/comptabilite/comptes').then((r) => r.data),
  createCompte: (data: { code: string; libelle: string; type: TypeCompteComptable }) =>
    apiClient.post<CompteComptable>('/comptabilite/comptes', data).then((r) => r.data),
  getMappings: () => apiClient.get<MappingEcritureComptable[]>('/comptabilite/mapping').then((r) => r.data),
  setMapping: (data: { typeSource: TypeSourceEcriture; codeCompteDebit: string; codeCompteCredit: string }) =>
    apiClient.post<MappingEcritureComptable>('/comptabilite/mapping', data).then((r) => r.data),
  journal: (params: { dateDebut: string; dateFin: string; idAgence?: string }) =>
    apiClient.get<JournalEntry[]>(`/comptabilite/journal?${buildQuery(params)}`).then((r) => r.data),
  balance: (params: { date: string; idAgence?: string }) =>
    apiClient.get<BalanceEntry[]>(`/comptabilite/balance?${buildQuery(params)}`).then((r) => r.data),
  compteResultat: (params: { dateDebut: string; dateFin: string; idAgence?: string }) =>
    apiClient.get<CompteDeResultatDto>(`/comptabilite/compte-resultat?${buildQuery(params)}`).then((r) => r.data),
  bilan: (params: { date: string; idAgence?: string }) =>
    apiClient.get<BilanDto>(`/comptabilite/bilan?${buildQuery(params)}`).then((r) => r.data),
};

// ─── Clôture journalière & Rapprochement (E5.3 / E6.3) ──────────────────────────
export interface CreateDepotCaisseDto {
  dateDepot: string;
  idCollecteur: string;
  montantDepose: number;
  idAgence?: string;
}

export interface CloturePeriode {
  id: string;
  idEntreprise: string;
  type: 'MENSUELLE' | 'ANNUELLE';
  annee: number;
  mois: number;
  idUtilisateurCloture: string;
  dateClotureAt: string;
  commentaire: string | null;
}

export const clotureApi = {
  list: () => apiClient.get<ClotureJournaliere[]>('/clotures').then((r) => r.data),
  recap: (date: string) =>
    apiClient.get<ClotureRecap>(`/clotures/recap?date=${encodeURIComponent(date)}`).then((r) => r.data),
  create: (data: { date: string; commentaire?: string }) =>
    apiClient.post<ClotureJournaliere>('/clotures', data).then((r) => r.data),
  /** Rapprochement par date : terrain vs montant déposé par collecteur */
  rapprochement: (date: string) =>
    apiClient.get<RapprochementResponse>(`/clotures/rapprochement?date=${encodeURIComponent(date)}`).then((r) => r.data),
  /** Enregistrer le montant déposé en caisse par un collecteur pour une date */
  depotCaisse: (data: CreateDepotCaisseDto) =>
    apiClient.post('/clotures/depot-caisse', data).then((r) => r.data),
  /** E6.3.1 — Liste des avances collecteurs */
  avances: (params?: { collecteurId?: string }) =>
    apiClient.get<AvanceCollecteur[]>(`/clotures/avances?${buildQuery(params ?? {})}`).then((r) => r.data),
  /** E6.3.1 — Créer une avance pour un collecteur */
  createAvance: (data: { idCollecteur: string; montant: number; dateAvance: string; idAgence?: string; commentaire?: string }) =>
    apiClient.post<AvanceCollecteur>('/clotures/avances', data).then((r) => r.data),
  /** E6.5.5 — Liste des clôtures de période (mensuelles et annuelles) */
  periodes: (limit?: number) =>
    apiClient.get<CloturePeriode[]>(`/clotures/periodes?${limit != null ? `limit=${limit}` : ''}`).then((r) => r.data),
  /** E6.5.5 — Clôture mensuelle */
  clotureMensuelle: (data: { annee: number; mois: number; commentaire?: string }) =>
    apiClient.post<CloturePeriode>('/clotures/periodes/mensuelle', data).then((r) => r.data),
  /** E6.5.5 — Clôture annuelle */
  clotureAnnuelle: (data: { annee: number; commentaire?: string }) =>
    apiClient.post<CloturePeriode>('/clotures/periodes/annuelle', data).then((r) => r.data),
};

// ─── Caisse agence (E6.2) ────────────────────────────────
export interface OuvertureCaisse {
  id: string;
  idAgence: string;
  idEntreprise: string;
  dateOuverture: string;
  soldeOuverture: number;
  idUtilisateurOuverture: string;
  createdAt: string;
}

export interface MouvementCaisseDto {
  id: string;
  idAgence: string;
  dateMouvement: string;
  sens: 'ENTREE' | 'SORTIE';
  montant: number;
  libelle: string;
  idUtilisateur: string;
  createdAt: string;
}

export interface RapportCaisseDto {
  date: string;
  idAgence: string;
  nomAgence: string;
  soldeOuverture: number;
  totalEntrees: number;
  totalSorties: number;
  soldeTheorique: number;
  ouverture: OuvertureCaisse | null;
  mouvements: MouvementCaisseDto[];
}

export const caisseAgenceApi = {
  ouvrir: (data: { idAgence: string; dateOuverture: string; soldeOuverture: number }) =>
    apiClient.post<OuvertureCaisse>('/caisse-agence/ouverture', data).then((r) => r.data),
  getOuvertures: (idAgence: string, limit?: number) =>
    apiClient.get<OuvertureCaisse[]>(`/caisse-agence/ouverture?idAgence=${idAgence}${limit != null ? `&limit=${limit}` : ''}`).then((r) => r.data),
  createMouvement: (data: { idAgence: string; dateMouvement: string; sens: 'ENTREE' | 'SORTIE'; montant: number; libelle: string }) =>
    apiClient.post<MouvementCaisseDto>('/caisse-agence/mouvement', data).then((r) => r.data),
  getRapport: (idAgence: string, date: string) =>
    apiClient.get<RapportCaisseDto>(`/caisse-agence/rapport?idAgence=${idAgence}&date=${encodeURIComponent(date)}`).then((r) => r.data),
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
  documentUrl?: string | null;
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
  create: (data: { idDossierCredit: string; idTypeGarantie: string; valeurEstimee: number; dateValidite: string; note?: string; documentUrl?: string }) =>
    apiClient.post<Garantie>('/garanties', data).then((r) => r.data),
  update: (id: string, data: Partial<Garantie>) =>
    apiClient.patch<Garantie>(`/garanties/${id}`, data).then((r) => r.data),
  valider: (id: string, data: { statut: 'VALIDEE' | 'REFUSEE'; note?: string }) =>
    apiClient.post<Garantie>(`/garanties/${id}/valider`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/garanties/${id}`),
  /** Module 10.5 — Indicateurs dashboard garanties & assurances */
  getDashboardStats: () =>
    apiClient.get<{ garanties: { nbGarantiesEnAttente: number; nbGarantiesValidees: number; nbGarantiesExpirees: number; nbDossiersAvecGarantiesSansValidee: number }; assurances: { nbAssurancesActives: number; nbAssurancesExpirees: number; nbAssurancesExpirantSous30Jours: number } }>('/garanties/dashboard/stats').then((r) => r.data),
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
  /** E8.3.1 — Enregistrer un export dans l'audit (ex. encours-epargne, rapport-credits-par-statut). */
  logExport: (reportType: string, format?: string) =>
    apiClient.post<void>('/audit/log-export', { reportType, format }).then(() => {}),
};

// ─── Permissions (Sprint 7) ────────────────────────
export interface MatricePermission {
  roles: string[];
  permissions: { code: string; libelle: string; module: string }[];
  matrix: Record<string, Record<string, boolean>>;
}

export const permissionApi = {
  getMatrice: () => apiClient.get<MatricePermission>('/permissions').then((r) => r.data),
  getMyPermissions: () =>
    apiClient.get<{ permissionCodes: string[] }>('/permissions/me').then((r) => r.data),
  updateMatrice: (role: string, permissionCodes: string[]) =>
    apiClient.patch('/permissions/matrice', { role, permissionCodes }),
};
