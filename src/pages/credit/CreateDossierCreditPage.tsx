import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { creditApi, clientApi, produitApi } from '@/core/api';
import type { Client, Produit } from '@/types';
import { FrequenceRemboursementCredit } from '@/types/enums';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const freqOptions = [
  { value: FrequenceRemboursementCredit.MENSUEL, label: 'Mensuel' },
  { value: FrequenceRemboursementCredit.HEBDOMADAIRE, label: 'Hebdomadaire' },
  { value: FrequenceRemboursementCredit.JOURNALIER, label: 'Journalier' },
];

export default function CreateDossierCreditPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    idClient: '',
    idProduit: '',
    montantDemande: '',
    tauxInteret: '12',
    dureeMois: '12',
    frequenceRemboursement: FrequenceRemboursementCredit.MENSUEL,
    fraisDossier: '0',
    objetCredit: '',
  });

  useEffect(() => {
    Promise.all([
      clientApi.list({ limit: 500 }),
      produitApi.list(),
    ]).then(([clientsRes, produitsRes]) => {
      setClients(clientsRes?.data ?? []);
      setProduits(Array.isArray(produitsRes) ? produitsRes : []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montant = parseFloat(form.montantDemande);
    const taux = parseFloat(form.tauxInteret);
    const duree = parseInt(form.dureeMois, 10);
    const frais = parseFloat(form.fraisDossier) || 0;
    if (!form.idClient || !montant || montant <= 0 || !taux || taux < 0 || !duree || duree < 1) {
      toast.error('Remplissez les champs obligatoires (client, montant, taux, durée).');
      return;
    }
    setLoading(true);
    try {
      const dossier = await creditApi.createDossier({
        idClient: form.idClient,
        idProduit: form.idProduit || undefined,
        montantDemande: montant,
        tauxInteret: taux,
        dureeMois: duree,
        frequenceRemboursement: form.frequenceRemboursement,
        fraisDossier: frais,
        objetCredit: form.objetCredit || undefined,
      });
      toast.success('Demande de crédit créée.');
      navigate(AppRoutes.CREDIT_DETAIL.replace(':id', dossier.id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.CREDIT}>
          <Button variant="ghost" size="sm">← Retour</Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande de crédit</h1>
        <p className="text-gray-500 mt-1">Créez un dossier pour un client.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              required
              value={form.idClient}
              onChange={(e) => setForm((f) => ({ ...f, idClient: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.nom, c.prenom].filter(Boolean).join(' ')} — {c.codeClient}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produit crédit (optionnel)</label>
            <select
              value={form.idProduit}
              onChange={(e) => setForm((f) => ({ ...f, idProduit: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Aucun</option>
              {produits.filter((p) => p.type === 'PRET').map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Montant demandé (XAF) *"
              type="number"
              min={1}
              required
              value={form.montantDemande}
              onChange={(e) => setForm((f) => ({ ...f, montantDemande: e.target.value }))}
            />
            <Input
              label="Taux intérêt annuel (%) *"
              type="number"
              min={0}
              step={0.1}
              value={form.tauxInteret}
              onChange={(e) => setForm((f) => ({ ...f, tauxInteret: e.target.value }))}
            />
            <Input
              label="Durée (mois) *"
              type="number"
              min={1}
              value={form.dureeMois}
              onChange={(e) => setForm((f) => ({ ...f, dureeMois: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence remboursement</label>
              <select
                value={form.frequenceRemboursement}
                onChange={(e) => setForm((f) => ({ ...f, frequenceRemboursement: e.target.value as FrequenceRemboursementCredit }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {freqOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Frais de dossier (XAF)"
              type="number"
              min={0}
              value={form.fraisDossier}
              onChange={(e) => setForm((f) => ({ ...f, fraisDossier: e.target.value }))}
            />
          </div>

          <Input
            label="Objet du crédit (optionnel)"
            value={form.objetCredit}
            onChange={(e) => setForm((f) => ({ ...f, objetCredit: e.target.value }))}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Link to={AppRoutes.CREDIT}>
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button type="submit" isLoading={loading}>Créer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
