import { useEffect, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import { rapportApi, auditApi } from '@/core/api';
import type { HistoriquePerformanceCollecteurDto } from '@/core/api';
import { collecteurApi } from '@/core/api';
import type { Collecteur } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { exportToExcel } from '@/utils/export.utils';

export default function HistoriquePerformanceCollecteurPage() {
  const end = new Date();
  const start = subMonths(end, 11);
  const [dateDebut, setDateDebut] = useState(format(start, 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(end, 'yyyy-MM-dd'));
  const [collecteurId, setCollecteurId] = useState<string>('');
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [data, setData] = useState<HistoriquePerformanceCollecteurDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collecteurApi.list({ limit: '500' }).then((r) => setCollecteurs(r.data ?? [])).catch(() => setCollecteurs([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    rapportApi
      .historiquePerformanceCollecteur({
        dateDebut,
        dateFin,
        ...(collecteurId && { collecteurId }),
      })
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [dateDebut, dateFin, collecteurId]);

  const handleExportExcel = () => {
    auditApi.logExport('historique-performance-collecteur', 'excel').catch(() => {});
    const rows = data.map((d) => ({
      Année: d.annee,
      Mois: d.mois,
      'Nom collecteur': d.nomCollecteur,
      'Nb collectes': d.nombreCollectes,
      'Montant total (XAF)': d.totalMontant,
    }));
    exportToExcel(rows, `historique-performance-collecteur-${dateDebut}-${dateFin}`);
  };

  // Grouper par mois pour affichage
  const byMonth = data.reduce<Record<string, HistoriquePerformanceCollecteurDto[]>>((acc, row) => {
    const key = `${row.annee}-${String(row.mois).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
  const sortedMonths = Object.keys(byMonth).sort();

  if (loading && data.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique performance collecteur</h1>
          <p className="text-gray-500 mt-1">Performance par mois et par collecteur (E7.2.4)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={collecteurId}
            onChange={(e) => setCollecteurId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="">Tous les collecteurs</option>
            {collecteurs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.utilisateur ? [c.utilisateur.prenom, c.utilisateur.nom].filter(Boolean).join(' ') : c.id}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleExportExcel} disabled={data.length === 0}>
            <HiOutlineArrowDownTray className="h-4 w-4" /> Exporter Excel
          </Button>
        </div>
      </div>

      <Card className="p-4">
        {sortedMonths.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune donnée sur la période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Mois</th>
                  <th className="py-2 pr-4 font-medium">Collecteur</th>
                  <th className="py-2 pr-4 font-medium">Nb collectes</th>
                  <th className="py-2 font-medium">Montant (XAF)</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.flatMap((key) =>
                  byMonth[key].map((row) => (
                    <tr key={`${key}-${row.idCollecteur}`} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        {format(new Date(row.annee, row.mois - 1, 1), 'MMMM yyyy', { locale: fr })}
                      </td>
                      <td className="py-2 pr-4">{row.nomCollecteur}</td>
                      <td className="py-2 pr-4">{row.nombreCollectes}</td>
                      <td className="py-2">{Number(row.totalMontant).toLocaleString('fr-FR')}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-3">{data.length} ligne(s)</p>
      </Card>
    </div>
  );
}
