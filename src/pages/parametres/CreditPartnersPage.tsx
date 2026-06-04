import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineBuildingOffice2, HiOutlineDocumentText, HiOutlinePlus } from 'react-icons/hi2';
import { creditApi } from '@/core/api';
import type { CreditPartner, CreditPartnerAgreement } from '@/types';
import { ModeRecouvrementCredit, StatutCreditConvention, TypeCreditPartner } from '@/types/enums';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import MoneyInput from '@/components/ui/MoneyInput';
import Modal from '@/components/ui/Modal';
import PhoneInput from '@/components/ui/PhoneInput';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatMoneyInput, formatXaf, parseMoneyInput } from '@/lib/money';

const partnerTypeLabel: Record<TypeCreditPartner, string> = {
  [TypeCreditPartner.ENTREPRISE]: 'Entreprise',
  [TypeCreditPartner.BANQUE]: 'Banque',
  [TypeCreditPartner.MICROFINANCE]: 'Microfinance',
  [TypeCreditPartner.ASSOCIATION]: 'Association',
  [TypeCreditPartner.MUTUELLE]: 'Mutuelle',
  [TypeCreditPartner.MARCHAND]: 'Marchand',
  [TypeCreditPartner.AUTRE]: 'Autre',
};

const recouvrementLabel: Record<ModeRecouvrementCredit, string> = {
  [ModeRecouvrementCredit.RETENUE_SALAIRE]: 'Retenue salaire',
  [ModeRecouvrementCredit.PRELEVEMENT_BANCAIRE]: 'Prélèvement bancaire',
  [ModeRecouvrementCredit.REMBOURSEMENT_MOBILE_MONEY]: 'Mobile Money',
  [ModeRecouvrementCredit.REMBOURSEMENT_CAISSE]: 'Caisse',
  [ModeRecouvrementCredit.MIXTE]: 'Mixte',
};

const statutBadge = (statut: StatutCreditConvention) => {
  if (statut === StatutCreditConvention.ACTIVE) return <Badge variant="success">Active</Badge>;
  if (statut === StatutCreditConvention.SUSPENDUE) return <Badge variant="warning">Suspendue</Badge>;
  return <Badge variant="neutral">Expirée</Badge>;
};

export default function CreditPartnersPage() {
  const [partners, setPartners] = useState<CreditPartner[]>([]);
  const [agreements, setAgreements] = useState<CreditPartnerAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<CreditPartner | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<CreditPartnerAgreement | null>(null);

  const [partnerForm, setPartnerForm] = useState({
    nom: '',
    type: TypeCreditPartner.ENTREPRISE,
    telephone: '',
    email: '',
    adresse: '',
    notes: '',
    actif: true,
  });
  const [agreementForm, setAgreementForm] = useState({
    idPartner: '',
    reference: '',
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: '',
    plafondGlobal: '',
    plafondParClient: '',
    tauxInteretMax: '',
    tauxPenaliteMax: '',
    modeRecouvrement: ModeRecouvrementCredit.RETENUE_SALAIRE,
    statut: StatutCreditConvention.ACTIVE,
    notes: '',
  });

  const activePartners = useMemo(() => partners.filter((p) => p.actif), [partners]);

  const load = () => {
    setLoading(true);
    Promise.all([creditApi.listPartners(), creditApi.listPartnerAgreements()])
      .then(([p, a]) => {
        setPartners(Array.isArray(p) ? p : []);
        setAgreements(Array.isArray(a) ? a : []);
      })
      .catch((err: any) => toast.error(err?.message ?? 'Erreur chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreatePartner = () => {
    setEditingPartner(null);
    setPartnerForm({
      nom: '',
      type: TypeCreditPartner.ENTREPRISE,
      telephone: '',
      email: '',
      adresse: '',
      notes: '',
      actif: true,
    });
    setPartnerModalOpen(true);
  };

  const openEditPartner = (partner: CreditPartner) => {
    setEditingPartner(partner);
    setPartnerForm({
      nom: partner.nom,
      type: partner.type,
      telephone: partner.telephone ?? '',
      email: partner.email ?? '',
      adresse: partner.adresse ?? '',
      notes: partner.notes ?? '',
      actif: partner.actif,
    });
    setPartnerModalOpen(true);
  };

  const openCreateAgreement = () => {
    setEditingAgreement(null);
    setAgreementForm({
      idPartner: activePartners[0]?.id ?? '',
      reference: '',
      dateDebut: new Date().toISOString().slice(0, 10),
      dateFin: '',
      plafondGlobal: '',
      plafondParClient: '',
      tauxInteretMax: '',
      tauxPenaliteMax: '',
      modeRecouvrement: ModeRecouvrementCredit.RETENUE_SALAIRE,
      statut: StatutCreditConvention.ACTIVE,
      notes: '',
    });
    setAgreementModalOpen(true);
  };

  const openEditAgreement = (agreement: CreditPartnerAgreement) => {
    setEditingAgreement(agreement);
    setAgreementForm({
      idPartner: agreement.idPartner,
      reference: agreement.reference,
      dateDebut: agreement.dateDebut?.slice(0, 10) ?? '',
      dateFin: agreement.dateFin?.slice(0, 10) ?? '',
      plafondGlobal: formatMoneyInput(agreement.plafondGlobal),
      plafondParClient: formatMoneyInput(agreement.plafondParClient),
      tauxInteretMax: agreement.tauxInteretMax != null ? String(agreement.tauxInteretMax) : '',
      tauxPenaliteMax: agreement.tauxPenaliteMax != null ? String(agreement.tauxPenaliteMax) : '',
      modeRecouvrement: agreement.modeRecouvrement,
      statut: agreement.statut,
      notes: agreement.notes ?? '',
    });
    setAgreementModalOpen(true);
  };

  const savePartner = async () => {
    if (!partnerForm.nom.trim()) {
      toast.error('Renseignez le nom du partenaire.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nom: partnerForm.nom.trim(),
        type: partnerForm.type,
        telephone: partnerForm.telephone.trim() || undefined,
        email: partnerForm.email.trim() || undefined,
        adresse: partnerForm.adresse.trim() || undefined,
        notes: partnerForm.notes.trim() || undefined,
        actif: partnerForm.actif,
      };
      if (editingPartner) {
        await creditApi.updatePartner(editingPartner.id, payload);
        toast.success('Partenaire mis à jour.');
      } else {
        await creditApi.createPartner(payload);
        toast.success('Partenaire créé.');
      }
      setPartnerModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const saveAgreement = async () => {
    if (!agreementForm.idPartner || !agreementForm.reference.trim() || !agreementForm.dateDebut) {
      toast.error('Renseignez le partenaire, la référence et la date de début.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        idPartner: agreementForm.idPartner,
        reference: agreementForm.reference.trim(),
        dateDebut: agreementForm.dateDebut,
        dateFin: agreementForm.dateFin || undefined,
        plafondGlobal: parseMoneyInput(agreementForm.plafondGlobal),
        plafondParClient: parseMoneyInput(agreementForm.plafondParClient),
        tauxInteretMax: agreementForm.tauxInteretMax ? Number(agreementForm.tauxInteretMax) : undefined,
        tauxPenaliteMax: agreementForm.tauxPenaliteMax ? Number(agreementForm.tauxPenaliteMax) : undefined,
        modeRecouvrement: agreementForm.modeRecouvrement,
        statut: agreementForm.statut,
        notes: agreementForm.notes.trim() || undefined,
      };
      if (editingAgreement) {
        await creditApi.updatePartnerAgreement(editingAgreement.id, payload);
        toast.success('Convention mise à jour.');
      } else {
        await creditApi.createPartnerAgreement(payload);
        toast.success('Convention créée.');
      }
      setAgreementModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partenaires crédit</h1>
        <p className="text-gray-500 mt-1">
          Organisations, employeurs, banques, mutuelles ou associations qui encadrent l&apos;éligibilité et le recouvrement crédit.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiOutlineBuildingOffice2 className="h-5 w-5" />
            Partenaires
          </h2>
          <Button size="sm" onClick={openCreatePartner}>
            <HiOutlinePlus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
        {!partners.length ? (
          <p className="text-sm text-gray-500">Aucun partenaire crédit enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Nom</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Contact</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr key={partner.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{partner.nom}</td>
                    <td className="py-2">{partnerTypeLabel[partner.type] ?? partner.type}</td>
                    <td className="py-2 text-gray-600">{partner.telephone || partner.email || '—'}</td>
                    <td className="py-2">{partner.actif ? <Badge variant="success">Actif</Badge> : <Badge variant="neutral">Inactif</Badge>}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditPartner(partner)}>Modifier</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiOutlineDocumentText className="h-5 w-5" />
            Conventions
          </h2>
          <Button size="sm" onClick={openCreateAgreement} disabled={!activePartners.length}>
            <HiOutlinePlus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
        {!agreements.length ? (
          <p className="text-sm text-gray-500">Aucune convention crédit enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Référence</th>
                  <th className="pb-2 font-medium">Partenaire</th>
                  <th className="pb-2 font-medium">Recouvrement</th>
                  <th className="pb-2 font-medium">Plafond/client</th>
                  <th className="pb-2 font-medium">Validité</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((agreement) => (
                  <tr key={agreement.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{agreement.reference}</td>
                    <td className="py-2">{agreement.partner?.nom ?? '—'}</td>
                    <td className="py-2">{recouvrementLabel[agreement.modeRecouvrement] ?? agreement.modeRecouvrement}</td>
                    <td className="py-2">{formatXaf(agreement.plafondParClient)}</td>
                    <td className="py-2 text-gray-600">
                      {agreement.dateDebut?.slice(0, 10)} {agreement.dateFin ? `→ ${agreement.dateFin.slice(0, 10)}` : ''}
                    </td>
                    <td className="py-2">{statutBadge(agreement.statut)}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditAgreement(agreement)}>Modifier</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        title={editingPartner ? 'Modifier le partenaire' : 'Ajouter un partenaire'}
      >
        <div className="space-y-4">
          <Input label="Nom *" value={partnerForm.nom} onChange={(e) => setPartnerForm((f) => ({ ...f, nom: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={partnerForm.type}
              onChange={(e) => setPartnerForm((f) => ({ ...f, type: e.target.value as TypeCreditPartner }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.values(TypeCreditPartner).map((type) => (
                <option key={type} value={type}>{partnerTypeLabel[type]}</option>
              ))}
            </select>
          </div>
          <PhoneInput label="Téléphone" value={partnerForm.telephone} onChange={(telephone) => setPartnerForm((f) => ({ ...f, telephone }))} />
          <Input label="Email" value={partnerForm.email} onChange={(e) => setPartnerForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Adresse" value={partnerForm.adresse} onChange={(e) => setPartnerForm((f) => ({ ...f, adresse: e.target.value }))} />
          <Input label="Notes" value={partnerForm.notes} onChange={(e) => setPartnerForm((f) => ({ ...f, notes: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={partnerForm.actif}
              onChange={(e) => setPartnerForm((f) => ({ ...f, actif: e.target.checked }))}
            />
            Partenaire actif
          </label>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setPartnerModalOpen(false)}>Annuler</Button>
            <Button type="button" onClick={savePartner} isLoading={submitting}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        title={editingAgreement ? 'Modifier la convention' : 'Ajouter une convention'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partenaire *</label>
              <select
                value={agreementForm.idPartner}
                onChange={(e) => setAgreementForm((f) => ({ ...f, idPartner: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner</option>
                {activePartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>{partner.nom}</option>
                ))}
              </select>
            </div>
            <Input label="Référence *" value={agreementForm.reference} onChange={(e) => setAgreementForm((f) => ({ ...f, reference: e.target.value }))} />
            <Input label="Date début *" type="date" value={agreementForm.dateDebut} onChange={(e) => setAgreementForm((f) => ({ ...f, dateDebut: e.target.value }))} />
            <Input label="Date fin" type="date" value={agreementForm.dateFin} onChange={(e) => setAgreementForm((f) => ({ ...f, dateFin: e.target.value }))} />
            <MoneyInput
              label="Plafond global (XAF)"
              value={agreementForm.plafondGlobal}
              onChange={(plafondGlobal) => setAgreementForm((f) => ({ ...f, plafondGlobal }))}
            />
            <MoneyInput
              label="Plafond par client (XAF)"
              value={agreementForm.plafondParClient}
              onChange={(plafondParClient) => setAgreementForm((f) => ({ ...f, plafondParClient }))}
            />
            <Input label="Taux intérêt max (%)" type="number" min={0} step={0.1} value={agreementForm.tauxInteretMax} onChange={(e) => setAgreementForm((f) => ({ ...f, tauxInteretMax: e.target.value }))} />
            <Input label="Taux pénalité max (%/jour)" type="number" min={0} step={0.1} value={agreementForm.tauxPenaliteMax} onChange={(e) => setAgreementForm((f) => ({ ...f, tauxPenaliteMax: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de recouvrement</label>
              <select
                value={agreementForm.modeRecouvrement}
                onChange={(e) => setAgreementForm((f) => ({ ...f, modeRecouvrement: e.target.value as ModeRecouvrementCredit }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ModeRecouvrementCredit).map((mode) => (
                  <option key={mode} value={mode}>{recouvrementLabel[mode]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={agreementForm.statut}
                onChange={(e) => setAgreementForm((f) => ({ ...f, statut: e.target.value as StatutCreditConvention }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={StatutCreditConvention.ACTIVE}>Active</option>
                <option value={StatutCreditConvention.SUSPENDUE}>Suspendue</option>
                <option value={StatutCreditConvention.EXPIREE}>Expirée</option>
              </select>
            </div>
          </div>
          <Input label="Notes" value={agreementForm.notes} onChange={(e) => setAgreementForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setAgreementModalOpen(false)}>Annuler</Button>
            <Button type="button" onClick={saveAgreement} isLoading={submitting}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
