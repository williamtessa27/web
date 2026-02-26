import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
  HiOutlineUserPlus,
  HiOutlineBuildingOffice2,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlinePlayCircle,
  HiOutlineBanknotes,
  HiOutlineCreditCard,
  HiOutlineCalendar,
} from 'react-icons/hi2';
import { entrepriseApi, utilisateurApi } from '@/core/api';
import type { Entreprise, Utilisateur, PaginatedResponse } from '@/types';
import { StatutEntreprise } from '@/types';
import { RoleUtilisateur } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

type EntrepriseDetail = Entreprise & {
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
};

const statutLabels: Record<StatutEntreprise, string> = {
  [StatutEntreprise.EN_ATTENTE]: 'En attente',
  [StatutEntreprise.ACTIVE]: 'Active',
  [StatutEntreprise.SUSPENDUE]: 'Suspendue',
  [StatutEntreprise.BLOQUEE]: 'Bloquée',
};

const roleLabels: Record<RoleUtilisateur, string> = {
  [RoleUtilisateur.SuperAdmin]: 'Super Admin',
  [RoleUtilisateur.AdminEntreprise]: 'Admin Entreprise',
  [RoleUtilisateur.Gestionnaire]: 'Gestionnaire',
  [RoleUtilisateur.Collecteur]: 'Collecteur',
  [RoleUtilisateur.Client]: 'Client',
};

function InfoRow({ label, value, className }: { label: string; value?: string | number | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      {[...Array(6)].map((_, i) => (
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

export default function EntrepriseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [entreprise, setEntreprise] = useState<EntrepriseDetail | null>(null);
  const [users, setUsers] = useState<PaginatedResponse<Utilisateur> | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dateFinEssaiEdit, setDateFinEssaiEdit] = useState<string>('');
  const [savingDateFinEssai, setSavingDateFinEssai] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    entrepriseApi
      .getDetail(id)
      .then(setEntreprise)
      .catch(() => toast.error('Erreur lors du chargement de l\'entreprise'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setUsersLoading(true);
    utilisateurApi
      .list({ entrepriseId: id })
      .then(setUsers)
      .catch(() => toast.error('Erreur lors du chargement des utilisateurs'))
      .finally(() => setUsersLoading(false));
  }, [id]);

  const handleBloquer = async () => {
    if (!id || !entreprise) return;
    if (!window.confirm('Êtes-vous sûr de vouloir bloquer cette entreprise ?')) return;
    setActionLoading(true);
    try {
      const updated = await entrepriseApi.bloquer(id);
      setEntreprise((prev) => (prev ? { ...prev, ...updated } : null));
      toast.success('Entreprise bloquée avec succès');
    } catch {
      toast.error('Erreur lors du blocage');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActiver = async () => {
    if (!id || !entreprise) return;
    if (!window.confirm('Activer cette entreprise ? Elle pourra alors se connecter à la plateforme.')) return;
    setActionLoading(true);
    try {
      const updated = await entrepriseApi.activer(id);
      setEntreprise((prev) => (prev ? { ...prev, ...updated } : null));
      toast.success('Entreprise activée avec succès');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erreur lors de l\'activation';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDebloquer = async () => {
    if (!id || !entreprise) return;
    if (!window.confirm('Êtes-vous sûr de vouloir débloquer cette entreprise ?')) return;
    setActionLoading(true);
    try {
      const updated = await entrepriseApi.debloquer(id);
      setEntreprise((prev) => (prev ? { ...prev, ...updated } : null));
      toast.success('Entreprise débloquée avec succès');
    } catch {
      toast.error('Erreur lors du déblocage');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDateFinEssai = async () => {
    if (!id || !entreprise) return;
    const raw = dateFinEssaiEdit.trim();
    if (!raw) {
      toast.error('Veuillez choisir une date');
      return;
    }
    setSavingDateFinEssai(true);
    try {
      const updated = await entrepriseApi.update(id, { dateFinEssai: raw });
      setEntreprise((prev) => (prev ? { ...prev, ...updated } : null));
      setDateFinEssaiEdit('');
      toast.success('Date de fin d\'essai enregistrée');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSavingDateFinEssai(false);
    }
  };

  const isEnAttente = entreprise?.statut === StatutEntreprise.EN_ATTENTE;
  const isBloquee = entreprise?.statut === StatutEntreprise.BLOQUEE;

  if (loading) return <PageLoader />;
  if (!entreprise) {
    return (
      <div className="space-y-6">
        <Link
          to="/super-admin/entreprises"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Retour aux entreprises
        </Link>
        <Card>
          <EmptyState title="Entreprise introuvable" description="L'entreprise demandée n'existe pas ou a été supprimée." />
        </Card>
      </div>
    );
  }

  const stats = entreprise._stats ?? {
    utilisateurs: 0,
    collecteurs: 0,
    clients: 0,
    encoursEpargneTotal: 0,
    nbSouscriptionsEpargne: 0,
    encoursCreditTotal: 0,
    nbCreditsActifs: 0,
    nbEcheancesEnRetard: 0,
    impayesTotal: 0,
    tauxRemboursement: 0,
  };
  const formatMoney = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Top section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link
            to="/super-admin/entreprises"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Retour aux entreprises
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{entreprise.nom}</h1>
            <Badge
              variant={
                entreprise.statut === StatutEntreprise.ACTIVE
                  ? 'success'
                  : entreprise.statut === StatutEntreprise.BLOQUEE
                    ? 'danger'
                    : entreprise.statut === StatutEntreprise.EN_ATTENTE
                      ? 'info'
                      : 'warning'
              }
            >
              {statutLabels[entreprise.statut] ?? entreprise.statut}
            </Badge>
            <Badge variant={entreprise.profilComplete ? 'success' : 'warning'}>
              {entreprise.profilComplete ? 'Profil complet' : 'Profil incomplet'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Utilisateurs"
          value={stats.utilisateurs}
          icon={<HiOutlineUserGroup className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Collecteurs"
          value={stats.collecteurs}
          icon={<HiOutlineUserPlus className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Clients"
          value={stats.clients}
          icon={<HiOutlineBuildingOffice2 className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Encours épargne"
          value={formatMoney(stats.encoursEpargneTotal ?? 0)}
          icon={<HiOutlineBanknotes className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Encours crédit"
          value={formatMoney(stats.encoursCreditTotal ?? 0)}
          icon={<HiOutlineCreditCard className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title="Crédits actifs"
          value={stats.nbCreditsActifs ?? 0}
          icon={<HiOutlineCreditCard className="h-6 w-6" />}
          color="blue"
        />
      </div>
      {/* Indicateurs crédit (retards, impayés, taux remboursement) */}
      {(stats.nbEcheancesEnRetard != null || stats.impayesTotal != null || stats.tauxRemboursement != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Échéances en retard</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.nbEcheancesEnRetard ?? 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Impayés total</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{formatMoney(stats.impayesTotal ?? 0)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Taux remboursement</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.tauxRemboursement ?? 0} %</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enterprise info card */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations entreprise</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoRow label="Nom" value={entreprise.nom} />
              <InfoRow label="Téléphone" value={entreprise.telephone} />
              <InfoRow label="Email contact" value={entreprise.emailContact} />
              <InfoRow label="Secteur d'activité" value={entreprise.secteurActivite} />
              <InfoRow label="Ville" value={entreprise.ville} />
              <InfoRow label="Pays" value={entreprise.pays} />
              <InfoRow label="Adresse" value={entreprise.adresse} className="sm:col-span-2" />
              <InfoRow label="Code postal" value={entreprise.codePostal} />
              <InfoRow label="RCCM" value={entreprise.rccm} />
              <InfoRow label="Numéro fiscal" value={entreprise.numeroFiscal} />
              <InfoRow label="Site web" value={entreprise.siteWeb} />
              <InfoRow label="Nbre employés" value={entreprise.nbrEmployes} />
              <InfoRow label="Devise" value={entreprise.devise} />
              <InfoRow label="Taux commission défaut" value={entreprise.tauxCommissionDefaut != null ? `${entreprise.tauxCommissionDefaut}%` : undefined} />
              <InfoRow label="Date création entreprise" value={entreprise.dateCreationEntreprise ? format(new Date(entreprise.dateCreationEntreprise), 'dd MMM yyyy', { locale: fr }) : undefined} />
              <InfoRow label="Date inscription" value={entreprise.createdAt ? format(new Date(entreprise.createdAt), 'dd MMM yyyy', { locale: fr }) : undefined} />
              <InfoRow
                label="Fin période d'essai"
                value={
                  entreprise.dateFinEssai ? format(new Date(entreprise.dateFinEssai), 'dd MMM yyyy', { locale: fr }) : 'Non définie'
                }
                className="sm:col-span-2"
              />
            </div>
          </Card>
        </div>

        {/* Actions card */}
        <div>
          <Card className="rounded-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Période d'essai</p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="date"
                    value={dateFinEssaiEdit}
                    onChange={(e) => setDateFinEssaiEdit(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSetDateFinEssai}
                    disabled={savingDateFinEssai || !dateFinEssaiEdit.trim()}
                    isLoading={savingDateFinEssai}
                  >
                    <HiOutlineCalendar className="h-4 w-4" />
                    Définir fin essai
                  </Button>
                </div>
              </div>
              {isEnAttente ? (
                <Button
                  variant="primary"
                  className="w-full bg-primary-600 hover:bg-primary-700"
                  onClick={handleActiver}
                  isLoading={actionLoading}
                  disabled={actionLoading}
                >
                  <HiOutlinePlayCircle className="h-4 w-4" />
                  Activer l'entreprise
                </Button>
              ) : isBloquee ? (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleDebloquer}
                  isLoading={actionLoading}
                  disabled={actionLoading}
                >
                  <HiOutlineLockOpen className="h-4 w-4" />
                  Débloquer
                </Button>
              ) : (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={handleBloquer}
                  isLoading={actionLoading}
                  disabled={actionLoading}
                >
                  <HiOutlineLockClosed className="h-4 w-4" />
                  Bloquer
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Users table */}
      <Card padding={false} className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Utilisateurs de l'entreprise</h2>
        </div>
        {usersLoading ? (
          <TableSkeleton />
        ) : !users?.data.length ? (
          <EmptyState
            title="Aucun utilisateur"
            description="Cette entreprise n'a pas encore d'utilisateurs."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.data.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {u.prenom ? `${u.nom} ${u.prenom}` : u.nom}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          u.role === RoleUtilisateur.Gestionnaire ? 'info' :
                          u.role === RoleUtilisateur.Collecteur ? 'neutral' : 'neutral'
                        }
                        className={
                          u.role === RoleUtilisateur.Collecteur
                            ? 'bg-accent-50 text-accent-600 ring-accent-400/20'
                            : u.role === RoleUtilisateur.AdminEntreprise
                            ? 'bg-primary-50 text-primary-600 ring-primary-400/20'
                            : ''
                        }
                      >
                        {roleLabels[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.telephone || '—'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={u.actif ? 'success' : 'neutral'}>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy', { locale: fr }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
