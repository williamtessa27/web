export const AppRoutes = {
  HOME: '/',
  CONTACT: '/contact',
  POLITIQUE_CONFIDENTIALITE: '/politique-confidentialite',
  CONDITIONS_UTILISATION: '/conditions-utilisation',
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  DASHBOARD_AGENCE: '/dashboard-agence',
  // ─── Utilisateurs ──────────────────────────────
  UTILISATEURS: '/utilisateurs',
  // ─── Collecteurs ────────────────────────────────
  COLLECTEURS: '/collecteurs',
  COLLECTEURS_MAP: '/collecteurs/carte',
  COLLECTEUR_CREATE: '/collecteurs/create',
  COLLECTEUR_DETAIL: '/collecteurs/:id',
  // ─── Clients ────────────────────────────────────
  CLIENTS: '/clients',
  CLIENT_CREATE: '/clients/create',
  CLIENT_DETAIL: '/clients/:id',
  // ─── Collectes ──────────────────────────────────
  COLLECTES: '/collectes',
  COLLECTE_CREATE: '/collectes/create',
  COLLECTE_DETAIL: '/collectes/:id',
  // ─── Produits microfinance (Collecte, Épargne, Crédit) ─
  PRODUITS_MICROFINANCE: '/produits-microfinance',
  // ─── Produits / Plans (legacy, redirige vers plans ou microfinance) ─
  PRODUITS: '/produits',
  PRODUIT_CREATE: '/produits/create',
  PRODUIT_EDIT: '/produits/:id/edit',
  // ─── Souscriptions ──────────────────────────────
  SOUSCRIPTIONS: '/souscriptions',
  SOUSCRIPTION_CREATE: '/souscriptions/create',
  SOUSCRIPTION_DETAIL: '/souscriptions/:id',
  // ─── Tournées ───────────────────────────────────
  TOURNEES: '/tournees',
  TOURNEE_DETAIL: '/tournees/:id',
  // ─── Clôture journalière ────────────────────────
  CLOTURE: '/cloture',
  // ─── Caisse agence (E6.2) ───────────────────────
  CAISSE_AGENCE: '/caisse-agence',
  // ─── Notifications ──────────────────────────────
  NOTIFICATIONS: '/notifications',
  // ─── Audit / Historique ─────────────────────────
  AUDIT: '/audit',
  // ─── Zones ──────────────────────────────────────
  ZONES: '/zones',
  // ─── Agences (Sprint 5) ─────────────────────────
  AGENCES: '/agences',
  // ─── Comptabilité (Sprint 6) ─────────────────────
  COMPTABILITE: '/comptabilite',
  COMPTABILITE_PLAN: '/comptabilite/plan-comptes',
  // ─── Commissions ────────────────────────────────
  COMMISSIONS: '/commissions',
  // ─── Demandes de retrait ────────────────────────
  DEMANDES_RETRAIT: '/demandes-retrait',
  // ─── Reporting épargne (E3.5) ────────────────────
  ENCOURS_EPARGNE: '/rapports/encours-epargne',
  // ─── E7.2.4 Historique performance collecteur ────
  RAPPORTS_PERFORMANCE: '/rapports/performance-collecteur',
  // ─── Dépôt épargne guichet (US-3.3.2) ────────────
  DEPOT_AGENCE: '/epargne/depot-agence',
  // ─── Crédit (Sprint 3) ───────────────────────────
  CREDIT: '/credit',
  CREDIT_CREATE: '/credit/create',
  CREDIT_DETAIL: '/credit/:id',
  // ─── Super Admin ────────────────────────────────
  SUPER_ADMIN_DASHBOARD: '/super-admin',
  SUPER_ADMIN_ENTREPRISES: '/super-admin/entreprises',
  SUPER_ADMIN_ENTREPRISE_DETAIL: '/super-admin/entreprises/:id',
  SUPER_ADMIN_ABONNEMENTS: '/super-admin/abonnements',
  SUPER_ADMIN_PARAMETRES: '/super-admin/parametres',
  MES_ABONNEMENTS: '/mes-abonnements',
  // ─── Garanties & Assurances (Sprint 10) ─────────
  GARANTIES: '/parametres/garanties',
  // ─── Plans de collecte (paramétrage) ────────────
  PLANS_COLLECTE: '/parametres/plans-collecte',
  // ─── Paramètres (Admin entreprise) & Profil ──────
  PARAMETRES: '/parametres',
  PERMISSIONS: '/parametres/permissions',
  PROFIL: '/profil',
  UTILISATEUR_DETAIL: '/utilisateurs/:id',
} as const;
