import { useEffect, useState } from 'react';
import { HiOutlineArrowPath, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { rapportApi, auditApi, type EncoursEpargneDto } from '@/core/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { exportToExcel, exportToPdf } from '@/utils/export.utils';

function formatXaf(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' XAF';
}

export default function EncoursEpargnePage() {
  const [data, setData] = useState<EncoursEpargneDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    rapportApi
      .encoursEpargne()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleExportExcel = () => {
    if (!data) return;
    auditApi.logExport('encours-epargne', 'excel').catch(() => {});
    const rows = [
      ...data.parProduit.map((r) => ({ Type: 'Produit', Nom: r.nomProduit, 'Encours (XAF)': r.encours, 'Nb souscriptions': r.nbSouscriptions })),
      ...data.parAgence.map((r) => ({ Type: 'Agence', Nom: r.nomAgence, 'Encours (XAF)': r.encours, 'Nb souscriptions': r.nbSouscriptions })),
    ];
    exportToExcel(rows, `encours-epargne-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportPdf = () => {
    if (!data) return;
    auditApi.logExport('encours-epargne', 'pdf').catch(() => {});
    const rows: { label: string; value: string }[] = [
      { label: 'Encours total', value: formatXaf(data.encoursTotal) },
      { label: 'Nombre de souscriptions', value: String(data.nbSouscriptionsTotal) },
      ...data.parProduit.flatMap((r) => [
        { label: `Produit: ${r.nomProduit}`, value: `${formatXaf(r.encours)} (${r.nbSouscriptions} souscr.)` },
      ]),
      ...data.parAgence.flatMap((r) => [
        { label: `Agence: ${r.nomAgence}`, value: `${formatXaf(r.encours)} (${r.nbSouscriptions} souscr.)` },
      ]),
    ];
    exportToPdf('Rapport encours épargne', rows, `encours-epargne-${new Date().toISOString().slice(0, 10)}`);
  };

  if (loading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Encours épargne</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading} leftIcon={<HiOutlineArrowPath className="h-4 w-4" />}>
            Actualiser
          </Button>
          {data && (
            <>
              <Button variant="outline" onClick={handleExportExcel} leftIcon={<HiOutlineArrowDownTray className="h-4 w-4" />}>
                Excel
              </Button>
              <Button variant="outline" onClick={handleExportPdf} leftIcon={<HiOutlineArrowDownTray className="h-4 w-4" />}>
                PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {!data ? (
        <EmptyState
          title="Aucune donnée"
          description="Impossible de charger l'encours épargne. Réessayez plus tard."
          action={<Button onClick={load}>Réessayer</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm font-medium text-gray-500">Encours total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatXaf(data.encoursTotal)}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-gray-500">Nombre de souscriptions actives</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{data.nbSouscriptionsTotal}</p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Par produit</h2>
            {data.parProduit.length === 0 ? (
              <p className="text-gray-500">Aucun encours par produit.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Produit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Encours (XAF)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Nb souscriptions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.parProduit.map((r) => (
                      <tr key={r.idProduit}>
                        <td className="px-4 py-2 text-sm text-gray-900">{r.nomProduit}</td>
                        <td className="px-4 py-2 text-right text-sm tabular-nums text-gray-900">{formatXaf(r.encours)}</td>
                        <td className="px-4 py-2 text-right text-sm tabular-nums text-gray-600">{r.nbSouscriptions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Par agence</h2>
            {data.parAgence.length === 0 ? (
              <p className="text-gray-500">Aucun encours par agence.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Agence</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Encours (XAF)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Nb souscriptions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.parAgence.map((r) => (
                      <tr key={r.idAgence ?? 'sans-agence'}>
                        <td className="px-4 py-2 text-sm text-gray-900">{r.nomAgence}</td>
                        <td className="px-4 py-2 text-right text-sm tabular-nums text-gray-900">{formatXaf(r.encours)}</td>
                        <td className="px-4 py-2 text-right text-sm tabular-nums text-gray-600">{r.nbSouscriptions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
