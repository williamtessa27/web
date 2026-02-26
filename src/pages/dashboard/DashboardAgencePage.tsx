import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineExclamationTriangle,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';
import { useAuthStore } from '@/core/store/auth.store';
import { rapportApi } from '@/core/api';
import type { DashboardAgenceDto } from '@/core/api';
import Card from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function DashboardAgencePage() {
  const { user } = useAuthStore();
  const idAgence = user?.idAgence;
  const [data, setData] = useState<DashboardAgenceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!idAgence) {
      setLoading(false);
      return;
    }
    setLoading(true);
    rapportApi
      .dashboardAgence(idAgence, date)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [idAgence, date]);

  if (!idAgence) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard agence</h1>
        <p className="text-gray-500">Vous n&apos;êtes pas rattaché à une agence. Contactez l&apos;administrateur.</p>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard agence</h1>
          <p className="text-gray-500 mt-1">Performance de votre agence</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineBanknotes className="h-5 w-5" />
                <span className="text-sm font-medium">Collectes du jour</span>
              </div>
              <p className="text-2xl font-bold mt-1">{data.collectesJour.nombreCollectes}</p>
              <p className="text-sm text-gray-500">{Number(data.collectesJour.totalMontant).toLocaleString('fr-FR')} XAF</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineBuildingOffice2 className="h-5 w-5" />
                <span className="text-sm font-medium">Encours crédit agence</span>
              </div>
              <p className="text-2xl font-bold mt-1">{Number(data.creditAgence.encoursTotal).toLocaleString('fr-FR')} XAF</p>
              <p className="text-sm text-gray-500">{data.creditAgence.nbCreditsActifs} crédits actifs</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineExclamationTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">PAR30 / PAR60</span>
              </div>
              <p className="text-2xl font-bold mt-1">{data.creditAgence.par30} % / {data.creditAgence.par60} %</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineUserGroup className="h-5 w-5" />
                <span className="text-sm font-medium">Échéances en retard</span>
              </div>
              <p className="text-2xl font-bold mt-1">{data.creditAgence.nbEcheancesEnRetard}</p>
            </Card>
          </div>

          {data.collectesJour.parCollecteur.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance collecteurs du jour</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4">Collecteur</th>
                      <th className="py-2 pr-4">Nb collectes</th>
                      <th className="py-2">Montant (XAF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.collectesJour.parCollecteur.map((r) => (
                      <tr key={r.idCollecteur} className="border-b border-gray-100">
                        <td className="py-2 pr-4">{r.nomCollecteur}</td>
                        <td className="py-2 pr-4">{r.nombreCollectes}</td>
                        <td className="py-2">{Number(r.totalMontant).toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {(data.ecarts.ecarts.length > 0 || data.ecarts.incidents.length > 0) && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Écarts / incidents sur la période</h3>
              <p className="text-sm text-gray-500">
                {data.ecarts.ecarts.length} écart(s), {data.ecarts.incidents.length} incident(s).
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
