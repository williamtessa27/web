import { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import {
  HiOutlineHome,
  HiOutlineBell,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineUserPlus,
  HiOutlineBanknotes,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineMapPin,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineBuildingOffice2,
  HiOutlineCog6Tooth,
  HiOutlineLockClosed,
  HiOutlineClipboardDocumentList,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineArrowDownTray,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineBookOpen,
  HiOutlineArrowsRightLeft,
} from 'react-icons/hi2';
import { PanelRightOpen, PanelLeftOpen } from 'lucide-react';
import { useAuthStore } from '@/core/store/auth.store';
import { ApiConfig } from '@/config/api.config';
import { AppRoutes } from '@/config/routes.config';
import { isSuperAdmin, isAdmin, isGestionnaire, isDirecteur, useHasPermission } from '@/config/permissions';
import { RoleUtilisateur } from '@/types';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface NavGroup {
  id: string;
  labelKey: string;
  items: NavItem[];
}

const SIDEBAR_STORAGE_KEY = 'collect_app_sidebar_collapsed';
const SIDEBAR_GROUPS_KEY = 'collect_app_sidebar_groups';

export function getSidebarCollapsedDefault(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSidebarCollapsedInStorage(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

function getSidebarGroupsDefault(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(SIDEBAR_GROUPS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, boolean>;
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch {
    /* ignore */
  }
  return {
    clients: true,
    organisation: true,
    produitsMicrofinance: true,
    collecte: true,
    epargne: true,
    credit: true,
    financeCaisse: true,
    clotureControle: true,
    importExport: true,
    parametres: true,
    plateforme: true,
  };
}

export function setSidebarGroupsInStorage(groups: Record<string, boolean>): void {
  try {
    localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(groups));
  } catch {
    /* ignore */
  }
}

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ mobile, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { t } = useTranslation();
  const { user, entreprise } = useAuthStore();
  const role = user?.role;
  const canCreateDepotAgence = useHasPermission('canCreateDepotAgence');
  const canCloseCaisse = useHasPermission('canCloseCaisse');
  const canCreateClient = useHasPermission('canCreateClient');
  const canExportReport = useHasPermission('canExportReport');
  const logoUrl = entreprise?.logoUrl;

  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>(getSidebarGroupsDefault);

  const toggleGroup = useCallback((id: string) => {
    setGroupsOpen((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setSidebarGroupsInStorage(next);
      return next;
    });
  }, []);

  const groups: NavGroup[] = [];

  // Super Admin : uniquement la rubrique "Administration de la plateforme"
  if (isSuperAdmin(role)) {
    groups.push({
      id: 'plateforme',
      labelKey: 'sidebar.groups.plateforme',
      items: [
        { label: t('sidebar.dashboardPlatform'), to: AppRoutes.SUPER_ADMIN_DASHBOARD, icon: <HiOutlineHome className="h-5 w-5" /> },
        { label: t('sidebar.entreprises'), to: AppRoutes.SUPER_ADMIN_ENTREPRISES, icon: <HiOutlineBuildingOffice2 className="h-5 w-5" /> },
        { label: t('sidebar.abonnements', 'Abonnements'), to: AppRoutes.SUPER_ADMIN_ABONNEMENTS, icon: <HiOutlineCreditCard className="h-5 w-5" /> },
        { label: t('sidebar.parametresPlateforme', 'Paramètres plateforme'), to: AppRoutes.SUPER_ADMIN_PARAMETRES, icon: <HiOutlineCog6Tooth className="h-5 w-5" /> },
      ],
    });
  } else {
  // Clients
  groups.push({
    id: 'clients',
    labelKey: 'sidebar.groups.clients',
    items: [
      { label: t('sidebar.clients'), to: AppRoutes.CLIENTS, icon: <HiOutlineUsers className="h-5 w-5" /> },
    ],
  });

  // Organisation
  const orgItems: NavItem[] = [];
  if (isAdmin(role)) orgItems.push({ label: t('sidebar.utilisateurs'), to: AppRoutes.UTILISATEURS, icon: <HiOutlineUserPlus className="h-5 w-5" /> });
  if (isAdmin(role) || isGestionnaire(role)) {
    orgItems.push(
      { label: t('sidebar.collecteurs'), to: AppRoutes.COLLECTEURS, icon: <HiOutlineUserGroup className="h-5 w-5" /> },
      { label: t('sidebar.carteCollecteurs', 'Carte des collecteurs'), to: AppRoutes.COLLECTEURS_MAP, icon: <HiOutlineMapPin className="h-5 w-5" /> },
      { label: t('sidebar.zones'), to: AppRoutes.ZONES, icon: <HiOutlineMapPin className="h-5 w-5" /> },
      { label: t('sidebar.agences'), to: AppRoutes.AGENCES, icon: <HiOutlineBuildingOffice2 className="h-5 w-5" /> },
    );
  } else if (isDirecteur(role) || role === RoleUtilisateur.ChefAgence) {
    orgItems.push(
      { label: t('sidebar.carteCollecteurs', 'Carte des collecteurs'), to: AppRoutes.COLLECTEURS_MAP, icon: <HiOutlineMapPin className="h-5 w-5" /> },
    );
  }
  if (orgItems.length > 0) {
    groups.push({ id: 'organisation', labelKey: 'sidebar.groups.organisation', items: orgItems });
  }

  // Produits microfinance transversaux (Collecte, Épargne, Crédit)
  if (isAdmin(role) || isGestionnaire(role)) {
    groups.push({
      id: 'produitsMicrofinance',
      labelKey: 'sidebar.groups.produitsMicrofinance',
      items: [
        { label: t('sidebar.produitsMicrofinance'), to: AppRoutes.PRODUITS_MICROFINANCE, icon: <HiOutlineCube className="h-5 w-5" /> },
      ],
    });
  }

  // Collecte terrain
  const collecteItems: NavItem[] = [
    { label: t('sidebar.collectes'), to: AppRoutes.COLLECTES, icon: <HiOutlineBanknotes className="h-5 w-5" /> },
  ];
  if (isAdmin(role) || isGestionnaire(role)) {
    collecteItems.push(
      { label: t('sidebar.tournees'), to: AppRoutes.TOURNEES, icon: <HiOutlineTruck className="h-5 w-5" /> },
      { label: t('sidebar.plansCollecte'), to: AppRoutes.PLANS_COLLECTE, icon: <HiOutlineCube className="h-5 w-5" /> },
      { label: t('sidebar.historiquePerformance'), to: AppRoutes.RAPPORTS_PERFORMANCE, icon: <HiOutlineUserGroup className="h-5 w-5" /> },
    );
  }
  groups.push({ id: 'collecte', labelKey: 'sidebar.groups.collecte', items: collecteItems });

  // Épargne
  const epargneItems: NavItem[] = [];
  if (isAdmin(role) || isGestionnaire(role)) {
    epargneItems.push(
      { label: t('sidebar.comptesEpargne', 'Comptes épargne'), to: AppRoutes.SOUSCRIPTIONS, icon: <HiOutlineDocumentText className="h-5 w-5" /> },
      { label: t('sidebar.demandesRetrait'), to: AppRoutes.DEMANDES_RETRAIT, icon: <HiOutlineArrowDownTray className="h-5 w-5" /> },
      { label: t('sidebar.encoursEpargne'), to: AppRoutes.ENCOURS_EPARGNE, icon: <HiOutlineChartBar className="h-5 w-5" /> },
    );
  } else if (isDirecteur(role)) {
    epargneItems.push(
      { label: t('sidebar.encoursEpargne'), to: AppRoutes.ENCOURS_EPARGNE, icon: <HiOutlineChartBar className="h-5 w-5" /> },
    );
  }
  if (canCreateDepotAgence) {
    epargneItems.push(
      { label: t('sidebar.depotAgence'), to: AppRoutes.DEPOT_AGENCE, icon: <HiOutlineBanknotes className="h-5 w-5" /> },
    );
  }
  if (epargneItems.length > 0) {
    groups.push({ id: 'epargne', labelKey: 'sidebar.groups.epargne', items: epargneItems });
  }

  // Crédit
  const creditItems: NavItem[] = [];
  if (isAdmin(role) || isGestionnaire(role)) {
    creditItems.push({ label: t('sidebar.credit'), to: AppRoutes.CREDIT, icon: <HiOutlineCreditCard className="h-5 w-5" /> });
    if (isAdmin(role)) {
      creditItems.push(
        { label: t('sidebar.garanties'), to: AppRoutes.GARANTIES, icon: <HiOutlineShieldCheck className="h-5 w-5" /> },
        { label: t('sidebar.creditPartners', 'Partenaires crédit'), to: AppRoutes.CREDIT_PARTNERS, icon: <HiOutlineBuildingOffice2 className="h-5 w-5" /> },
      );
    }
  }
  if (creditItems.length > 0) {
    groups.push({ id: 'credit', labelKey: 'sidebar.groups.credit', items: creditItems });
  }

  // Finance & caisse
  const finItems: NavItem[] = [];
  if (isAdmin(role) || isGestionnaire(role)) {
    finItems.push(
      { label: t('sidebar.comptabilite'), to: AppRoutes.COMPTABILITE, icon: <HiOutlineDocumentText className="h-5 w-5" /> },
      { label: t('sidebar.planComptes', 'Plan de comptes'), to: AppRoutes.COMPTABILITE_PLAN, icon: <HiOutlineCog6Tooth className="h-5 w-5" /> },
      { label: t('sidebar.commissions'), to: AppRoutes.COMMISSIONS, icon: <HiOutlineCurrencyDollar className="h-5 w-5" /> },
    );
  }
  if (role === RoleUtilisateur.Caissier && !finItems.some((i) => i.to === AppRoutes.COMPTABILITE)) {
    finItems.push({ label: t('sidebar.comptabilite'), to: AppRoutes.COMPTABILITE, icon: <HiOutlineDocumentText className="h-5 w-5" /> });
  }
  if (finItems.length > 0) {
    groups.push({ id: 'financeCaisse', labelKey: 'sidebar.groups.financeCaisse', items: finItems });
  }

  // Clôture & Contrôle
  const clotureItems: NavItem[] = [];
  if (isAdmin(role) || isGestionnaire(role) || canCloseCaisse) {
    clotureItems.push({ label: t('sidebar.cloture'), to: AppRoutes.CLOTURE, icon: <HiOutlineLockClosed className="h-5 w-5" /> });
  }
  if (isAdmin(role) || isGestionnaire(role) || canCloseCaisse || role === RoleUtilisateur.Caissier) {
    clotureItems.push({ label: t('sidebar.caisseAgence'), to: AppRoutes.CAISSE_AGENCE, icon: <HiOutlineBanknotes className="h-5 w-5" /> });
  }
  if (isAdmin(role)) {
    clotureItems.push({ label: t('sidebar.audit'), to: AppRoutes.AUDIT, icon: <HiOutlineClipboardDocumentList className="h-5 w-5" /> });
  }
  if (clotureItems.length > 0) {
    groups.push({ id: 'clotureControle', labelKey: 'sidebar.groups.clotureControle', items: clotureItems });
  }

  // Import & Export
  if (canCreateClient || canExportReport) {
    groups.push({
      id: 'importExport',
      labelKey: 'sidebar.groups.importExport',
      items: [
        { label: t('sidebar.clients'), to: AppRoutes.IMPORT_EXPORT, icon: <HiOutlineArrowsRightLeft className="h-5 w-5" /> },
      ],
    });
  }

  // Paramètres
  if (isAdmin(role)) {
    const paramItems: NavItem[] = [
      { label: t('sidebar.parametres'), to: AppRoutes.PARAMETRES, icon: <HiOutlineCog6Tooth className="h-5 w-5" /> },
      { label: t('sidebar.permissions'), to: AppRoutes.PERMISSIONS, icon: <HiOutlineLockClosed className="h-5 w-5" /> },
    ];
    paramItems.push({ label: t('sidebar.mesAbonnements', 'Mes abonnements'), to: AppRoutes.MES_ABONNEMENTS, icon: <HiOutlineCreditCard className="h-5 w-5" /> });
    groups.push({
      id: 'parametres',
      labelKey: 'sidebar.groups.parametres',
      items: paramItems,
    });
  } else if (isGestionnaire(role)) {
    groups.push({
      id: 'parametres',
      labelKey: 'sidebar.groups.parametres',
      items: [
        { label: t('sidebar.mesAbonnements', 'Mes abonnements'), to: AppRoutes.MES_ABONNEMENTS, icon: <HiOutlineCreditCard className="h-5 w-5" /> },
      ],
    });
  }

  }

  const isCollapsed = !mobile && collapsed;
  const showToggle = !mobile && onToggleCollapse != null;

  const linkBase = 'rounded-lg text-sm font-medium transition-colors';
  const linkActive = 'bg-primary-50 text-primary-700';
  const linkInactive = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-white border-r border-gray-200 transition-[width] duration-400 ease-in-out',
        mobile ? 'w-72' : isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo entreprise ou défaut + bouton rétracter (en haut) */}
      <div
        className={clsx(
          'flex items-center border-b border-gray-100 shrink-0',
          isCollapsed ? 'justify-center px-0 py-4' : 'gap-3 px-6 py-5',
        )}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={entreprise?.nom ?? 'Logo'}
            className={clsx(
              'object-contain shrink-0 bg-white rounded',
              isCollapsed ? 'h-10 w-10' : 'h-12 max-w-[8rem]',
            )}
          />
        ) : (
          <img
            src="/logo_collect.png"
            alt="Collect"
            className={clsx('object-contain shrink-0', isCollapsed ? 'h-10 w-10' : 'h-12')}
          />
        )}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
              {entreprise?.nom ?? 'Kimifinance'}
            </h1>
          </div>
        )}
        {showToggle && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
            title={isCollapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={clsx('flex-1 overflow-y-auto py-4 space-y-1', isCollapsed ? 'px-2' : 'px-3')}>
        {/* Dashboard et Notifications : masqués pour le Super Admin (uniquement Administration plateforme) */}
        {!isSuperAdmin(role) && (
          <>
            <NavLink
              to={AppRoutes.DASHBOARD}
              onClick={onClose}
              title={isCollapsed ? t('sidebar.dashboard') : undefined}
              className={({ isActive }) =>
                clsx(
                  linkBase,
                  'flex items-center',
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                  isActive ? linkActive : linkInactive,
                )
              }
            >
              <HiOutlineHome className="h-5 w-5" />
              {!isCollapsed && <span>{t('sidebar.dashboard')}</span>}
            </NavLink>
            <NavLink
              to={AppRoutes.NOTIFICATIONS}
              onClick={onClose}
              title={isCollapsed ? t('sidebar.notifications') : undefined}
              className={({ isActive }) =>
                clsx(
                  linkBase,
                  'flex items-center',
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                  isActive ? linkActive : linkInactive,
                )
              }
            >
              <HiOutlineBell className="h-5 w-5" />
              {!isCollapsed && <span>{t('sidebar.notifications')}</span>}
            </NavLink>
          </>
        )}

        {/* Dashboard agence (Chef d'agence) */}
        {role === RoleUtilisateur.ChefAgence && (
          <NavLink
            to={AppRoutes.DASHBOARD_AGENCE}
            onClick={onClose}
            title={isCollapsed ? (t('sidebar.dashboardAgence') || 'Mon dashboard agence') : undefined}
            className={({ isActive }) =>
              clsx(
                linkBase,
                'flex items-center',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActive ? linkActive : linkInactive,
              )
            }
          >
            <HiOutlineBuildingOffice2 className="h-5 w-5" />
            {!isCollapsed && <span>{t('sidebar.dashboardAgence') || 'Mon dashboard agence'}</span>}
          </NavLink>
        )}

        {/* Groupes repliables (masqués en mode collapsed -> liens plats) */}
        {isCollapsed ? (
          groups.flatMap((g) =>
            g.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={item.label}
                className={({ isActive }) =>
                  clsx(linkBase, 'flex items-center justify-center p-2.5', isActive ? linkActive : linkInactive)
                }
              >
                {item.icon}
              </NavLink>
            )),
          )
        ) : (
          groups.map((group) => {
            const isOpen = groupsOpen[group.id] ?? true;
            return (
              <div key={group.id} className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={clsx(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <span className="truncate">{t(group.labelKey, group.id === 'importExport' ? 'Import & Export' : group.labelKey)}</span>
                  <span className="shrink-0 text-gray-400">
                    {isOpen ? (
                      <HiOutlineChevronDown className="h-4 w-4" />
                    ) : (
                      <HiOutlineChevronRight className="h-4 w-4" />
                    )}
                  </span>
                </button>
                {isOpen && (
                  <div className="ml-2 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          clsx(linkBase, 'flex items-center gap-3 py-2 pl-2', isActive ? linkActive : linkInactive)
                        }
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Lien Documentation (nouvel onglet) */}
      <div className={clsx('shrink-0 border-t border-gray-100', isCollapsed ? 'px-0 py-2' : 'px-3 py-3')}>
        <a
          href={ApiConfig.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            linkBase,
            'flex items-center text-gray-500 hover:text-primary-600 hover:bg-primary-50',
            isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
          )}
          title={t('sidebar.documentation', 'Documentation')}
        >
          <HiOutlineBookOpen className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>{t('sidebar.documentation', 'Documentation')}</span>}
        </a>
      </div>

      {/* User */}
      {user && (
        <div
          className={clsx(
            'border-t border-gray-100 shrink-0',
            isCollapsed ? 'flex justify-center px-0 py-3' : 'px-4 py-4',
          )}
        >
          <div className={clsx('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}>
            <div
              className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
              title={isCollapsed ? `${user.nom} (${user.role})` : undefined}
            >
              {user.photoProfilUrl ? (
                <img src={user.photoProfilUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                user.nom.charAt(0)
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.nom}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
