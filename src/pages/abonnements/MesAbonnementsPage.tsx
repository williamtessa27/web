import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { HiOutlineCalendar, HiOutlineBanknotes, HiOutlineArrowDownTray } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { abonnementApi } from '@/core/api';
import type { Abonnement } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/core/store/auth.store';

/** Format montant pour affichage à l'écran (espaces insécables possibles). */
function formatMontant(montant: number, devise = 'XAF') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(montant)) + ` ${devise}`;
}

/**
 * Format montant pour PDF : espaces normaux uniquement (évite le rendu incorrect en PDF).
 * Ex. 150000 → "150 000 XAF"
 */
function formatMontantForPdf(montant: number, devise: string): string {
  const n = Math.round(Number(montant));
  const s = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${s} ${devise}`;
}

function getStatutLabel(isEnCours: boolean, isFutur: boolean) {
  return isEnCours ? 'En cours' : isFutur ? 'À venir' : 'Terminé';
}

function downloadAbonnementPdf(
  a: Abonnement,
  entrepriseNom: string,
  devise: string,
) {
  const dateDebut = format(new Date(a.dateDebut), 'dd MMMM yyyy', { locale: fr });
  const dateFin = format(new Date(a.dateFin), 'dd MMMM yyyy', { locale: fr });
  const today = new Date();
  const isEnCours = today >= new Date(a.dateDebut) && today <= new Date(a.dateFin);
  const isFutur = today < new Date(a.dateDebut);
  const statut = getStatutLabel(isEnCours, isFutur);
  const montantStr = formatMontantForPdf(Number(a.montant), devise);

  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = 210;
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let y = 28;

  // En-tête
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Attestation d\'abonnement', margin, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Document émis le ${format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`, margin, 32);
  y = 50;

  // Bloc entreprise
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 58, 'S');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Entreprise', margin + 6, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(entrepriseNom || '—', margin + 6, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.text('Montant', margin + 6, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(montantStr, margin + 6, y + 36);
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Durée', margin + 6, y + 46);
  doc.setFont('helvetica', 'normal');
  doc.text(`${a.dureeMois} mois`, margin + 6, y + 54);
  y += 62;

  // Période et statut
  doc.setFont('helvetica', 'bold');
  doc.text('Période', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Du ${dateDebut} au ${dateFin}`, margin, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.text('Statut', margin, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 64, 175);
  doc.text(statut, margin, y + 30);
  doc.setTextColor(51, 65, 85);
  y += 42;

  // Référence en pied de page
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Référence : ${a.id}`, margin, y);

  const filename = `abonnement-${a.id.slice(0, 8)}-${format(new Date(a.dateDebut), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

export default function MesAbonnementsPage() {
  const { entreprise } = useAuthStore();
  const [list, setList] = useState<Abonnement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    abonnementApi
      .mesAbonnements()
      .then(setList)
      .catch(() => toast.error('Erreur lors du chargement des abonnements'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes abonnements</h1>
        <p className="text-gray-500 mt-1">
          Historique et détails des abonnements de votre entreprise{entreprise?.nom ? ` (${entreprise.nom})` : ''}.
        </p>
      </div>

      {!list.length ? (
        <Card>
          <EmptyState
            title="Aucun abonnement"
            description="Vos abonnements plateforme apparaîtront ici. La période d'essai ou les abonnements souscrits par l'administrateur de la plateforme y seront listés."
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((a) => {
            const dateDebut = new Date(a.dateDebut);
            const dateFin = new Date(a.dateFin);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin.setHours(0, 0, 0, 0);
            const isEnCours = today >= dateDebut && today <= dateFin;
            const isFutur = today < dateDebut;
            return (
              <Card key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary-50 p-3">
                    <HiOutlineBanknotes className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {formatMontant(Number(a.montant), entreprise?.devise ?? 'XAF')}
                      </span>
                      <span className="text-gray-500">—</span>
                      <span className="text-sm text-gray-600">{a.dureeMois} mois</span>
                      <Badge
                        variant={
                          isEnCours ? 'success' : isFutur ? 'info' : 'neutral'
                        }
                      >
                        {isEnCours ? 'En cours' : isFutur ? 'À venir' : 'Terminé'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <HiOutlineCalendar className="h-4 w-4" />
                        Du {format(dateDebut, 'dd MMM yyyy', { locale: fr })} au{' '}
                        {format(dateFin, 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      try {
                        downloadAbonnementPdf(a, entreprise?.nom ?? '', entreprise?.devise ?? 'XAF');
                        toast.success('PDF téléchargé');
                      } catch {
                        toast.error('Erreur lors de la génération du PDF');
                      }
                    }}
                  >
                    <HiOutlineArrowDownTray className="h-4 w-4" />
                    Télécharger PDF
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
