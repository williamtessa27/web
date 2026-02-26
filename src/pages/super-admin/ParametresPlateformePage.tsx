import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCog6Tooth, HiOutlineBellAlert } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { entrepriseApi } from '@/core/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { AppRoutes } from '@/config/routes.config';

export default function ParametresPlateformePage() {
  const [defaultTrialMois, setDefaultTrialMois] = useState<number>(1);
  const [rappelAbonnementJours, setRappelAbonnementJours] = useState<number[]>([7, 3, 1]);
  const [rappelJoursInput, setRappelJoursInput] = useState<string>('7, 3, 1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    entrepriseApi
      .getPlatformParametres()
      .then((r) => {
        setDefaultTrialMois(r.defaultTrialMois ?? 1);
        const jours = r.rappelAbonnementJours ?? [7, 3, 1];
        setRappelAbonnementJours(jours);
        setRappelJoursInput(jours.join(', '));
      })
      .catch(() => toast.error('Erreur lors du chargement des paramètres'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (defaultTrialMois < 0 || defaultTrialMois > 24) {
      toast.error('La durée d\'essai doit être entre 0 et 24 mois');
      return;
    }
    const jours = rappelJoursInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (jours.length === 0) {
      toast.error('Indiquez au moins un nombre de jours pour les rappels (ex: 7, 3, 1)');
      return;
    }
    setSaving(true);
    try {
      await entrepriseApi.updatePlatformParametres({
        defaultTrialMois,
        rappelAbonnementJours: [...new Set(jours)].sort((a, b) => b - a),
      });
      setRappelAbonnementJours(jours);
      toast.success('Paramètres enregistrés');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={AppRoutes.SUPER_ADMIN_DASHBOARD}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Paramètres de la plateforme</h1>
      </div>

      <Card className="rounded-2xl max-w-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineCog6Tooth className="h-5 w-5" />
          Période d'essai par défaut
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Lorsqu'une microfinance crée son compte, cette durée d'essai (en mois) lui est accordée automatiquement.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Durée (mois) :</span>
            <input
              type="number"
              min={0}
              max={24}
              value={defaultTrialMois}
              onChange={(e) => setDefaultTrialMois(parseInt(e.target.value, 10) || 0)}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <Button variant="primary" onClick={handleSave} disabled={saving} isLoading={saving}>
            Enregistrer
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl max-w-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineBellAlert className="h-5 w-5" />
          Rappels abonnement
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Jours avant l'échéance (fin d'essai ou fin d'abonnement) pour envoyer un email de rappel à l'administrateur de l'entreprise. Saisir des nombres séparés par des virgules (ex: 7, 3, 1 pour J-7, J-3, J-1).
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <span className="text-sm font-medium text-gray-700">Jours avant échéance</span>
            <input
              type="text"
              value={rappelJoursInput}
              onChange={(e) => setRappelJoursInput(e.target.value)}
              placeholder="7, 3, 1"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <Button variant="primary" onClick={handleSave} disabled={saving} isLoading={saving}>
            Enregistrer
          </Button>
        </div>
      </Card>
    </div>
  );
}
