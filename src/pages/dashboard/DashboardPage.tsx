import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import {
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineArrowTrendingUp,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/core/store/auth.store';
import { collecteApi, clientApi, collecteurApi, rapportApi } from '@/core/api';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollectes: 0,
    montantJour: 0,
    totalClients: 0,
    totalCollecteurs: 0,
    montant30Jours: 0,
    nbCollectes30Jours: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const dateDebut = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const [collectesToday, clients, collecteurs, rapport30] = await Promise.allSettled([
        collecteApi.list({ limit: 500, date: today }),
        clientApi.list({ limit: 1 }),
        collecteurApi.list({ limit: 1 }),
        rapportApi.totauxCollectes({ dateDebut, dateFin: today }),
      ]);

      const collectesData = collectesToday.status === 'fulfilled' ? collectesToday.value : null;
      const montantJour =
        collectesData?.data?.reduce((s, c) => s + Number(c.montant ?? 0), 0) ?? 0;
      const rapport = rapport30.status === 'fulfilled' ? rapport30.value : null;

      setStats({
        totalCollectes: collectesData?.meta?.total ?? 0,
        montantJour,
        totalClients: clients.status === 'fulfilled' ? clients.value.meta.total : 0,
        totalCollecteurs: collecteurs.status === 'fulfilled' ? collecteurs.value.meta.total : 0,
        montant30Jours: Number(rapport?.totalMontant ?? 0),
        nbCollectes30Jours: rapport?.nombreCollectes ?? 0,
      });
    } catch {
      // Silent fail — stats will show 0
    } finally {
      setLoading(false);
    }
  };

  const displayName = [user?.nom, user?.prenom].filter(Boolean).join(' ') || user?.nom || '';

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.greeting', { name: displayName })}
        </h1>
        <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid — Sprint 1 : KPIs dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={t('dashboard.stats.collectesDuJour')}
          value={stats.totalCollectes}
          icon={<HiOutlineBanknotes className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={t('dashboard.stats.montantDuJour')}
          value={`${stats.montantJour.toLocaleString('fr-FR')} XAF`}
          icon={<HiOutlineArrowTrendingUp className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title={t('dashboard.stats.clientsActifs')}
          value={stats.totalClients}
          icon={<HiOutlineUsers className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title={t('dashboard.stats.collecteurs')}
          value={stats.totalCollecteurs}
          icon={<HiOutlineUserGroup className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title={t('dashboard.stats.montant30Jours', 'Montant 30 jours')}
          value={`${stats.montant30Jours.toLocaleString('fr-FR')} XAF`}
          icon={<HiOutlineCalendarDays className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Quick actions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.quickActions.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/collectes"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-secondary-50 text-secondary-500 group-hover:bg-secondary-100">
              <HiOutlineBanknotes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t('dashboard.quickActions.newCollecte')}
              </p>
              <p className="text-xs text-gray-500">
                {t('dashboard.quickActions.newCollecteDesc')}
              </p>
            </div>
          </a>
          <a
            href="/clients"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100">
              <HiOutlineUsers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t('dashboard.quickActions.newClient')}
              </p>
              <p className="text-xs text-gray-500">
                {t('dashboard.quickActions.newClientDesc')}
              </p>
            </div>
          </a>
          <a
            href="/souscriptions"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-accent-50 text-accent-500 group-hover:bg-accent-100">
              <HiOutlineArrowTrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t('dashboard.quickActions.souscription')}
              </p>
              <p className="text-xs text-gray-500">
                {t('dashboard.quickActions.souscriptionDesc')}
              </p>
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}
