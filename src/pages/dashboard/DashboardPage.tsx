import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineArrowTrendingUp,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineCreditCard,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/core/store/auth.store';
import { collecteApi, clientApi, collecteurApi, rapportApi } from '@/core/api';
import type {
  DashboardDGDto,
  CollectesParJourPoint,
  NouveauxClientsParMoisPoint,
  EncoursEpargneDto,
} from '@/core/api';
import { PageLoader } from '@/components/ui/LoadingSpinner';

function formatXAF(n: number): string {
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} XAF`;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [dashboardDG, setDashboardDG] = useState<DashboardDGDto | null>(null);
  const [encoursEpargne, setEncoursEpargne] = useState<EncoursEpargneDto | null>(null);
  const [collectesParJour, setCollectesParJour] = useState<CollectesParJourPoint[]>([]);
  const [nouveauxClientsParMois, setNouveauxClientsParMois] = useState<NouveauxClientsParMoisPoint[]>([]);
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
      setAccessError(null);
      const today = format(new Date(), 'yyyy-MM-dd');
      const dateDebut30 = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const [
        dgResult,
        collectesToday,
        clients,
        collecteurs,
        rapport30,
        collectesSerie,
        clientsSerie,
        encoursResult,
      ] = await Promise.allSettled([
        rapportApi.dashboardDG(),
        collecteApi.list({ limit: 500, date: today }),
        clientApi.list({ limit: 1 }),
        collecteurApi.list({ limit: 1 }),
        rapportApi.totauxCollectes({ dateDebut: dateDebut30, dateFin: today }),
        rapportApi.collectesParJour({ dateDebut: dateDebut30, dateFin: today }),
        rapportApi.nouveauxClientsParMois({ nbMois: 12 }),
        rapportApi.encoursEpargne(),
      ]);

      const failedRequests = [
        dgResult,
        collectesToday,
        clients,
        collecteurs,
        rapport30,
        collectesSerie,
        clientsSerie,
        encoursResult,
      ].filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      const forbidden = failedRequests.find((r) => r.reason?.statusCode === 403);
      if (forbidden) {
        setAccessError(
          forbidden.reason?.message ||
            "Accès refusé : votre rôle ou vos permissions ne permettent pas d'afficher certaines données du tableau de bord.",
        );
      }

      if (dgResult.status === 'fulfilled' && dgResult.value) setDashboardDG(dgResult.value);
      if (encoursResult.status === 'fulfilled' && encoursResult.value) setEncoursEpargne(encoursResult.value);
      if (collectesSerie.status === 'fulfilled') setCollectesParJour(collectesSerie.value ?? []);
      if (clientsSerie.status === 'fulfilled') setNouveauxClientsParMois(clientsSerie.value ?? []);

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
    } catch (err: any) {
      setAccessError(err?.message || 'Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = [user?.nom, user?.prenom].filter(Boolean).join(' ') || user?.nom || '';

  if (loading) return <PageLoader />;

  const chartCollectes = collectesParJour.map((p) => ({
    ...p,
    label: format(new Date(p.date), 'dd MMM', { locale: fr }),
    montant: Number(p.totalMontant),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.greeting', { name: displayName })}
        </h1>
        <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {accessError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Accès limité au tableau de bord</p>
              <p className="text-sm mt-1">{accessError}</p>
              {user?.role && (
                <p className="text-xs mt-2 text-amber-800">
                  Rôle connecté : {user.role}. Certaines données peuvent rester vides tant que les permissions ne sont pas ajustées.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={t('dashboard.stats.collectesDuJour')}
          value={stats.totalCollectes}
          icon={<HiOutlineBanknotes className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={t('dashboard.stats.montantDuJour')}
          value={formatXAF(stats.montantJour)}
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
          value={formatXAF(stats.montant30Jours)}
          icon={<HiOutlineCalendarDays className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Rubrique Collectes — évolution dans le temps */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <HiOutlineBanknotes className="h-5 w-5 text-primary-600" />
          Collectes — Évolution sur 30 jours
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Montant des collectes validées par jour.
        </p>
        {chartCollectes.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartCollectes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#611F69" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#611F69" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#6b7280" />
                <YAxis
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value: number) => [formatXAF(value), 'Montant']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date && format(new Date(payload[0].payload.date), 'dd MMMM yyyy', { locale: fr })}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="montant"
                  name="Montant"
                  stroke="#611F69"
                  strokeWidth={2}
                  fill="url(#colorMontant)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Aucune donnée sur la période.
          </div>
        )}
      </Card>

      {/* Rubrique Épargne & Crédit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Épargne */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <HiOutlineChartBar className="h-5 w-5 text-purple-600" />
            Épargne
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Encours épargne et répartition par produit.
          </p>
          {dashboardDG != null && (
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">
                {formatXAF(dashboardDG.encoursEpargne ?? 0)}
              </p>
              <p className="text-sm text-gray-500">
                {encoursEpargne?.nbSouscriptionsTotal ?? 0} souscription(s) en cours
              </p>
            </div>
          )}
          {encoursEpargne && encoursEpargne.parProduit.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={encoursEpargne.parProduit.slice(0, 6).map((p) => ({
                    nom: p.nomProduit.length > 15 ? p.nomProduit.slice(0, 15) + '…' : p.nomProduit,
                    encours: Number(p.encours),
                    fullName: p.nomProduit,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="nom" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number) => formatXAF(value)}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Bar dataKey="encours" name="Encours" fill="#611F69" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun encours par produit.</p>
          )}
        </Card>

        {/* Crédit */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <HiOutlineCreditCard className="h-5 w-5 text-blue-600" />
            Crédit
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Encours, taux de remboursement et indicateurs de risque (PAR).
          </p>
          {dashboardDG?.creditDashboard != null ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Encours crédit"
                value={formatXAF(dashboardDG.creditDashboard.encoursTotal ?? 0)}
                color="blue"
              />
              <StatCard
                title="Taux remboursement"
                value={`${dashboardDG.creditDashboard.tauxRemboursement ?? 0} %`}
                color="green"
              />
              <StatCard
                title="PAR 30"
                value={`${dashboardDG.creditDashboard.par30 ?? 0} %`}
                color="orange"
              />
              <StatCard
                title="PAR 60"
                value={`${dashboardDG.creditDashboard.par60 ?? 0} %`}
                color="orange"
              />
              <div className="col-span-2 text-sm text-gray-500">
                {dashboardDG.creditDashboard.nbCreditsActifs ?? 0} crédit(s) actif(s)
                {dashboardDG.creditDashboard.nbEcheancesEnRetard != null && dashboardDG.creditDashboard.nbEcheancesEnRetard > 0 && (
                  <> · {dashboardDG.creditDashboard.nbEcheancesEnRetard} échéance(s) en retard</>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune donnée crédit.</p>
          )}
        </Card>
      </div>

      {/* Rubrique Clients — nouveaux clients par mois */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <HiOutlineUsers className="h-5 w-5 text-purple-600" />
          Clients — Nouveaux inscrits par mois
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Évolution du nombre de nouveaux clients sur les 12 derniers mois.
        </p>
        {nouveauxClientsParMois.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nouveauxClientsParMois} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="moisLabel" tick={{ fontSize: 10 }} stroke="#6b7280" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number) => [value, 'Nouveaux clients']}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Bar dataKey="nombre" name="Nouveaux clients" fill="#611F69" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Aucune donnée sur la période.
          </div>
        )}
      </Card>

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
