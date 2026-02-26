import { useAuthStore } from '@/core/store/auth.store';
import { RoleUtilisateur } from '@/types';

export function isSuperAdmin(role?: RoleUtilisateur): boolean {
  return role === RoleUtilisateur.SuperAdmin;
}

export function isAdmin(role?: RoleUtilisateur): boolean {
  return role === RoleUtilisateur.SuperAdmin || role === RoleUtilisateur.AdminEntreprise;
}

export function isGestionnaire(role?: RoleUtilisateur): boolean {
  return role === RoleUtilisateur.Gestionnaire;
}

export function isDirecteur(role?: RoleUtilisateur): boolean {
  return role === RoleUtilisateur.Directeur;
}

export function isCollecteur(role?: RoleUtilisateur): boolean {
  return role === RoleUtilisateur.Collecteur;
}

export function isClient(role?: RoleUtilisateur): boolean {
  return role === RoleUtilisateur.Client;
}

/**
 * Roles ayant accès à l'interface web (pas collecteur/client → mobile)
 */
export function isWebRole(role?: RoleUtilisateur): boolean {
  return (
    role === RoleUtilisateur.SuperAdmin ||
    role === RoleUtilisateur.AdminEntreprise ||
    role === RoleUtilisateur.Directeur ||
    role === RoleUtilisateur.ChefAgence ||
    role === RoleUtilisateur.Gestionnaire ||
    role === RoleUtilisateur.GestionnaireCredit ||
    role === RoleUtilisateur.Caissier ||
    role === RoleUtilisateur.Auditeur
  );
}

type Permission =
  | 'canManageEntreprises'
  | 'canManageUsers'
  | 'canManageCollecteurs'
  | 'canManageClients'
  | 'canCreateClient'
  | 'canUpdateClient'
  | 'canValidateClient'
  | 'canDeleteClient'
  | 'canManageProduits'
  | 'canManageZones'
  | 'canViewCollectes'
  | 'canCreateCollecte'
  | 'canCreateDepotAgence'
  | 'canManageCommissions'
  | 'canViewDashboard'
  | 'canManageSouscriptions'
  | 'canManageTournees'
  | 'canBlockEntreprises'
  | 'canValidateCredit'
  | 'canValidateCollecte'
  | 'canCloseCaisse'
  | 'canExportReport'
  | 'canViewAudit'
  | 'canManageParametrage';

const permissionMap: Record<Permission, RoleUtilisateur[]> = {
  canManageEntreprises: [RoleUtilisateur.SuperAdmin],
  canBlockEntreprises: [RoleUtilisateur.SuperAdmin],
  canManageUsers: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.ChefAgence],
  canManageCollecteurs: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit],
  canManageClients: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit, RoleUtilisateur.Auditeur],
  canCreateClient: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.ChefAgence],
  canUpdateClient: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.ChefAgence, RoleUtilisateur.Directeur],
  canValidateClient: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.ChefAgence, RoleUtilisateur.Directeur],
  canDeleteClient: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise],
  canManageProduits: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit, RoleUtilisateur.Auditeur],
  canManageZones: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit, RoleUtilisateur.Auditeur],
  canViewCollectes: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit, RoleUtilisateur.Caissier, RoleUtilisateur.Auditeur],
  canCreateCollecte: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit],
  canCreateDepotAgence: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.ChefAgence, RoleUtilisateur.Caissier],
  canManageCommissions: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise],
  canManageSouscriptions: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit, RoleUtilisateur.Auditeur],
  canManageTournees: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit],
  canViewDashboard: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit, RoleUtilisateur.Caissier, RoleUtilisateur.Auditeur],
  canValidateCredit: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.GestionnaireCredit],
  canValidateCollecte: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Directeur, RoleUtilisateur.ChefAgence, RoleUtilisateur.Gestionnaire, RoleUtilisateur.GestionnaireCredit],
  canCloseCaisse: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Directeur, RoleUtilisateur.Caissier],
  canExportReport: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Gestionnaire, RoleUtilisateur.Directeur, RoleUtilisateur.Caissier, RoleUtilisateur.Auditeur],
  canViewAudit: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Directeur, RoleUtilisateur.Auditeur],
  canManageParametrage: [RoleUtilisateur.SuperAdmin, RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Directeur],
};

/**
 * Vérifie si un rôle a une permission.
 * Utilise la carte statique (fallback quand les permissions API ne sont pas encore chargées).
 */
export function hasPermission(role: RoleUtilisateur | undefined, permission: Permission): boolean {
  if (!role) return false;
  if (role === RoleUtilisateur.SuperAdmin) return true;
  return permissionMap[permission]?.includes(role) ?? false;
}

/**
 * Vérifie si l'utilisateur connecté a une permission.
 * Source de vérité : matrice chargée depuis GET /permissions/me (page Paramètres > Permissions).
 * Tant que permissionCodes n'est pas chargé, utilise la carte statique pour le rôle courant.
 */
export function useHasPermission(permission: Permission): boolean {
  const user = useAuthStore((s) => s.user);
  const permissionCodes = useAuthStore((s) => s.permissionCodes);
  const role = user?.role;
  if (!role) return false;
  if (role === RoleUtilisateur.SuperAdmin) return true;
  if (permissionCodes) return permissionCodes.includes(permission);
  return permissionMap[permission]?.includes(role) ?? false;
}
