import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUserPlus,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineEye,
} from 'react-icons/hi2';
import { AppRoutes } from '@/config/routes.config';
import { utilisateurApi, agenceApi } from '@/core/api';
import { useAuthStore } from '@/core/store/auth.store';
import type { Utilisateur, PaginatedResponse, CreateUtilisateurRequest, Agence } from '@/types';
import { RoleUtilisateur } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Select from '@/components/ui/Select';
import { PageLoader } from '@/components/ui/LoadingSpinner';

type TabFilter = 'all' | RoleUtilisateur;

/** Rôles créables via "Nouvel utilisateur" (hors Collecteur : flux dédié) */
const ROLES_CREATABLES: RoleUtilisateur[] = [
  RoleUtilisateur.AdminEntreprise,
  RoleUtilisateur.Directeur,
  RoleUtilisateur.ChefAgence,
  RoleUtilisateur.Gestionnaire,
  RoleUtilisateur.GestionnaireCredit,
  RoleUtilisateur.Caissier,
  RoleUtilisateur.Auditeur,
];

const roleLabels: Record<RoleUtilisateur, string> = {
  [RoleUtilisateur.SuperAdmin]: 'Super Admin',
  [RoleUtilisateur.AdminEntreprise]: 'Admin Entreprise',
  [RoleUtilisateur.Directeur]: 'Directeur',
  [RoleUtilisateur.ChefAgence]: 'Chef d\'agence',
  [RoleUtilisateur.Gestionnaire]: 'Gestionnaire',
  [RoleUtilisateur.GestionnaireCredit]: 'Gestionnaire crédit',
  [RoleUtilisateur.Caissier]: 'Caissier',
  [RoleUtilisateur.Collecteur]: 'Collecteur',
  [RoleUtilisateur.Auditeur]: 'Auditeur',
  [RoleUtilisateur.Client]: 'Client',
};

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default function UtilisateursPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [data, setData] = useState<PaginatedResponse<Utilisateur> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [stats, setStats] = useState({ gestionnaires: 0, collecteurs: 0, total: 0 });
  const [showCreateUtilisateur, setShowCreateUtilisateur] = useState(false);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [isSubmittingUtilisateur, setIsSubmittingUtilisateur] = useState(false);
  const [togglingActifId, setTogglingActifId] = useState<string | null>(null);
  const [confirmDesactiverUser, setConfirmDesactiverUser] = useState<Utilisateur | null>(null);

  const {
    register: registerUtilisateur,
    control: controlUtilisateur,
    handleSubmit: handleSubmitUtilisateur,
    reset: resetUtilisateur,
    watch: watchUtilisateur,
    formState: { errors: errorsUtilisateur },
  } = useForm<CreateUtilisateurRequest>({
    defaultValues: { role: RoleUtilisateur.Gestionnaire },
    mode: 'onBlur',
  });

  useEffect(() => {
    loadData();
  }, [search, tabFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (showCreateUtilisateur) agenceApi.list(true).then(setAgences).catch(() => setAgences([]));
  }, [showCreateUtilisateur]);

  const loadStats = async () => {
    try {
      const counts = await utilisateurApi.countByRole();
      const gestionnaires = counts[RoleUtilisateur.Gestionnaire] ?? 0;
      const collecteurs = counts[RoleUtilisateur.Collecteur] ?? 0;
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setStats({
        gestionnaires,
        collecteurs,
        total,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement des statistiques utilisateurs');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        limit: 50,
        search: search || undefined,
      };
      if (tabFilter !== 'all') params.role = tabFilter;
      const res = await utilisateurApi.list(params);
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement des utilisateurs');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const onCreateUtilisateur = async (payload: CreateUtilisateurRequest) => {
    setIsSubmittingUtilisateur(true);
    try {
      await utilisateurApi.create({
        nom: payload.nom.trim(),
        prenom: payload.prenom?.trim() ?? '',
        email: payload.email.trim(),
        telephone: payload.telephone?.trim() || undefined,
        motDePasse: payload.motDePasse,
        role: payload.role,
        idAgence: payload.idAgence || undefined,
      });
      toast.success(`${roleLabels[payload.role]} créé avec succès.`);
      setShowCreateUtilisateur(false);
      resetUtilisateur();
      loadData();
      loadStats();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data?.message
        ?? (err as { message?: string })?.message ?? 'Erreur lors de la création';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setIsSubmittingUtilisateur(false);
    }
  };

  const displayUsers = data?.data ?? [];

  const handleToggleActif = async (u: Utilisateur) => {
    if (u.role === 'SuperAdmin') return;
    setTogglingActifId(u.id);
    setConfirmDesactiverUser(null);
    try {
      await utilisateurApi.update(u.id, { actif: !u.actif });
      toast.success(u.actif ? 'Compte désactivé.' : 'Compte activé.');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setTogglingActifId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 mt-1">
          Gérez les utilisateurs de votre entreprise (admin, directeur, chef d&apos;agence, gestionnaire, caissier, collecteur, auditeur…).
        </p>
      </div>

      {/* Stats header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Gestionnaires"
          value={stats.gestionnaires}
          icon={<HiOutlineUserPlus className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Collecteurs"
          value={stats.collecteurs}
          icon={<HiOutlineUserGroup className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total"
          value={stats.total}
          icon={<HiOutlineUsers className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Toolbar: search + tabs + actions */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center flex-1">
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filtre par rôle */}
            <Select
              value={tabFilter}
              onChange={(e) => setTabFilter(e.target.value as TabFilter)}
              className="max-w-[200px]"
            >
              <option value="all">Tous les rôles</option>
              {ROLES_CREATABLES.map((r) => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
              <option value={RoleUtilisateur.Collecteur}>{roleLabels[RoleUtilisateur.Collecteur]}</option>
            </Select>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => setShowCreateUtilisateur(true)}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <HiOutlineUserPlus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(AppRoutes.COLLECTEUR_CREATE)}
              className="border-secondary-300 text-secondary-600 hover:bg-secondary-50"
            >
              <HiOutlineUserGroup className="h-4 w-4" />
              Ajouter un collecteur
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <TableSkeleton />
        ) : !displayUsers.length ? (
          <EmptyState
            title="Aucun utilisateur"
            description={
              tabFilter === 'all'
                ? 'Ajoutez des utilisateurs (admin, directeur, chef d\'agence, gestionnaire, caissier…) pour commencer.'
                : `Aucun utilisateur avec le rôle « ${typeof tabFilter === 'string' ? roleLabels[tabFilter as RoleUtilisateur] ?? tabFilter : tabFilter} » trouvé.`
            }
            action={
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateUtilisateur(true)}>
                  <HiOutlineUserPlus className="h-4 w-4" />
                  Nouvel utilisateur
                </Button>
                <Button variant="secondary" onClick={() => navigate(AppRoutes.COLLECTEUR_CREATE)}>
                  <HiOutlineUserGroup className="h-4 w-4" />
                  Ajouter un collecteur
                </Button>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-subtle/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayUsers.map((u, index) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-primary-50/30 transition-colors ${
                      index % 2 === 1 ? 'bg-subtle/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {u.prenom ? `${u.nom} ${u.prenom}` : u.nom}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          [RoleUtilisateur.AdminEntreprise, RoleUtilisateur.Directeur].includes(u.role) ? 'info' :
                          [RoleUtilisateur.ChefAgence, RoleUtilisateur.Gestionnaire, RoleUtilisateur.GestionnaireCredit].includes(u.role) ? 'success' :
                          u.role === RoleUtilisateur.Collecteur ? 'warning' : 'neutral'
                        }
                        className={
                          u.role === RoleUtilisateur.Collecteur
                            ? 'bg-accent-50 text-accent-600 ring-accent-400/20'
                            : ''
                        }
                      >
                        {roleLabels[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {u.telephone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.actif ? 'success' : 'neutral'}>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {u.createdAt
                        ? format(new Date(u.createdAt), 'dd MMM yyyy', { locale: fr })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== 'SuperAdmin' &&
                          (u.actif
                            ? (currentUser?.role !== RoleUtilisateur.AdminEntreprise || currentUser?.id !== u.id) && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDesactiverUser(u)}
                                  disabled={togglingActifId === u.id}
                                  className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium rounded-lg transition-colors text-amber-600 hover:bg-amber-50"
                                  title="Désactiver le compte"
                                >
                                  {togglingActifId === u.id ? '…' : 'Désactiver'}
                                </button>
                              )
                            : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleActif(u)}
                                  disabled={togglingActifId === u.id}
                                  className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium rounded-lg transition-colors text-green-600 hover:bg-green-50"
                                  title="Activer le compte"
                                >
                                  {togglingActifId === u.id ? '…' : 'Activer'}
                                </button>
                              ))}
                        <Link
                          to={AppRoutes.UTILISATEUR_DETAIL.replace(':id', u.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <HiOutlineEye className="h-4 w-4" />
                          Voir
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal confirmation désactivation */}
      <Modal
        open={!!confirmDesactiverUser}
        onClose={() => setConfirmDesactiverUser(null)}
        title="Désactiver le compte"
        size="sm"
      >
        {confirmDesactiverUser && (
          <>
            <p className="text-gray-600 text-sm">
              Confirmer la désactivation du compte de <strong>{confirmDesactiverUser.prenom ? `${confirmDesactiverUser.nom} ${confirmDesactiverUser.prenom}` : confirmDesactiverUser.nom}</strong> ({roleLabels[confirmDesactiverUser.role] ?? confirmDesactiverUser.role}) ? Il ou elle ne pourra plus se connecter sur le web ni sur l&apos;application mobile.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="secondary" onClick={() => setConfirmDesactiverUser(null)}>Annuler</Button>
              <Button
                variant="secondary"
                onClick={() => handleToggleActif(confirmDesactiverUser)}
                isLoading={togglingActifId === confirmDesactiverUser.id}
              >
                Désactiver le compte
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal Nouvel utilisateur (tous les rôles) */}
      <Modal
        open={showCreateUtilisateur}
        onClose={() => { setShowCreateUtilisateur(false); resetUtilisateur(); }}
        title="Nouvel utilisateur"
        size="lg"
      >
        <form onSubmit={handleSubmitUtilisateur(onCreateUtilisateur)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom *"
              placeholder="Nom de famille"
              error={errorsUtilisateur.nom?.message}
              {...registerUtilisateur('nom', { required: 'Le nom est requis' })}
            />
            <Input
              label="Prénom *"
              placeholder="Prénom"
              error={errorsUtilisateur.prenom?.message}
              {...registerUtilisateur('prenom', { required: 'Le prénom est requis' })}
            />
            <Input
              label="Email *"
              type="email"
              placeholder="email@entreprise.com"
              error={errorsUtilisateur.email?.message}
              {...registerUtilisateur('email', { required: "L'email est requis" })}
            />
            <Controller
              name="telephone"
              control={controlUtilisateur}
              render={({ field }) => (
                <PhoneInput
                  label="Téléphone"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errorsUtilisateur.telephone?.message}
                />
              )}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...registerUtilisateur('role', { required: 'Sélectionnez un rôle' })}
              >
                {ROLES_CREATABLES.map((r) => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agence {[RoleUtilisateur.ChefAgence, RoleUtilisateur.Caissier].includes(watchUtilisateur('role')) && '*'}
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...registerUtilisateur('idAgence', {
                  validate: (v, values) =>
                    (values.role === RoleUtilisateur.ChefAgence || values.role === RoleUtilisateur.Caissier) && !v?.trim()
                      ? "L'agence est obligatoire pour le chef d'agence et le caissier."
                      : undefined,
                })}
              >
                <option value="">— Toute l&apos;entreprise —</option>
                {agences.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom}</option>
                ))}
              </select>
              {errorsUtilisateur.idAgence?.message && (
                <p className="text-xs text-red-600 mt-1">{errorsUtilisateur.idAgence.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Obligatoire pour le chef d&apos;agence et le caissier. Modifiable ensuite uniquement par l&apos;admin.</p>
            </div>
            <Input
              label="Mot de passe *"
              type="password"
              placeholder="Min. 8 caractères, 1 maj, 1 min, 1 chiffre"
              passwordToggle
              error={errorsUtilisateur.motDePasse?.message}
              {...registerUtilisateur('motDePasse', {
                required: 'Le mot de passe est requis',
                minLength: { value: 8, message: 'Minimum 8 caractères' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Au moins une majuscule, une minuscule et un chiffre',
                },
              })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreateUtilisateur(false)}>Annuler</Button>
            <Button type="submit" isLoading={isSubmittingUtilisateur}>Créer l&apos;utilisateur</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
