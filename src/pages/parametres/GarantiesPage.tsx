import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineShieldCheck, HiOutlineDocumentText } from 'react-icons/hi2';
import { typeGarantieApi, typeAssuranceApi } from '@/core/api';
import type { TypeGarantie, TypeAssurance } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function GarantiesPage() {
  const [typesGarantie, setTypesGarantie] = useState<TypeGarantie[]>([]);
  const [typesAssurance, setTypesAssurance] = useState<TypeAssurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'tg' | 'ta' | null>(null);
  const [editingTg, setEditingTg] = useState<TypeGarantie | null>(null);
  const [editingTa, setEditingTa] = useState<TypeAssurance | null>(null);
  const [formTg, setFormTg] = useState({ code: '', libelle: '', valeurMin: '' as string | number, valeurMax: '' as string | number, ratioCouvertureMin: '0', dureeValiditeMois: '0', actif: true });
  const [formTa, setFormTa] = useState({ code: '', libelle: '', actif: true });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      typeGarantieApi.list(false),
      typeAssuranceApi.list(false),
    ])
      .then(([tg, ta]) => {
        setTypesGarantie(tg);
        setTypesAssurance(ta);
      })
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateTg = () => {
    setEditingTg(null);
    setFormTg({ code: '', libelle: '', valeurMin: '', valeurMax: '', ratioCouvertureMin: '0', dureeValiditeMois: '0', actif: true });
    setModalType('tg');
  };

  const openEditTg = (t: TypeGarantie) => {
    setEditingTg(t);
    setFormTg({
      code: t.code,
      libelle: t.libelle,
      valeurMin: t.valeurMin ?? '',
      valeurMax: t.valeurMax ?? '',
      ratioCouvertureMin: String(t.ratioCouvertureMin ?? 0),
      dureeValiditeMois: String(t.dureeValiditeMois ?? 0),
      actif: t.actif,
    });
    setModalType('tg');
  };

  const saveTypeGarantie = async () => {
    setSubmitting(true);
    try {
      const payload = {
        code: formTg.code,
        libelle: formTg.libelle,
        valeurMin: formTg.valeurMin === '' ? undefined : Number(formTg.valeurMin),
        valeurMax: formTg.valeurMax === '' ? undefined : Number(formTg.valeurMax),
        ratioCouvertureMin: Number(formTg.ratioCouvertureMin) || 0,
        dureeValiditeMois: Number(formTg.dureeValiditeMois) || 0,
        actif: formTg.actif,
      };
      if (editingTg) {
        await typeGarantieApi.update(editingTg.id, payload);
        toast.success('Type de garantie mis à jour.');
      } else {
        await typeGarantieApi.create(payload);
        toast.success('Type de garantie créé.');
      }
      setModalType(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateTa = () => {
    setEditingTa(null);
    setFormTa({ code: '', libelle: '', actif: true });
    setModalType('ta');
  };

  const openEditTa = (t: TypeAssurance) => {
    setEditingTa(t);
    setFormTa({ code: t.code, libelle: t.libelle, actif: t.actif });
    setModalType('ta');
  };

  const saveTypeAssurance = async () => {
    setSubmitting(true);
    try {
      const payload = { code: formTa.code, libelle: formTa.libelle, actif: formTa.actif };
      if (editingTa) {
        await typeAssuranceApi.update(editingTa.id, payload);
        toast.success('Type d\'assurance mis à jour.');
      } else {
        await typeAssuranceApi.create(payload);
        toast.success('Type d\'assurance créé.');
      }
      setModalType(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Garanties & Assurances</h1>
        <p className="text-gray-500 mt-1">Paramétrage des types de garanties et d&apos;assurances (Sprint 10)</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiOutlineShieldCheck className="h-5 w-5" />
            Types de garanties
          </h2>
          <Button size="sm" onClick={openCreateTg}><HiOutlinePlus className="h-4 w-4" /> Ajouter</Button>
        </div>
        {!typesGarantie.length ? (
          <p className="text-gray-500 text-sm">Aucun type. Ajoutez des types (ex. Immobilière, Véhicule, Dépôt).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 font-medium">Libellé</th>
                  <th className="pb-2 font-medium">Ratio min.</th>
                  <th className="pb-2 font-medium">Durée validité</th>
                  <th className="pb-2 font-medium">Actif</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {typesGarantie.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="py-2 font-mono">{t.code}</td>
                    <td className="py-2">{t.libelle}</td>
                    <td className="py-2">{Number(t.ratioCouvertureMin)} %</td>
                    <td className="py-2">{t.dureeValiditeMois ? `${t.dureeValiditeMois} mois` : '—'}</td>
                    <td className="py-2">{t.actif ? 'Oui' : 'Non'}</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditTg(t)}>Modifier</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiOutlineDocumentText className="h-5 w-5" />
            Types d&apos;assurances
          </h2>
          <Button size="sm" onClick={openCreateTa}><HiOutlinePlus className="h-4 w-4" /> Ajouter</Button>
        </div>
        {!typesAssurance.length ? (
          <p className="text-gray-500 text-sm">Aucun type. Ajoutez des types (ex. Vie crédit, Perte d&apos;emploi).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 font-medium">Libellé</th>
                  <th className="pb-2 font-medium">Actif</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {typesAssurance.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="py-2 font-mono">{t.code}</td>
                    <td className="py-2">{t.libelle}</td>
                    <td className="py-2">{t.actif ? 'Oui' : 'Non'}</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditTa(t)}>Modifier</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-sm text-gray-500">
        Les garanties et assurances sont enregistrées au niveau des dossiers crédit (détail dossier). Lien : <a href={AppRoutes.CREDIT} className="text-blue-600 hover:underline">Dossiers crédit</a>.
      </p>

      <Modal
        open={modalType === 'tg'}
        onClose={() => setModalType(null)}
        title={editingTg ? 'Modifier le type de garantie' : 'Nouveau type de garantie'}
      >
        <div className="space-y-3">
          <Input label="Code" value={formTg.code} onChange={(e) => setFormTg((p) => ({ ...p, code: e.target.value }))} placeholder="IMMOBILIERE" disabled={!!editingTg} />
          <Input label="Libellé" value={formTg.libelle} onChange={(e) => setFormTg((p) => ({ ...p, libelle: e.target.value }))} placeholder="Garantie immobilière" />
          <Input label="Valeur min (optionnel)" type="number" value={String(formTg.valeurMin)} onChange={(e) => setFormTg((p) => ({ ...p, valeurMin: e.target.value }))} />
          <Input label="Valeur max (optionnel)" type="number" value={String(formTg.valeurMax)} onChange={(e) => setFormTg((p) => ({ ...p, valeurMax: e.target.value }))} />
          <Input label="Ratio couverture min (%)" type="number" value={formTg.ratioCouvertureMin} onChange={(e) => setFormTg((p) => ({ ...p, ratioCouvertureMin: e.target.value }))} />
          <Input label="Durée validité (mois, 0=illimité)" type="number" value={formTg.dureeValiditeMois} onChange={(e) => setFormTg((p) => ({ ...p, dureeValiditeMois: e.target.value }))} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formTg.actif} onChange={(e) => setFormTg((p) => ({ ...p, actif: e.target.checked }))} />
            <span className="text-sm">Actif</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setModalType(null)}>Annuler</Button>
          <Button onClick={saveTypeGarantie} isLoading={submitting}>Enregistrer</Button>
        </div>
      </Modal>

      <Modal
        open={modalType === 'ta'}
        onClose={() => setModalType(null)}
        title={editingTa ? 'Modifier le type d\'assurance' : 'Nouveau type d\'assurance'}
      >
        <div className="space-y-3">
          <Input label="Code" value={formTa.code} onChange={(e) => setFormTa((p) => ({ ...p, code: e.target.value }))} placeholder="VIE_CREDIT" disabled={!!editingTa} />
          <Input label="Libellé" value={formTa.libelle} onChange={(e) => setFormTa((p) => ({ ...p, libelle: e.target.value }))} placeholder="Assurance vie crédit" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formTa.actif} onChange={(e) => setFormTa((p) => ({ ...p, actif: e.target.checked }))} />
            <span className="text-sm">Actif</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setModalType(null)}>Annuler</Button>
          <Button onClick={saveTypeAssurance} isLoading={submitting}>Enregistrer</Button>
        </div>
      </Modal>
    </div>
  );
}
