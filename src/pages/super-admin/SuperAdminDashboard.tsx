import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { entrepriseApi } from '@/core/api';
import type { Entreprise, PaginatedResponse } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

type PlatformStats = {
  entreprises: { total: number; actives: number; bloquees: number; profilIncomplet: number };
  utilisateurs: number;
  collecteurs: number;
  clients: number;
};

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-1 h-14 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-9 w-16 mt-3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  borderColor: string;
  iconBgColor: string;
}

function StatCard({ title, value, icon, borderColor, iconBgColor }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex`}>
      <div className={`w-1.5 flex-shrink-0 ${borderColor}`} />
      <div className="flex-1 p-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value.toLocaleString('fr-FR')}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBgColor}`}>{icon}</div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatutBadgeVariant(statut: string) {
  if (statut === 'ACTIVE') return 'success';
  if (statut === 'BLOQUEE') return 'danger';
  return 'warning';
}

function getStatutLabel(statut: string) {
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    SUSPENDUE: 'Suspendue',
    BLOQUEE: 'Bloquée',
  };
  return labels[statut] ?? statut;
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentEntreprises, setRecentEntreprises] = useState<PaginatedResponse<Entreprise> | null>(null);

  useEffect(() => {
    Promise.all([
      entrepriseApi.platformStats(),
      entrepriseApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' }),
    ])
      .then(([platformStats, entreprises]) => {
        setStats(platformStats);
        setRecentEntreprises(entreprises);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 mt-2 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        <div>
          <div className="h-5 w-48 mb-4 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        <div>
          <div className="h-5 w-56 mb-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const entreprises = stats?.entreprises ?? { total: 0, actives: 0, bloquees: 0, profilIncomplet: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Plateforme</h1>
        <p className="text-gray-500 mt-1">Vue globale de l&apos;écosystème Kimistack</p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Entreprises"
          value={entreprises.total}
          icon={<HiOutlineBuildingOffice2 className="h-6 w-6 text-primary-600" />}
          borderColor="bg-primary-500"
          iconBgColor="bg-primary-50"
        />
        <StatCard
          title="Utilisateurs"
          value={stats?.utilisateurs ?? 0}
          icon={<HiOutlineUsers className="h-6 w-6 text-secondary-600" />}
          borderColor="bg-secondary-500"
          iconBgColor="bg-secondary-50"
        />
        <StatCard
          title="Collecteurs"
          value={stats?.collecteurs ?? 0}
          icon={<HiOutlineUserGroup className="h-6 w-6 text-accent-600" />}
          borderColor="bg-accent-500"
          iconBgColor="bg-accent-50"
        />
        <StatCard
          title="Clients"
          value={stats?.clients ?? 0}
          icon={<HiOutlineUsers className="h-6 w-6 text-warning-600" />}
          borderColor="bg-warning-500"
          iconBgColor="bg-warning-50"
        />
      </div>

      {/* Enterprise breakdown section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des entreprises</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4">
            <div className="w-2 h-12 rounded-full bg-accent-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Actives</p>
              <p className="text-2xl font-bold text-gray-900">{entreprises.actives}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-2 h-12 rounded-full bg-error-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Bloquées</p>
              <p className="text-2xl font-bold text-gray-900">{entreprises.bloquees}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-2 h-12 rounded-full bg-warning-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Profil Incomplet</p>
              <p className="text-2xl font-bold text-gray-900">{entreprises.profilIncomplet}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent enterprises table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Entreprises récentes</h2>
          <Link
            to={AppRoutes.SUPER_ADMIN_ENTREPRISES}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Voir tout
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Card padding={false}>
          {!recentEntreprises?.data.length ? (
            <div className="p-12 text-center text-gray-500">
              Aucune entreprise pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ville</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Profil</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentEntreprises.data.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{e.nom}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{e.ville || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatutBadgeVariant(e.statut)}>{getStatutLabel(e.statut)}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={e.profilComplete ? 'success' : 'warning'}>
                          {e.profilComplete ? 'Complet' : 'Incomplet'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
