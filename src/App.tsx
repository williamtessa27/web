import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from '@/config/routes.config';
import ConnectionStatusBar from '@/components/ConnectionStatusBar';
import { RoleUtilisateur } from '@/types';
import { useAuthStore } from '@/core/store/auth.store';

// Guards
import AuthGuard from '@/core/guards/AuthGuard';
import GuestGuard from '@/core/guards/GuestGuard';
import RoleGuard from '@/core/guards/RoleGuard';
import OnboardingGuard from '@/core/guards/OnboardingGuard';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import LandingPage from '@/pages/LandingPage';
import ContactPage from '@/pages/contact/ContactPage';
import PolitiqueConfidentialitePage from '@/pages/legal/PolitiqueConfidentialitePage';
import ConditionsUtilisationPage from '@/pages/legal/ConditionsUtilisationPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import DashboardAgencePage from '@/pages/dashboard/DashboardAgencePage';
import UtilisateursPage from '@/pages/utilisateurs/UtilisateursPage';
import CollecteursPage from '@/pages/collecteurs/CollecteursPage';
import CarteCollecteursPage from '@/pages/collecteurs/CarteCollecteursPage';
import CreateCollecteurPage from '@/pages/collecteurs/CreateCollecteurPage';
import CollecteurDetailPage from '@/pages/collecteurs/CollecteurDetailPage';
import ClientsPage from '@/pages/clients/ClientsPage';
import CreateClientPage from '@/pages/clients/CreateClientPage';
import ClientDetailPage from '@/pages/clients/ClientDetailPage';
import CollectesPage from '@/pages/collectes/CollectesPage';
import CreateCollectePage from '@/pages/collectes/CreateCollectePage';
import CollecteDetailPage from '@/pages/collectes/CollecteDetailPage';
import ProduitsPage from '@/pages/produits/ProduitsPage';
import ProduitsMicrofinancePage from '@/pages/produits/ProduitsMicrofinancePage';
import CreateProduitPage from '@/pages/produits/CreateProduitPage';
import EditProduitPage from '@/pages/produits/EditProduitPage';
import SouscriptionsPage from '@/pages/souscriptions/SouscriptionsPage';
import SouscriptionDetailPage from '@/pages/souscriptions/SouscriptionDetailPage';
import CreateSouscriptionPage from '@/pages/souscriptions/CreateSouscriptionPage';
import ZonesPage from '@/pages/zones/ZonesPage';
import AgencesPage from '@/pages/agences/AgencesPage';
import ComptabilitePage from '@/pages/comptabilite/ComptabilitePage';
import PlanComptesPage from '@/pages/comptabilite/PlanComptesPage';
import TourneesPage from '@/pages/tournees/TourneesPage';
import TourneeDetailPage from '@/pages/tournees/TourneeDetailPage';
import CloturePage from '@/pages/cloture/CloturePage';
import CaisseAgencePage from '@/pages/caisse-agence/CaisseAgencePage';
import AuditPage from '@/pages/audit/AuditPage';
import CommissionsPage from '@/pages/commissions/CommissionsPage';
import DemandesRetraitPage from '@/pages/demandes-retrait/DemandesRetraitPage';
import EncoursEpargnePage from '@/pages/rapports/EncoursEpargnePage';
import HistoriquePerformanceCollecteurPage from '@/pages/rapports/HistoriquePerformanceCollecteurPage';
import CreateDepotAgencePage from '@/pages/epargne/CreateDepotAgencePage';
import CreditsPage from '@/pages/credit/CreditsPage';
import CreateDossierCreditPage from '@/pages/credit/CreateDossierCreditPage';
import DossierCreditDetailPage from '@/pages/credit/DossierCreditDetailPage';
import SuperAdminDashboard from '@/pages/super-admin/SuperAdminDashboard';
import EntreprisesPage from '@/pages/super-admin/EntreprisesPage';
import EntrepriseDetailPage from '@/pages/super-admin/EntrepriseDetailPage';
import ParametresPlateformePage from '@/pages/super-admin/ParametresPlateformePage';
import AbonnementsPage from '@/pages/super-admin/AbonnementsPage';
import MesAbonnementsPage from '@/pages/abonnements/MesAbonnementsPage';
import ParametresPage from '@/pages/parametres/ParametresPage';
import PermissionsPage from '@/pages/parametres/PermissionsPage';
import GarantiesPage from '@/pages/parametres/GarantiesPage';
import CreditPartnersPage from '@/pages/parametres/CreditPartnersPage';
import PlansCollectePage from '@/pages/parametres/PlansCollectePage';
import ProfilePage from '@/pages/profile/ProfilePage';
import UtilisateurDetailPage from '@/pages/utilisateurs/UtilisateurDetailPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import ImportExportPage from '@/pages/data-transfer/ImportExportPage';

/** Redirige le Super Admin vers le tableau de bord plateforme s'il accède à Dashboard ou Notifications. */
function DashboardOrRedirect() {
  const { user } = useAuthStore();
  if (user?.role === RoleUtilisateur.SuperAdmin) {
    return <Navigate to={AppRoutes.SUPER_ADMIN_DASHBOARD} replace />;
  }
  return <DashboardPage />;
}

function NotificationsOrRedirect() {
  const { user } = useAuthStore();
  if (user?.role === RoleUtilisateur.SuperAdmin) {
    return <Navigate to={AppRoutes.SUPER_ADMIN_DASHBOARD} replace />;
  }
  return <NotificationsPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />
      <ConnectionStatusBar />

      <Routes>
        {/* ─── Landing & Contact (public) ─────────── */}
        <Route path={AppRoutes.HOME} element={<LandingPage />} />
        <Route path={AppRoutes.CONTACT} element={<ContactPage />} />
        <Route path={AppRoutes.POLITIQUE_CONFIDENTIALITE} element={<PolitiqueConfidentialitePage />} />
        <Route path={AppRoutes.CONDITIONS_UTILISATION} element={<ConditionsUtilisationPage />} />

        {/* ─── Routes publiques (Guest) ──────────── */}
        <Route element={<GuestGuard />}>
          <Route path={AppRoutes.LOGIN} element={<LoginPage />} />
          <Route path={AppRoutes.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* ─── Onboarding (authentifié mais profil incomplet) */}
        <Route element={<AuthGuard />}>
          <Route path={AppRoutes.ONBOARDING} element={<OnboardingPage />} />
        </Route>

        {/* ─── Routes protégées (profil complété) ── */}
        <Route element={<AuthGuard />}>
          <Route element={<OnboardingGuard />}>
            <Route element={<AppLayout />}>
              {/* Dashboard (Super Admin redirigé vers tableau de bord plateforme) */}
              <Route path={AppRoutes.DASHBOARD} element={<DashboardOrRedirect />} />
              {/* Dashboard agence (Chef d'agence) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.ChefAgence]} />}>
                <Route path={AppRoutes.DASHBOARD_AGENCE} element={<DashboardAgencePage />} />
              </Route>

              {/* Profil (tout utilisateur connecté) */}
              <Route path={AppRoutes.PROFIL} element={<ProfilePage />} />

              {/* Notifications (Super Admin redirigé vers tableau de bord plateforme) */}
              <Route path={AppRoutes.NOTIFICATIONS} element={<NotificationsOrRedirect />} />

              {/* Paramètres entreprise (Admin entreprise uniquement) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.AdminEntreprise, RoleUtilisateur.SuperAdmin]} />}>
                <Route path={AppRoutes.PARAMETRES} element={<ParametresPage />} />
                <Route path={AppRoutes.PERMISSIONS} element={<PermissionsPage />} />
                <Route path={AppRoutes.GARANTIES} element={<GarantiesPage />} />
                <Route path={AppRoutes.CREDIT_PARTNERS} element={<CreditPartnersPage />} />
                <Route path={AppRoutes.PLANS_COLLECTE} element={<PlansCollectePage />} />
              </Route>

              {/* Mes abonnements (Admin entreprise / Gestionnaire) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire]} />}>
                <Route path={AppRoutes.MES_ABONNEMENTS} element={<MesAbonnementsPage />} />
              </Route>

              {/* Utilisateurs (Admin + Gestionnaire : liste et fiche pour accès depuis Collecteurs) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire]} />}>
                <Route path={AppRoutes.UTILISATEURS} element={<UtilisateursPage />} />
                <Route path={AppRoutes.UTILISATEUR_DETAIL} element={<UtilisateurDetailPage />} />
              </Route>

              {/* Collecteurs (Admin / Gestionnaire / Directeur / ChefAgence) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.Gestionnaire]} />}>
                <Route path={AppRoutes.COLLECTEURS_MAP} element={<CarteCollecteursPage />} />
                <Route path={AppRoutes.COLLECTEURS} element={<CollecteursPage />} />
                <Route path={AppRoutes.COLLECTEUR_CREATE} element={<CreateCollecteurPage />} />
                <Route path={AppRoutes.COLLECTEUR_DETAIL} element={<CollecteurDetailPage />} />
              </Route>

              {/* Clients */}
              <Route path={AppRoutes.CLIENTS} element={<ClientsPage />} />
              <Route path={AppRoutes.CLIENT_CREATE} element={<CreateClientPage />} />
              <Route path={AppRoutes.CLIENT_DETAIL} element={<ClientDetailPage />} />
              <Route path={AppRoutes.IMPORT_EXPORT} element={<ImportExportPage />} />

              {/* Collectes */}
              <Route path={AppRoutes.COLLECTES} element={<CollectesPage />} />
              <Route path={AppRoutes.COLLECTE_CREATE} element={<CreateCollectePage />} />
              <Route path={AppRoutes.COLLECTE_DETAIL} element={<CollecteDetailPage />} />

              {/* Produits (Admin + Gestionnaire) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire]} />}>
                <Route path={AppRoutes.PRODUITS} element={<ProduitsPage />} />
                <Route path={AppRoutes.PRODUIT_CREATE} element={<CreateProduitPage />} />
                <Route path={AppRoutes.PRODUIT_EDIT} element={<EditProduitPage />} />
              </Route>

              {/* Zones, Souscriptions, Tournées, Commissions (Admin + Gestionnaire) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire]} />}>
                <Route path={AppRoutes.SOUSCRIPTIONS} element={<SouscriptionsPage />} />
                <Route path={AppRoutes.SOUSCRIPTION_DETAIL} element={<SouscriptionDetailPage />} />
                <Route path={AppRoutes.SOUSCRIPTION_CREATE} element={<CreateSouscriptionPage />} />
                <Route path={AppRoutes.ZONES} element={<ZonesPage />} />
                <Route path={AppRoutes.AGENCES} element={<AgencesPage />} />
                <Route path={AppRoutes.COMPTABILITE} element={<ComptabilitePage />} />
                <Route path={AppRoutes.COMPTABILITE_PLAN} element={<PlanComptesPage />} />
                <Route path={AppRoutes.TOURNEES} element={<TourneesPage />} />
                <Route path={AppRoutes.TOURNEE_DETAIL} element={<TourneeDetailPage />} />
                <Route path={AppRoutes.COMMISSIONS} element={<CommissionsPage />} />
                <Route path={AppRoutes.DEMANDES_RETRAIT} element={<DemandesRetraitPage />} />
                <Route path={AppRoutes.CREDIT} element={<CreditsPage />} />
                <Route path={AppRoutes.CREDIT_CREATE} element={<CreateDossierCreditPage />} />
                <Route path={AppRoutes.CREDIT_DETAIL} element={<DossierCreditDetailPage />} />
                <Route path={AppRoutes.PRODUITS_MICROFINANCE} element={<ProduitsMicrofinancePage />} />
              </Route>

              {/* Clôture journalière (Admin / Gestionnaire) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire]} />}>
                <Route path={AppRoutes.CLOTURE} element={<CloturePage />} />
              </Route>

              {/* Caisse agence (Admin / Gestionnaire / Caissier) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Caissier]} />}>
                <Route path={AppRoutes.CAISSE_AGENCE} element={<CaisseAgencePage />} />
              </Route>

              {/* Encours épargne + Historique performance (Admin, Gestionnaire, Directeur) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Directeur]} />}>
                <Route path={AppRoutes.ENCOURS_EPARGNE} element={<EncoursEpargnePage />} />
                <Route path={AppRoutes.RAPPORTS_PERFORMANCE} element={<HistoriquePerformanceCollecteurPage />} />
              </Route>

              {/* Dépôt épargne guichet (Caissier, Admin, Gestionnaire, ChefAgence) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.ChefAgence, RoleUtilisateur.Caissier]} />}>
                <Route path={AppRoutes.DEPOT_AGENCE} element={<CreateDepotAgencePage />} />
              </Route>

              {/* Audit / Historique (Admin, Super Admin) */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise]} />}>
                <Route path={AppRoutes.AUDIT} element={<AuditPage />} />
              </Route>

              {/* Super Admin */}
              <Route element={<RoleGuard allowedRoles={[RoleUtilisateur.SuperAdmin]} />}>
                <Route path={AppRoutes.SUPER_ADMIN_DASHBOARD} element={<SuperAdminDashboard />} />
                <Route path={AppRoutes.SUPER_ADMIN_ENTREPRISES} element={<EntreprisesPage />} />
                <Route path={AppRoutes.SUPER_ADMIN_ENTREPRISE_DETAIL} element={<EntrepriseDetailPage />} />
                <Route path={AppRoutes.SUPER_ADMIN_ABONNEMENTS} element={<AbonnementsPage />} />
                <Route path={AppRoutes.SUPER_ADMIN_PARAMETRES} element={<ParametresPlateformePage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* ─── Redirect par défaut ───────────────── */}
        <Route path="*" element={<Navigate to={AppRoutes.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
