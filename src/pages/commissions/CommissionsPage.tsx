import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { commissionApi, rapportApi, collecteurApi, zoneApi } from '@/core/api';
import type { CommissionEntreprise, PaginatedResponse } from '@/types';
import type { RapportTotauxCollectes, RapportEcarts } from '@/core/api';
import type { Collecteur } from '@/types';
import type { Zone } from '@/types';
import { StatutCommission } from '@/types';
import { PeriodeCommission } from '@/types/enums';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { exportToExcel } from '@/utils/export.utils';

const defaultDateFin = format(new Date(), 'yyyy-MM-dd');
const defaultDateDebut = format(subDays(new Date(), 30), 'yyyy-MM-dd');

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState<'rapports' | 'ecarts' | 'commissions'>('rapports');

  // ─── Rapports ─────────────────────────────────────
  const [rapportFilters, setRapportFilters] = useState({
    dateDebut: defaultDateDebut,
    dateFin: defaultDateFin,
    collecteurId: '',
    zoneId: '',
  });
  const [rapportData, setRapportData] = useState<RapportTotauxCollectes | null>(null);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  // ─── Rapport écarts (Sprint 9.3) ─────────────────────
  const [ecartsFilters, setEcartsFilters] = useState({
    dateDebut: defaultDateDebut,
    dateFin: defaultDateFin,
    collecteurId: '',
  });
  const [ecartsData, setEcartsData] = useState<RapportEcarts | null>(null);
  const [ecartsLoading, setEcartsLoading] = useState(false);

  // ─── Commissions entreprise ───────────────────────
  const [commissionData, setCommissionData] = useState<PaginatedResponse<CommissionEntreprise> | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(true);
  const [showCalcForm, setShowCalcForm] = useState(false);
  const [calcForm, setCalcForm] = useState({
    periode: PeriodeCommission.MENSUELLE,
    dateDebut: defaultDateDebut,
    dateFin: defaultDateFin,
  });
  const [calcSubmitting, setCalcSubmitting] = useState(false);

  useEffect(() => {
    collecteurApi.list({ limit: 200 }).then((r) => setCollecteurs(r.data || [])).catch(() => {});
    zoneApi.list().then(setZones).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'commissions') {
      setCommissionLoading(true);
      commissionApi
        .list({ limit: 50 })
        .then(setCommissionData)
        .catch(() => {})
        .finally(() => setCommissionLoading(false));
    }
  }, [activeTab]);

  const loadEcarts = () => {
    setEcartsLoading(true);
    rapportApi
      .getEcarts({
        dateDebut: ecartsFilters.dateDebut,
        dateFin: ecartsFilters.dateFin,
        ...(ecartsFilters.collecteurId && { collecteurId: ecartsFilters.collecteurId }),
      })
      .then(setEcartsData)
      .catch(() => setEcartsData(null))
      .finally(() => setEcartsLoading(false));
  };

  const loadRapport = () => {
    setRapportLoading(true);
    rapportApi
      .totauxCollectes({
        dateDebut: rapportFilters.dateDebut,
        dateFin: rapportFilters.dateFin,
        ...(rapportFilters.collecteurId && { collecteurId: rapportFilters.collecteurId }),
        ...(rapportFilters.zoneId && { zoneId: rapportFilters.zoneId }),
      })
      .then(setRapportData)
      .catch(() => setRapportData(null))
      .finally(() => setRapportLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'rapports') loadRapport();
    if (activeTab === 'ecarts') loadEcarts();
  }, [activeTab]);

  const handleCalculerCommission = async () => {
    setCalcSubmitting(true);
    try {
      await commissionApi.calculerEntreprise({
        dateDebut: calcForm.dateDebut,
        dateFin: calcForm.dateFin,
        periode: calcForm.periode,
      });
      setShowCalcForm(false);
      const data = await commissionApi.list({ limit: 50 });
      setCommissionData(data);
    } finally {
      setCalcSubmitting(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    await commissionApi.markPaid(id);
    const data = await commissionApi.list({ limit: 50 });
    setCommissionData(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Commissions</h1>
        <p className="text-gray-500 mt-1">Totaux des collectes et commissions entreprise (taux × montant cotisé, collectes validées)</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('rapports')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'rapports' ? 'bg-white border border-b-0 border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Rapports
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ecarts')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'ecarts' ? 'bg-white border border-b-0 border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Écarts & incidents
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'commissions' ? 'bg-white border border-b-0 border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Commissions
        </button>
      </div>

      {activeTab === 'rapports' && (
        <Card>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Du</span>
              <input
                type="date"
                value={rapportFilters.dateDebut}
                onChange={(e) => setRapportFilters((f) => ({ ...f, dateDebut: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Au</span>
              <input
                type="date"
                value={rapportFilters.dateFin}
                onChange={(e) => setRapportFilters((f) => ({ ...f, dateFin: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <select
              value={rapportFilters.collecteurId}
              onChange={(e) => setRapportFilters((f) => ({ ...f, collecteurId: e.target.value }))}
              className="rounded border border-gray-300 px-3 py-2 text-sm min-w-[180px]"
            >
              <option value="">Tous les collecteurs</option>
              {collecteurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.utilisateur?.nom ?? c.codeCollecteur}
                </option>
              ))}
            </select>
            <select
              value={rapportFilters.zoneId}
              onChange={(e) => setRapportFilters((f) => ({ ...f, zoneId: e.target.value }))}
              className="rounded border border-gray-300 px-3 py-2 text-sm min-w-[160px]"
            >
              <option value="">Toutes les zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.nom}</option>
              ))}
            </select>
            <Button onClick={loadRapport} disabled={rapportLoading}>Actualiser</Button>
            {rapportData && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const rows = [
                      ...rapportData.parCollecteur.map((r) => ({ Type: 'Collecteur', Nom: r.nomCollecteur, 'Nb collectes': r.nombreCollectes, 'Montant (XAF)': Number(r.totalMontant) })),
                      ...rapportData.parZone.map((r) => ({ Type: 'Zone', Nom: r.nomZone, 'Nb collectes': r.nombreCollectes, 'Montant (XAF)': Number(r.totalMontant) })),
                    ];
                    exportToExcel(rows, `rapport-collectes-${rapportFilters.dateDebut}-${rapportFilters.dateFin}`);
                  }}
                >
                  Export Excel
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  Imprimer / PDF
                </Button>
              </>
            )}
          </div>

          {rapportLoading ? (
            <PageLoader />
          ) : !rapportData ? (
            <EmptyState title="Aucune donnée" description="Ajustez les filtres et cliquez sur Actualiser." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Total collectes (validées)</p>
                  <p className="text-2xl font-bold text-gray-900">{rapportData.nombreCollectes}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Montant total</p>
                  <p className="text-2xl font-bold text-gray-900">{Number(rapportData.totalMontant).toLocaleString('fr-FR')} XAF</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Par collecteur</h3>
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Collecteur</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Nb</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rapportData.parCollecteur.map((r) => (
                          <tr key={r.idCollecteur}>
                            <td className="px-4 py-2 font-medium text-gray-900">{r.nomCollecteur}</td>
                            <td className="px-4 py-2 text-right text-gray-600">{r.nombreCollectes}</td>
                            <td className="px-4 py-2 text-right font-medium">{Number(r.totalMontant).toLocaleString('fr-FR')} XAF</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Par zone</h3>
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Zone</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Nb</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rapportData.parZone.map((r) => (
                          <tr key={r.idZone || 'sans-zone'}>
                            <td className="px-4 py-2 font-medium text-gray-900">{r.nomZone}</td>
                            <td className="px-4 py-2 text-right text-gray-600">{r.nombreCollectes}</td>
                            <td className="px-4 py-2 text-right font-medium">{Number(r.totalMontant).toLocaleString('fr-FR')} XAF</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {activeTab === 'ecarts' && (
        <Card>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Du</span>
              <input
                type="date"
                value={ecartsFilters.dateDebut}
                onChange={(e) => setEcartsFilters((f) => ({ ...f, dateDebut: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Au</span>
              <input
                type="date"
                value={ecartsFilters.dateFin}
                onChange={(e) => setEcartsFilters((f) => ({ ...f, dateFin: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <select
              value={ecartsFilters.collecteurId}
              onChange={(e) => setEcartsFilters((f) => ({ ...f, collecteurId: e.target.value }))}
              className="rounded border border-gray-300 px-3 py-2 text-sm min-w-[180px]"
            >
              <option value="">Tous les collecteurs</option>
              {collecteurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.utilisateur?.nom ?? c.codeCollecteur}
                </option>
              ))}
            </select>
            <Button onClick={loadEcarts} disabled={ecartsLoading}>Actualiser</Button>
            {ecartsData && (ecartsData.incidents.length > 0 || ecartsData.ecarts.length > 0) && (
              <Button
                variant="secondary"
                onClick={() => {
                  const rows = [
                    ...ecartsData.incidents.map((i) => ({
                      Type: 'Incident',
                      Date: i.dateCollecte,
                      Client: i.nomClient,
                      Collecteur: i.nomCollecteur,
                      Montant: Number(i.montant),
                      'Type signalement': i.typeSignalement,
                      Note: i.note ?? '',
                    })),
                    ...ecartsData.ecarts.map((e) => ({
                      Type: 'Écart',
                      Date: e.dateCollecte,
                      Client: e.nomClient,
                      Collecteur: e.nomCollecteur,
                      'Montant collecté': Number(e.montant),
                      'Montant attendu': Number(e.montantAttendu),
                      Écart: Number(e.ecart),
                      Note: e.note ?? '',
                    })),
                  ];
                  exportToExcel(rows, `rapport-ecarts-${ecartsFilters.dateDebut}-${ecartsFilters.dateFin}`);
                }}
              >
                Export Excel
              </Button>
            )}
          </div>

          {ecartsLoading ? (
            <PageLoader />
          ) : !ecartsData ? (
            <EmptyState title="Aucune donnée" description="Ajustez les filtres et cliquez sur Actualiser." />
          ) : ecartsData.incidents.length === 0 && ecartsData.ecarts.length === 0 ? (
            <EmptyState
              title="Aucun écart ni incident"
              description="Aucune collecte avec signalement (client absent, refus paiement) ou écart manquant/surplus sur la période."
            />
          ) : (
            <div className="space-y-8">
              {ecartsData.incidents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Incidents ({ecartsData.incidents.length})
                  </h3>
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Client</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Collecteur</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Montant</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ecartsData.incidents.map((i) => (
                          <tr key={i.id}>
                            <td className="px-4 py-2 text-gray-600">{i.dateCollecte}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{i.nomClient}</td>
                            <td className="px-4 py-2 text-gray-600">{i.nomCollecteur}</td>
                            <td className="px-4 py-2 text-right text-gray-600">{Number(i.montant).toLocaleString('fr-FR')}</td>
                            <td className="px-4 py-2">
                              <Badge variant={i.typeSignalement === 'CLIENT_ABSENT' ? 'warning' : i.typeSignalement === 'REFUS_PAIEMENT' ? 'danger' : 'default'}>
                                {i.typeSignalement === 'CLIENT_ABSENT' ? 'Client absent' : i.typeSignalement === 'REFUS_PAIEMENT' ? 'Refus paiement' : i.typeSignalement}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-gray-500 text-xs">{i.note ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {ecartsData.ecarts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Écarts manquant / surplus ({ecartsData.ecarts.length})
                  </h3>
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Client</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Collecteur</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Collecté</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Attendu</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Écart</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ecartsData.ecarts.map((e) => (
                          <tr key={e.id}>
                            <td className="px-4 py-2 text-gray-600">{e.dateCollecte}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{e.nomClient}</td>
                            <td className="px-4 py-2 text-gray-600">{e.nomCollecteur}</td>
                            <td className="px-4 py-2 text-right text-gray-600">{Number(e.montant).toLocaleString('fr-FR')}</td>
                            <td className="px-4 py-2 text-right text-gray-600">{Number(e.montantAttendu).toLocaleString('fr-FR')}</td>
                            <td className={`px-4 py-2 text-right font-medium ${e.ecart > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {e.ecart > 0 ? '+' : ''}{Number(e.ecart).toLocaleString('fr-FR')} XAF
                              <span className="text-xs ml-1">{e.ecart > 0 ? '(manquant)' : '(surplus)'}</span>
                            </td>
                            <td className="px-4 py-2 text-gray-500 text-xs">{e.note ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'commissions' && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" onClick={() => setShowCalcForm(true)}>Calculer commission entreprise</Button>
          </div>

          {showCalcForm && (
            <Card className="border-blue-200 bg-blue-50/30">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Calculer la commission entreprise (taux × montant cotisé sur la période)</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">Période</span>
                  <select
                    value={calcForm.periode}
                    onChange={(e) => setCalcForm((f) => ({ ...f, periode: e.target.value as PeriodeCommission }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value={PeriodeCommission.JOURNALIERE}>Journalière</option>
                    <option value={PeriodeCommission.HEBDOMADAIRE}>Hebdomadaire</option>
                    <option value={PeriodeCommission.MENSUELLE}>Mensuelle</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">Du</span>
                  <input
                    type="date"
                    value={calcForm.dateDebut}
                    onChange={(e) => setCalcForm((f) => ({ ...f, dateDebut: e.target.value }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">Au</span>
                  <input
                    type="date"
                    value={calcForm.dateFin}
                    onChange={(e) => setCalcForm((f) => ({ ...f, dateFin: e.target.value }))}
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex gap-2">
                  <Button onClick={handleCalculerCommission} disabled={calcSubmitting}>
                    {calcSubmitting ? 'Calcul...' : 'Calculer'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCalcForm(false)}>Annuler</Button>
                </div>
              </div>
            </Card>
          )}

          {commissionLoading ? (
            <PageLoader />
          ) : !commissionData?.data?.length ? (
            <Card><EmptyState title="Aucune commission entreprise" description="Utilisez « Calculer commission entreprise » pour une période ; le taux est celui configuré dans Paramètres." /></Card>
          ) : (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Période</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Montant cotisé</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Taux</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Commission</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {commissionData.data.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {format(new Date(c.dateDebut), 'dd/MM', { locale: fr })} — {format(new Date(c.dateFin), 'dd/MM/yy', { locale: fr })}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">{Number(c.montantCotiseTotal).toLocaleString('fr-FR')} XAF</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">{Number(c.tauxApplique)} %</td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">{Number(c.montantCommission).toLocaleString('fr-FR')} XAF</td>
                        <td className="px-6 py-4">
                          <Badge variant={c.statut === StatutCommission.PAYEE ? 'success' : c.statut === StatutCommission.CALCULEE ? 'warning' : 'danger'}>
                            {c.statut === StatutCommission.PAYEE ? 'Payée' : c.statut === StatutCommission.CALCULEE ? 'À payer' : 'Annulée'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {c.statut === StatutCommission.CALCULEE && (
                            <Button variant="secondary" size="sm" onClick={() => handleMarkPaid(c.id)}>Marquer payée</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
