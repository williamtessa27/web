import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { HiOutlineDocumentText, HiOutlineScale, HiOutlineArrowsRightLeft, HiOutlineChartBar, HiOutlineBanknotes } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { comptabiliteApi, agenceApi, clotureApi } from '@/core/api';
import type { JournalEntry, BalanceEntry, CompteDeResultatDto, BilanDto } from '@/core/api';
import type { Agence } from '@/types';
import type { RapprochementLigne } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { exportToExcel } from '@/utils/export.utils';

const defaultDateFin = format(new Date(), 'yyyy-MM-dd');
const defaultDateDebut = format(subDays(new Date(), 30), 'yyyy-MM-dd');

export default function ComptabilitePage() {
  const [activeTab, setActiveTab] = useState<'journal' | 'balance' | 'compte-resultat' | 'bilan' | 'rapprochement'>('journal');
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [balance, setBalance] = useState<BalanceEntry[]>([]);
  const [compteResultat, setCompteResultat] = useState<CompteDeResultatDto | null>(null);
  const [bilanData, setBilanData] = useState<BilanDto | null>(null);
  const [rapprochementData, setRapprochementData] = useState<{ date: string; lignes: RapprochementLigne[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateDebut, setDateDebut] = useState(defaultDateDebut);
  const [dateFin, setDateFin] = useState(defaultDateFin);
  const [dateBalance, setDateBalance] = useState(defaultDateFin);
  const [dateRapprochement, setDateRapprochement] = useState(defaultDateFin);
  const [idAgence, setIdAgence] = useState<string>('');
  const [agences, setAgences] = useState<Agence[]>([]);
  const [depotSavingId, setDepotSavingId] = useState<string | null>(null);
  const [depotInputs, setDepotInputs] = useState<Record<string, string>>({});

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
    } else if (activeTab === 'compte-resultat') {
      setLoading(true);
      comptabiliteApi
        .compteResultat({ dateDebut, dateFin, ...(idAgence && { idAgence }) })
        .then(setCompteResultat)
        .catch(() => setCompteResultat(null))
        .finally(() => setLoading(false));
    } else if (activeTab === 'bilan') {
      setLoading(true);
      comptabiliteApi
        .bilan({ date: dateBalance, ...(idAgence && { idAgence }) })
        .then(setBilanData)
        .catch(() => setBilanData(null))
        .finally(() => setLoading(false));
    } else if (activeTab === 'rapprochement') {
      setLoading(true);
      clotureApi
        .rapprochement(dateRapprochement)
        .then((res) => {
          setRapprochementData(res);
          const initial: Record<string, string> = {};
          res.lignes.forEach((l) => {
            initial[l.idCollecteur] = l.montantDepose != null ? String(l.montantDepose) : '';
          });
          setDepotInputs(initial);
        })
        .catch(() => setRapprochementData(null))
        .finally(() => setLoading(false));
    }
  }, [activeTab, dateDebut, dateFin, dateBalance, dateRapprochement, idAgence]);

  const handleSaveDepot = async (idCollecteur: string, montantDepose: number, idAgence?: string) => {
    setDepotSavingId(idCollecteur);
    try {
      await clotureApi.depotCaisse({
        dateDepot: dateRapprochement,
        idCollecteur,
        montantDepose,
        ...(idAgence && { idAgence }),
      });
      toast.success('Montant déposé enregistré.');
      const res = await clotureApi.rapprochement(dateRapprochement);
      setRapprochementData(res);
      setDepotInputs((prev) => ({ ...prev, [idCollecteur]: String(montantDepose) }));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'Erreur lors de l\'enregistrement');
    } finally {
      setDepotSavingId(null);
    }
  };

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
          onClick={() => setActiveTab('compte-resultat')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'compte-resultat' ? 'bg-white border border-b-0 border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiOutlineChartBar className="h-4 w-4" /> Compte de résultat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bilan')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'bilan' ? 'bg-white border border-b-0 border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiOutlineBanknotes className="h-4 w-4" /> Bilan
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
          {(activeTab === 'journal' || activeTab === 'compte-resultat') ? (
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
          ) : (activeTab === 'balance' || activeTab === 'bilan') ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Date</span>
              <input
                type="date"
                value={dateBalance}
                onChange={(e) => setDateBalance(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          ) : null}
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
          {activeTab === 'compte-resultat' && compteResultat && (
            <Button
              variant="secondary"
              onClick={() => exportToExcel(
                [
                  ...compteResultat.lignesCharges.map((l) => ({ Type: 'Charge', Code: l.code, Libellé: l.libelle, Montant: l.solde })),
                  ...compteResultat.lignesProduits.map((l) => ({ Type: 'Produit', Code: l.code, Libellé: l.libelle, Montant: l.solde })),
                  { Type: '', Code: '', Libellé: 'TOTAL CHARGES', Montant: compteResultat.totalCharges },
                  { Type: '', Code: '', Libellé: 'TOTAL PRODUITS', Montant: compteResultat.totalProduits },
                  { Type: '', Code: '', Libellé: 'RÉSULTAT', Montant: compteResultat.resultat },
                ],
                `compte-resultat-${dateDebut}-${dateFin}`,
              )}
            >
              Export Excel
            </Button>
          )}
          {activeTab === 'bilan' && bilanData && (
            <Button
              variant="secondary"
              onClick={() => exportToExcel(
                [
                  ...bilanData.lignesActif.map((l) => ({ Section: 'Actif', Code: l.code, Libellé: l.libelle, Solde: l.solde })),
                  ...bilanData.lignesPassif.map((l) => ({ Section: 'Passif', Code: l.code, Libellé: l.libelle, Solde: l.solde })),
                  { Section: 'Actif', Code: '', Libellé: 'TOTAL ACTIF', Solde: bilanData.totalActif },
                  { Section: 'Passif', Code: '', Libellé: 'TOTAL PASSIF', Solde: bilanData.totalPassif },
                ],
                `bilan-${bilanData.date}`,
              )}
            >
              Export Excel
            </Button>
          )}
        </div>

        {activeTab === 'rapprochement' && (
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Date</span>
              <input
                type="date"
                value={dateRapprochement}
                onChange={(e) => setDateRapprochement(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : activeTab === 'rapprochement' ? (
          <div className="overflow-x-auto">
            <p className="text-sm text-gray-600 mb-4">
              Rapprochement collecte terrain vs caisse agence : montant collecté par collecteur vs montant déposé. Saisissez le montant déposé et enregistrez.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Collecteur</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Nb collectes</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Montant terrain</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Montant déposé</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Écart</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!rapprochementData?.lignes?.length ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune collecte pour cette date</td></tr>
                ) : (
                  rapprochementData.lignes.map((l) => {
                    const val = depotInputs[l.idCollecteur] ?? (l.montantDepose != null ? String(l.montantDepose) : '');
                    const num = Number.parseFloat(val) || 0;
                    const ecart = l.montantTerrain - num;
                    return (
                      <tr key={l.idCollecteur}>
                        <td className="px-4 py-2 font-medium text-gray-900">{l.nomCollecteur}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{l.nombreCollectes}</td>
                        <td className="px-4 py-2 text-right font-medium">{Number(l.montantTerrain).toLocaleString('fr-FR')} XAF</td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={val}
                            onChange={(e) => setDepotInputs((prev) => ({ ...prev, [l.idCollecteur]: e.target.value }))}
                            className="w-28 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                          />
                        </td>
                        <td className={`px-4 py-2 text-right font-medium ${ecart !== 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                          {ecart !== 0 ? `${ecart > 0 ? '+' : ''}${ecart.toLocaleString('fr-FR')} XAF` : '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={depotSavingId === l.idCollecteur}
                            onClick={() => handleSaveDepot(l.idCollecteur, num, idAgence || undefined)}
                          >
                            {depotSavingId === l.idCollecteur ? '…' : 'Enregistrer'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
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
        ) : activeTab === 'compte-resultat' ? (
          <div className="space-y-6">
            {compteResultat ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-red-50 p-4">
                    <p className="text-sm text-gray-600">Total charges</p>
                    <p className="text-xl font-semibold text-red-700">{compteResultat.totalCharges.toLocaleString('fr-FR')} XAF</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm text-gray-600">Total produits</p>
                    <p className="text-xl font-semibold text-green-700">{compteResultat.totalProduits.toLocaleString('fr-FR')} XAF</p>
                  </div>
                  <div className="rounded-lg bg-primary-50 p-4">
                    <p className="text-sm text-gray-600">Résultat</p>
                    <p className={`text-xl font-semibold ${compteResultat.resultat >= 0 ? 'text-primary-700' : 'text-red-700'}`}>
                      {compteResultat.resultat.toLocaleString('fr-FR')} XAF
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Charges</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500"><th className="text-left py-1">Code</th><th className="text-left py-1">Libellé</th><th className="text-right py-1">Montant</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {compteResultat.lignesCharges.length === 0 ? (
                          <tr><td colSpan={3} className="py-2 text-gray-500">Aucune charge</td></tr>
                        ) : (
                          compteResultat.lignesCharges.map((l) => (
                            <tr key={l.code}><td className="py-1 font-mono">{l.code}</td><td className="py-1">{l.libelle}</td><td className="py-1 text-right">{l.solde.toLocaleString('fr-FR')} XAF</td></tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Produits</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500"><th className="text-left py-1">Code</th><th className="text-left py-1">Libellé</th><th className="text-right py-1">Montant</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {compteResultat.lignesProduits.length === 0 ? (
                          <tr><td colSpan={3} className="py-2 text-gray-500">Aucun produit</td></tr>
                        ) : (
                          compteResultat.lignesProduits.map((l) => (
                            <tr key={l.code}><td className="py-1 font-mono">{l.code}</td><td className="py-1">{l.libelle}</td><td className="py-1 text-right">{l.solde.toLocaleString('fr-FR')} XAF</td></tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Aucune donnée pour la période sélectionnée.</p>
            )}
          </div>
        ) : activeTab === 'bilan' ? (
          <div className="space-y-6">
            {bilanData ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-gray-600">Total actif</p>
                    <p className="text-xl font-semibold text-blue-700">{bilanData.totalActif.toLocaleString('fr-FR')} XAF</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4">
                    <p className="text-sm text-gray-600">Total passif</p>
                    <p className="text-xl font-semibold text-amber-700">{bilanData.totalPassif.toLocaleString('fr-FR')} XAF</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Actif</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500"><th className="text-left py-1">Code</th><th className="text-left py-1">Libellé</th><th className="text-right py-1">Solde</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bilanData.lignesActif.length === 0 ? (
                          <tr><td colSpan={3} className="py-2 text-gray-500">Aucun compte actif</td></tr>
                        ) : (
                          bilanData.lignesActif.map((l) => (
                            <tr key={l.code}><td className="py-1 font-mono">{l.code}</td><td className="py-1">{l.libelle}</td><td className="py-1 text-right">{l.solde.toLocaleString('fr-FR')} XAF</td></tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Passif</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500"><th className="text-left py-1">Code</th><th className="text-left py-1">Libellé</th><th className="text-right py-1">Solde</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bilanData.lignesPassif.length === 0 ? (
                          <tr><td colSpan={3} className="py-2 text-gray-500">Aucun compte passif</td></tr>
                        ) : (
                          bilanData.lignesPassif.map((l) => (
                            <tr key={l.code}><td className="py-1 font-mono">{l.code}</td><td className="py-1">{l.libelle}</td><td className="py-1 text-right">{l.solde.toLocaleString('fr-FR')} XAF</td></tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Aucune donnée à cette date.</p>
            )}
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
