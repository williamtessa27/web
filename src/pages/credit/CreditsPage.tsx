import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HiOutlinePlus, HiOutlineBanknotes, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { creditApi } from '@/core/api';
import type { DossierCredit, PaginatedResponse } from '@/types';
import { StatutDossierCredit } from '@/types/enums';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

type CreditDashboard = {
  nbCreditsActifs: number;
  encoursTotal: number;
  nbEcheancesEnRetard: number;
  impayesTotal: number;
  tauxRemboursement: number;
};

const statutBadge = (statut: StatutDossierCredit) => {
  const map: Record<StatutDossierCredit, { label: string; variant: 'info' | 'success' | 'warning' | 'neutral' | 'danger' }> = {
    [StatutDossierCredit.BROUILLON]: { label: 'Brouillon', variant: 'neutral' },
    [StatutDossierCredit.EN_ATTENTE]: { label: 'En attente', variant: 'info' },
    [StatutDossierCredit.VALIDE]: { label: 'Validé', variant: 'success' },
    [StatutDossierCredit.REJETE]: { label: 'Rejeté', variant: 'danger' },
    [StatutDossierCredit.ACTIF]: { label: 'Actif', variant: 'success' },
    [StatutDossierCredit.CLOTURE]: { label: 'Clôturé', variant: 'neutral' },
  };
  const { label, variant } = map[statut] ?? { label: statut, variant: 'neutral' as const };
  return <Badge variant={variant}>{label}</Badge>;
};

export default function CreditsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<DossierCredit> | null>(null);
  const [dashboard, setDashboard] = useState<CreditDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState<string>('');

  const load = () => {
    setLoading(true);
    Promise.all([
      creditApi.listDossiers({ limit: '50', ...(statutFilter && { statut: statutFilter }) }),
      creditApi.getDashboard(),
    ])
      .then(([d, dash]) => {
        setData(d);
        setDashboard(dash);
      })
      .catch(() => {
        setData(null);
        setDashboard(null);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-sm font-medium">Taux remboursement</span>
            </div>
            <p className="text-2xl font-bold mt-1">{dashboard.tauxRemboursement}%</p>
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
