import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineCog6Tooth } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { comptabiliteApi } from '@/core/api';
import type {
  CompteComptable,
  MappingEcritureComptable,
  TypeCompteComptable,
  TypeSourceEcriture,
} from '@/core/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const TYPE_COMPTE_OPTIONS: { value: TypeCompteComptable; label: string }[] = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'PASSIF', label: 'Passif' },
  { value: 'CHARGES', label: 'Charges' },
  { value: 'PRODUITS', label: 'Produits' },
];

const TYPES_SOURCE_WITH_MAPPING: TypeSourceEcriture[] = [
  'COLLECTE',
  'RETRAIT',
  'REMBOURSEMENT_CREDIT',
  'DECAISSEMENT_CREDIT',
  'AVANCE_COLLECTEUR',
  'MOUVEMENT_CAISSE',
];

const TYPE_SOURCE_LABELS: Record<TypeSourceEcriture, string> = {
  COLLECTE: 'Collecte / Dépôt épargne',
  RETRAIT: 'Retrait client',
  REMBOURSEMENT_CREDIT: 'Remboursement crédit',
  DECAISSEMENT_CREDIT: 'Décaissement crédit (octroi)',
  AVANCE_COLLECTEUR: 'Avance collecteur',
  MOUVEMENT_CAISSE: 'Mouvement caisse (agence)',
  COMMISSION: 'Commission',
  AJUSTEMENT: 'Ajustement',
};

export default function PlanComptesPage() {
  const [comptes, setComptes] = useState<CompteComptable[]>([]);
  const [mappings, setMappings] = useState<MappingEcritureComptable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', libelle: '', type: 'ACTIF' as TypeCompteComptable });
  const [editMapping, setEditMapping] = useState<Record<TypeSourceEcriture, { codeDebit: string; codeCredit: string }>>(
    {} as Record<TypeSourceEcriture, { codeDebit: string; codeCredit: string }>,
  );

  const load = () => {
    setLoading(true);
    Promise.all([comptabiliteApi.comptes(), comptabiliteApi.getMappings()])
      .then(([c, m]) => {
        setComptes(c);
        setMappings(m);
        const defaults: Record<string, { codeDebit: string; codeCredit: string }> = {
          COLLECTE: { codeDebit: '57', codeCredit: '411' },
          RETRAIT: { codeDebit: '411', codeCredit: '57' },
          REMBOURSEMENT_CREDIT: { codeDebit: '57', codeCredit: '613' },
          DECAISSEMENT_CREDIT: { codeDebit: '613', codeCredit: '57' },
          AVANCE_COLLECTEUR: { codeDebit: '581', codeCredit: '57' },
          MOUVEMENT_CAISSE: { codeDebit: '57', codeCredit: '67' },
        };
        const next: Record<TypeSourceEcriture, { codeDebit: string; codeCredit: string }> = { ...editMapping } as any;
        m.forEach((row) => {
          next[row.typeSource as TypeSourceEcriture] = {
            codeDebit: row.codeCompteDebit,
            codeCredit: row.codeCompteCredit,
          };
        });
        TYPES_SOURCE_WITH_MAPPING.forEach((t) => {
          if (!next[t]) next[t] = defaults[t] ?? { codeDebit: '', codeCredit: '' };
        });
        setEditMapping(next);
      })
      .catch(() => {
        toast.error('Erreur lors du chargement.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.libelle.trim()) {
      toast.error('Code et libellé requis.');
      return;
    }
    setSaving('compte');
    try {
      await comptabiliteApi.createCompte({
        code: form.code.trim(),
        libelle: form.libelle.trim(),
        type: form.type,
      });
      toast.success('Compte créé.');
      setForm({ code: '', libelle: '', type: 'ACTIF' });
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur lors de la création.');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveMapping = async (typeSource: TypeSourceEcriture) => {
    const row = editMapping[typeSource];
    if (!row?.codeDebit?.trim() || !row?.codeCredit?.trim()) {
      toast.error('Saisissez les deux codes compte.');
      return;
    }
    setSaving(typeSource);
    try {
      await comptabiliteApi.setMapping({
        typeSource,
        codeCompteDebit: row.codeDebit.trim(),
        codeCompteCredit: row.codeCredit.trim(),
      });
      toast.success('Mapping enregistré.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur.');
    } finally {
      setSaving(null);
    }
  };

  if (loading && comptes.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plan de comptes</h1>
        <p className="text-gray-500 mt-1">
          Gérer les comptes comptables et le mapping des écritures automatiques (type d&apos;opération → comptes débit/crédit).
        </p>
      </div>

      {/* Liste des comptes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Comptes</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            <HiOutlinePlus className="h-4 w-4" /> Nouveau compte
          </Button>
        </div>
        {showForm && (
          <form onSubmit={handleCreateCompte} className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="input w-24"
                placeholder="57"
                maxLength={20}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
              <input
                type="text"
                value={form.libelle}
                onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))}
                className="input w-full"
                placeholder="Caisse"
                maxLength={255}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TypeCompteComptable }))}
                className="input"
              >
                {TYPE_COMPTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={saving === 'compte'}>
              {saving === 'compte' ? 'Création…' : 'Créer'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Libellé</th>
                <th className="py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {comptes.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{c.code}</td>
                  <td className="py-2 pr-4 text-gray-700">{c.libelle}</td>
                  <td className="py-2 text-gray-600">{c.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {comptes.length === 0 && !showForm && (
          <p className="text-gray-500 py-4">Aucun compte. Créez les comptes de base (ex. 57 Caisse, 411 Clients, 613 Portefeuille crédit).</p>
        )}
      </Card>

      {/* Mapping des écritures */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineCog6Tooth className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Mapping des écritures automatiques</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Pour chaque type d&apos;opération, indiquez les codes des comptes à débiter et à créditer. Si aucun mapping n&apos;est enregistré, les valeurs par défaut sont utilisées.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">Type d&apos;opération</th>
                <th className="py-2 pr-4">Compte débit (code)</th>
                <th className="py-2 pr-4">Compte crédit (code)</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {TYPES_SOURCE_WITH_MAPPING.map((typeSource) => {
                const row = editMapping[typeSource];
                if (!row) return null;
                return (
                  <tr key={typeSource} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-700">
                      {TYPE_SOURCE_LABELS[typeSource] ?? typeSource}
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={row.codeDebit}
                        onChange={(e) =>
                          setEditMapping((prev) => ({
                            ...prev,
                            [typeSource]: { ...prev[typeSource], codeDebit: e.target.value },
                          }))
                        }
                        className="input py-1 w-28"
                      >
                        <option value="">—</option>
                        {comptes.map((c) => (
                          <option key={c.id} value={c.code}>{c.code} – {c.libelle}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={row.codeCredit}
                        onChange={(e) =>
                          setEditMapping((prev) => ({
                            ...prev,
                            [typeSource]: { ...prev[typeSource], codeCredit: e.target.value },
                          }))
                        }
                        className="input py-1 w-28"
                      >
                        <option value="">—</option>
                        {comptes.map((c) => (
                          <option key={c.id} value={c.code}>{c.code} – {c.libelle}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={saving === typeSource}
                        onClick={() => handleSaveMapping(typeSource)}
                      >
                        {saving === typeSource ? 'Enregistrement…' : 'Enregistrer'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
