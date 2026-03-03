import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from 'react-icons/hi2';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { souscriptionApi, collecteApi } from '@/core/api';
import type { JoursCollectesResponse } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import type { Souscription } from '@/types';
import { StatutSouscription } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const statutMap: Record<StatutSouscription, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  [StatutSouscription.EN_COURS]: { label: 'En cours', variant: 'info' },
  [StatutSouscription.TERMINEE]: { label: 'Terminée', variant: 'success' },
  [StatutSouscription.ANNULEE]: { label: 'Annulée', variant: 'danger' },
  [StatutSouscription.EN_ATTENTE]: { label: 'En attente', variant: 'warning' },
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Number(amount)) + ' FCFA';
}

export default function SouscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [souscription, setSouscription] = useState<Souscription | null>(null);
  const [joursData, setJoursData] = useState<JoursCollectesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      souscriptionApi.get(id),
      souscriptionApi.get(id).then((s) => collecteApi.joursCollectes(s.idClient, id).catch(() => null)),
    ])
      .then(([sub, jours]) => {
        setSouscription(sub);
        setJoursData(jours ?? null);
      })
      .catch(() => toast.error('Souscription introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!souscription) return null;

  const st = statutMap[souscription.statut];
  const pct =
    Number(souscription.montantCible) > 0
      ? Math.min(100, (Number(souscription.montantCollecte) / Number(souscription.montantCible)) * 100)
      : 0;

  const dateDebut = souscription.dateDebut ? parseISO(souscription.dateDebut) : new Date();
  const dateFin = joursData?.dateFin
    ? parseISO(joursData.dateFin)
    : souscription.dateFin
      ? parseISO(souscription.dateFin)
      : null;
  const datesFromCollectes =
    (souscription.collectes ?? []).map((c) => c.dateCollecte?.slice(0, 10)).filter(Boolean) as string[];
  const datesCollectesSet = new Set(joursData?.datesCollectes ?? datesFromCollectes);
  const today = startOfDay(new Date());

  // Période programmée de la souscription (dateDebut → dateFin), pas le mois en cours
  const periodEnd = dateFin ?? today;
  const periodStart = dateDebut;
  const daysInRange = eachDayOfInterval({
    start: startOfDay(periodStart),
    end: periodEnd < periodStart ? periodStart : periodEnd,
  });

  const isFinished =
    souscription.statut === StatutSouscription.TERMINEE ||
    souscription.statut === StatutSouscription.ANNULEE;

  const joursCollectes = daysInRange.filter((d) => datesCollectesSet.has(format(d, 'yyyy-MM-dd')));
  const joursPassesNonCollectes = daysInRange.filter((d) => {
    const key = format(d, 'yyyy-MM-dd');
    return d <= today && !datesCollectesSet.has(key);
  });
  // Si souscription terminée ou annulée, plus de "jours à collecter"
  const joursAVenir = isFinished ? [] : daysInRange.filter((d) => d > today);

  const calendarPadding = (periodStart.getDay() + 6) % 7;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.SOUSCRIPTIONS}>
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{souscription.codeSouscription}</h1>
          <p className="text-gray-500 mt-1">
            {souscription.client?.nom}
            {souscription.client?.prenom ? ` ${souscription.client.prenom}` : ''}
            {' · '}
            {souscription.produit?.nom}
          </p>
          <div className="mt-2">
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Collecté</p>
            <p className="text-xl font-bold text-gray-900">{formatMoney(souscription.montantCollecte)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Objectif</p>
            <p className="text-xl font-bold text-gray-900">{formatMoney(souscription.montantCible)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Progression</p>
            <p className="text-xl font-bold text-primary-600">{pct.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Jours avec collecte</p>
            <p className="text-xl font-bold text-gray-900">{souscription.joursCollectes}</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Du {format(dateDebut, 'd MMMM yyyy', { locale: fr })}
          {dateFin ? ` au ${format(dateFin, 'd MMMM yyyy', { locale: fr })}` : ''}
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <HiOutlineCalendarDays className="h-5 w-5" /> Calendrier des collectes
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Jours collectés, non collectés et à venir pour la période concernée.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
            <HiOutlineCheckCircle className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Jours collectés</p>
              <p className="text-2xl font-bold text-green-700">{joursCollectes.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <HiOutlineXCircle className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Jours passés non collectés</p>
              <p className="text-2xl font-bold text-amber-700">{joursPassesNonCollectes.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <HiOutlineClock className="h-6 w-6 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Jours à collecter</p>
              <p className="text-2xl font-bold text-blue-700">
                {isFinished ? '—' : joursAVenir.length}
              </p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {/* Padding pour aligner le 1er jour de la période */}
            {Array.from({ length: calendarPadding }, (_, i) => (
              <div key={`pad-${i}`} className="bg-gray-50 min-h-[44px]" />
            ))}
            {daysInRange.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const collected = datesCollectesSet.has(key);
              const isPast = day < today;
              const isFuture = day > today;
              const isToday = day.getTime() === today.getTime();
              return (
                <div
                  key={key}
                  className={`min-h-[44px] flex items-center justify-center text-sm font-medium
                    ${collected ? 'bg-green-100 text-green-800' : ''}
                    ${isPast && !collected ? 'bg-amber-50 text-amber-700' : ''}
                    ${!isFinished && isFuture ? 'bg-blue-50 text-blue-700' : ''}
                    ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                  `}
                  title={
                    collected
                      ? `Collecté le ${format(day, 'd MMM yyyy', { locale: fr })}`
                      : isPast
                        ? `Non collecté (${format(day, 'd MMM yyyy', { locale: fr })})`
                        : isFinished
                          ? undefined
                          : `À collecter (${format(day, 'd MMM yyyy', { locale: fr })})`
                  }
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Période de la souscription — Légende : vert = collecté, orange = passé non collecté
          {!isFinished ? ', bleu = à venir' : ''}.
        </p>

        {(joursCollectes.length > 0 || joursPassesNonCollectes.length > 0 || joursAVenir.length > 0) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Détail des dates</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-700 mb-1">Jours collectés</p>
                <ul className="space-y-0.5 text-gray-600 max-h-32 overflow-y-auto">
                  {joursCollectes.slice(0, 15).map((d) => (
                    <li key={format(d, 'yyyy-MM-dd')}>{format(d, 'd MMM yyyy', { locale: fr })}</li>
                  ))}
                  {joursCollectes.length > 15 && <li className="text-gray-400">… +{joursCollectes.length - 15}</li>}
                </ul>
              </div>
              <div>
                <p className="font-medium text-amber-700 mb-1">Passés non collectés</p>
                <ul className="space-y-0.5 text-gray-600 max-h-32 overflow-y-auto">
                  {joursPassesNonCollectes.slice(0, 15).map((d) => (
                    <li key={format(d, 'yyyy-MM-dd')}>{format(d, 'd MMM yyyy', { locale: fr })}</li>
                  ))}
                  {joursPassesNonCollectes.length > 15 && (
                    <li className="text-gray-400">… +{joursPassesNonCollectes.length - 15}</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="font-medium text-blue-700 mb-1">À collecter</p>
                {isFinished ? (
                  <p className="text-sm text-gray-500">Souscription terminée ou annulée.</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-600 max-h-32 overflow-y-auto">
                    {joursAVenir.slice(0, 15).map((d) => (
                      <li key={format(d, 'yyyy-MM-dd')}>{format(d, 'd MMM yyyy', { locale: fr })}</li>
                    ))}
                    {joursAVenir.length > 15 && <li className="text-gray-400">… +{joursAVenir.length - 15}</li>}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
