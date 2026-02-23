import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { HiOutlineDocumentText, HiOutlineScale, HiOutlineArrowsRightLeft } from 'react-icons/hi2';
import { comptabiliteApi, agenceApi, rapportApi } from '@/core/api';
import type { JournalEntry, BalanceEntry } from '@/core/api';
import type { Agence } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { exportToExcel } from '@/utils/export.utils';

const defaultDateFin = format(new Date(), 'yyyy-MM-dd');
const defaultDateDebut = format(subDays(new Date(), 30), 'yyyy-MM-dd');

export default function ComptabilitePage() {
  const [activeTab, setActiveTab] = useState<'journal' | 'balance' | 'rapprochement'>('journal');
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [balance, setBalance] = useState<BalanceEntry[]>([]);
  const [rapprochement, setRapprochement] = useState<{ nomCollecteur: string; totalMontant: number; nombreCollectes: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateDebut, setDateDebut] = useState(defaultDateDebut);
  const [dateFin, setDateFin] = useState(defaultDateFin);
  const [dateBalance, setDateBalance] = useState(defaultDateFin);
  const [idAgence, setIdAgence] = useState<string>('');
  const [agences, setAgences] = useState<Agence[]>([]);

  useEffect(() => {
    agenceApi.list(true).then(setAgences).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'journal') {
      setLoading(true);
      comptabiliteApi
        .journal({ dateDebut, dateFin, ...(idAgence && { idAgence }) })
        .then(setJournal)
        .catch(() => setJournal([]))
        .finally(() => setLoading(false));
    } else if (activeTab === 'balance') {
      setLoading(true);
      comptabiliteApi
        .balance({ date: dateBalance, ...(idAgence && { idAgence }) })
        .then(setBalance)
        .catch(() => setBalance([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      rapportApi
        .totauxCollectes({ dateDebut, dateFin })
        .then((r) => setRapprochement(r.parCollecteur ?? []))
        .catch(() => setRapprochement([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab, dateDebut, dateFin, dateBalance, idAgence]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
        <p className="text-gray-500 mt-1">Journal des écritures et balance des comptes</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'journal' ? 'bg-white border border-b-0 border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiOutlineDocumentText className="h-4 w-4" /> Journal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'balance' ? 'bg-white border border-b-0 border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiOutlineScale className="h-4 w-4" /> Balance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rapprochement')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'rapprochement' ? 'bg-white border border-b-0 border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiOutlineArrowsRightLeft className="h-4 w-4" /> Rapprochement
        </button>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          {activeTab === 'journal' ? (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Du</span>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Au</span>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            </>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Date</span>
              <input
                type="date"
                value={dateBalance}
                onChange={(e) => setDateBalance(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          )}
          <select
            value={idAgence}
            onChange={(e) => setIdAgence(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="">Toutes les agences</option>
            {agences.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
          {activeTab === 'journal' && journal.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => exportToExcel(
                journal.map((j) => ({ Date: j.dateEcriture, Libellé: j.libelle, Débit: j.compteDebitCode, Crédit: j.compteCreditCode, Montant: j.montant, Type: j.typeSource })),
                `journal-${dateDebut}-${dateFin}`,
              )}
            >
              Export Excel
            </Button>
          )}
          {activeTab === 'balance' && balance.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => exportToExcel(
                balance.map((b) => ({ Code: b.code, Libellé: b.libelle, Type: b.type, Débit: b.debit, Crédit: b.credit, Solde: b.solde })),
                `balance-${dateBalance}`,
              )}
            >
              Export Excel
            </Button>
          )}
        </div>

        {activeTab === 'rapprochement' && (
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Du</span>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Au</span>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" />
            </label>
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : activeTab === 'rapprochement' ? (
          <div className="overflow-x-auto">
            <p className="text-sm text-gray-600 mb-4">Montant total collecté par collecteur (à rapprocher avec les versements en caisse agence).</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Collecteur</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Nb collectes</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Montant à verser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rapprochement.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucune donnée sur la période</td></tr>
                ) : (
                  rapprochement.map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-medium text-gray-900">{r.nomCollecteur}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{r.nombreCollectes}</td>
                      <td className="px-4 py-2 text-right font-medium">{Number(r.totalMontant).toLocaleString('fr-FR')} XAF</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'journal' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Libellé</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Compte débit</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Compte crédit</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Montant</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {journal.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune écriture sur la période</td></tr>
                ) : (
                  journal.map((j) => (
                    <tr key={j.id}>
                      <td className="px-4 py-2 text-gray-900">{j.dateEcriture}</td>
                      <td className="px-4 py-2 text-gray-900">{j.libelle}</td>
                      <td className="px-4 py-2 text-gray-600">{j.compteDebitCode}</td>
                      <td className="px-4 py-2 text-gray-600">{j.compteCreditCode}</td>
                      <td className="px-4 py-2 text-right font-medium">{Number(j.montant).toLocaleString('fr-FR')} XAF</td>
                      <td className="px-4 py-2 text-gray-500">{j.typeSource}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Code</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Libellé</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Débit</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Crédit</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {balance.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun mouvement à cette date</td></tr>
                ) : (
                  balance.map((b) => (
                    <tr key={b.idCompte}>
                      <td className="px-4 py-2 font-mono text-gray-900">{b.code}</td>
                      <td className="px-4 py-2 text-gray-900">{b.libelle}</td>
                      <td className="px-4 py-2 text-gray-500">{b.type}</td>
                      <td className="px-4 py-2 text-right">{Number(b.debit).toLocaleString('fr-FR')} XAF</td>
                      <td className="px-4 py-2 text-right">{Number(b.credit).toLocaleString('fr-FR')} XAF</td>
                      <td className="px-4 py-2 text-right font-medium">{Number(b.solde).toLocaleString('fr-FR')} XAF</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
