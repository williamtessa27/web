import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HiOutlinePlus, HiOutlineBanknotes, HiOutlineExclamationTriangle, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { creditApi, auditApi } from '@/core/api';
import type { CreditDashboardDto, AgingPortefeuilleDto, CreditsParStatutDto } from '@/core/api';
import { exportToExcel } from '@/utils/export.utils';
import type { DossierCredit, PaginatedResponse } from '@/types';
import { StatutDossierCredit } from '@/types/enums';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const statutBadge = (statut: StatutDossierCredit) => {
  const map: Record<StatutDossierCredit, { label: string; variant: 'info' | 'success' | 'warning' | 'neutral' | 'danger' }> = {
    [StatutDossierCredit.BROUILLON]: { label: 'Brouillon', variant: 'neutral' },
    [StatutDossierCredit.EN_ATTENTE]: { label: 'En attente', variant: 'info' },
    [StatutDossierCredit.EN_ATTENTE_VALIDATION_DIRECTION]: { label: 'Validation direction', variant: 'warning' },
    [StatutDossierCredit.VALIDE]: { label: 'Validé', variant: 'success' },
    [StatutDossierCredit.REJETE]: { label: 'Rejeté', variant: 'danger' },
    [StatutDossierCredit.ACTIF]: { label: 'Actif', variant: 'success' },
    [StatutDossierCredit.CLOTURE]: { label: 'Clôturé', variant: 'neutral' },
    [StatutDossierCredit.CONTENTIEUX]: { label: 'Contentieux', variant: 'danger' },
  };
  const { label, variant } = map[statut] ?? { label: statut, variant: 'neutral' as const };
  return <Badge variant={variant}>{label}</Badge>;
};

export default function CreditsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<DossierCredit> | null>(null);
  const [dashboard, setDashboard] = useState<CreditDashboardDto | null>(null);
  const [aging, setAging] = useState<AgingPortefeuilleDto | null>(null);
  const [rapportsStatuts, setRapportsStatuts] = useState<CreditsParStatutDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState<string>('');

  const load = () => {
    setLoading(true);
    Promise.all([
      creditApi.listDossiers({ limit: '50', ...(statutFilter && { statut: statutFilter }) }),
      creditApi.getDashboard(),
      creditApi.getAging(),
      creditApi.rapportStatuts(),
    ])
      .then(([d, dash, ag, statuts]) => {
        setData(d);
        setDashboard(dash);
        setAging(ag);
        setRapportsStatuts(statuts ?? null);
      })
      .catch(() => {
        setData(null);
        setDashboard(null);
        setRapportsStatuts(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statutFilter]);

  if (loading) return <PageLoader />;

  const list = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dossiers crédit</h1>
          <p className="text-gray-500 mt-1">Demandes et crédits octroyés</p>
        </div>
        <Link to={AppRoutes.CREDIT_CREATE}>
          <Button><HiOutlinePlus className="h-4 w-4" /> Nouvelle demande</Button>
        </Link>
      </div>

      {dashboard && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineBanknotes className="h-5 w-5" />
                <span className="text-sm font-medium">Crédits actifs</span>
              </div>
              <p className="text-2xl font-bold mt-1">{dashboard.nbCreditsActifs}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineBanknotes className="h-5 w-5" />
                <span className="text-sm font-medium">Encours total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{Number(dashboard.encoursTotal).toLocaleString('fr-FR')} XAF</p>
            </Card>
            <Card className="p-4">
              <span className="text-sm font-medium text-gray-600">Taux remboursement</span>
              <p className="text-2xl font-bold mt-1">{dashboard.tauxRemboursement}%</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineExclamationTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">PAR30 / PAR60</span>
              </div>
              <p className="text-2xl font-bold mt-1">{dashboard.par30 ?? 0} % / {dashboard.par60 ?? 0} %</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineExclamationTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">Échéances en retard</span>
              </div>
              <p className="text-2xl font-bold mt-1">{dashboard.nbEcheancesEnRetard}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineExclamationTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">Impayés</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-amber-600">{Number(dashboard.impayesTotal).toLocaleString('fr-FR')} XAF</p>
            </Card>
          </div>
          {aging && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">E7.3.1 — Aging du portefeuille (montants en retard)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                <div className="rounded bg-gray-50 p-2">
                  <p className="text-gray-500">0-30 j</p>
                  <p className="font-semibold">{Number(aging.tranche0_30).toLocaleString('fr-FR')} XAF</p>
                </div>
                <div className="rounded bg-amber-50 p-2">
                  <p className="text-gray-500">31-60 j</p>
                  <p className="font-semibold">{Number(aging.tranche31_60).toLocaleString('fr-FR')} XAF</p>
                </div>
                <div className="rounded bg-orange-50 p-2">
                  <p className="text-gray-500">61-90 j</p>
                  <p className="font-semibold">{Number(aging.tranche61_90).toLocaleString('fr-FR')} XAF</p>
                </div>
                <div className="rounded bg-red-50 p-2">
                  <p className="text-gray-500">&gt; 90 j</p>
                  <p className="font-semibold">{Number(aging.tranchePlus90).toLocaleString('fr-FR')} XAF</p>
                </div>
                <div className="rounded bg-primary-50 p-2">
                  <p className="text-gray-500">Encours total</p>
                  <p className="font-semibold">{Number(aging.encoursTotal).toLocaleString('fr-FR')} XAF</p>
                </div>
              </div>
            </Card>
          )}
          {rapportsStatuts && rapportsStatuts.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">E7.2.3 — Rapport crédits par statut</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    auditApi.logExport('rapport-credits-par-statut', 'excel').catch(() => {});
                    exportToExcel(
                      rapportsStatuts.map((r) => ({
                        Statut: r.statut,
                        'Nb dossiers': r.nbDossiers,
                        'Encours total (XAF)': r.encoursTotal,
                        'Montant accordé total (XAF)': r.montantAccordeTotal,
                      })),
                      'rapport-credits-par-statut',
                    );
                  }}
                >
                  <HiOutlineArrowDownTray className="h-4 w-4" /> Exporter Excel
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Statut</th>
                      <th className="py-2 pr-4 font-medium">Nb dossiers</th>
                      <th className="py-2 pr-4 font-medium">Encours (XAF)</th>
                      <th className="py-2 font-medium">Montant accordé (XAF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapportsStatuts.map((r) => (
                      <tr key={r.statut} className="border-b border-gray-100">
                        <td className="py-2 pr-4">{statutBadge(r.statut as StatutDossierCredit)}</td>
                        <td className="py-2 pr-4">{r.nbDossiers}</td>
                        <td className="py-2 pr-4">{Number(r.encoursTotal).toLocaleString('fr-FR')}</td>
                        <td className="py-2">{Number(r.montantAccordeTotal).toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <div className="flex gap-2 flex-wrap">
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          {Object.values(StatutDossierCredit).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {!list.length ? (
        <Card>
          <EmptyState
            title="Aucun dossier crédit"
            description="Créez une demande de crédit pour un client."
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(AppRoutes.CREDIT_DETAIL.replace(':id', d.id))}
                  >
                    <td className="py-3 font-medium">{d.codeDossier}</td>
                    <td className="py-3">
                      {d.client ? [d.client.nom, d.client.prenom].filter(Boolean).join(' ') : d.idClient}
                    </td>
                    <td className="py-3">{Number(d.montantDemande).toLocaleString('fr-FR')} XAF</td>
                    <td className="py-3">{format(new Date(d.dateDemande), 'dd MMM yyyy', { locale: fr })}</td>
                    <td className="py-3">{statutBadge(d.statut)}</td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(AppRoutes.CREDIT_DETAIL.replace(':id', d.id));
                        }}
                      >
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-3">{total} dossier(s)</p>
        </Card>
      )}
    </div>
  );
}
