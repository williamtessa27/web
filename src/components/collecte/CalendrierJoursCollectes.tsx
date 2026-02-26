import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from '@/components/ui/Modal';

interface CalendrierJoursCollectesProps {
  open: boolean;
  onClose: () => void;
  dateDebut: string;
  dateFin: string;
  datesCollectes: string[];
  /** Dernière date sélectionnable (ex: aujourd'hui). Les jours après ne sont pas cliquables. */
  lastSelectable?: string;
  onSelectDate?: (dateStr: string) => void;
}

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CalendrierJoursCollectes({
  open,
  onClose,
  dateDebut,
  dateFin,
  datesCollectes,
  lastSelectable,
  onSelectDate,
}: CalendrierJoursCollectesProps) {
  const { days, paddingStart, rows } = useMemo(() => {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const start = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate());
    const end = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
    const days: Date[] = [];
    const d = new Date(start);
    while (d <= end) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    const paddingStart = (start.getDay() + 6) % 7; // 0 = Lundi
    const totalCells = paddingStart + days.length;
    const rows = Math.ceil(totalCells / 7);
    return { days, paddingStart, rows };
  }, [dateDebut, dateFin]);

  const formatDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return (
    <Modal open={open} onClose={onClose} title="Jours déjà collectés" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Période du produit : du {format(new Date(dateDebut), 'dd/MM/yyyy', { locale: fr })} au{' '}
          {format(new Date(dateFin), 'dd/MM/yyyy', { locale: fr })}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {JOURS_SEMAINE.map((w) => (
                  <th
                    key={w}
                    className="pb-2 text-center text-xs font-semibold text-gray-500"
                  >
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 7 }).map((_, colIndex) => {
                    const cellIndex = rowIndex * 7 + colIndex;
                    if (
                      cellIndex < paddingStart ||
                      cellIndex - paddingStart >= days.length
                    ) {
                      return <td key={colIndex} className="p-1" />;
                    }
                    const d = days[cellIndex - paddingStart];
                    const dateStr = formatDateStr(d);
                    const isCollected = datesCollectes.includes(dateStr);
                    const isAfterLast =
                      lastSelectable && dateStr > lastSelectable;
                    const today = new Date();
                    const isToday =
                      d.getDate() === today.getDate() &&
                      d.getMonth() === today.getMonth() &&
                      d.getFullYear() === today.getFullYear();
                    const canSelect =
                      onSelectDate && !isCollected && !isAfterLast;

                    return (
                      <td key={colIndex} className="p-1">
                        <div
                          className={`
                            flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium
                            ${
                              isCollected
                                ? 'bg-green-100 border border-green-500 text-green-700'
                                : canSelect
                                  ? 'cursor-pointer hover:bg-primary-50 hover:border-primary-300 border border-transparent text-gray-700'
                                  : 'text-gray-400'
                            }
                            ${isToday && !isCollected ? 'ring-1 ring-primary-400' : ''}
                          `}
                          onClick={() => {
                            if (canSelect) {
                              onSelectDate(dateStr);
                              onClose();
                            }
                          }}
                          role={canSelect ? 'button' : undefined}
                        >
                          {d.getDate()}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded border border-green-500 bg-green-100"
            aria-hidden
          />
          <span className="text-xs text-gray-500">Jour déjà collecté</span>
          {onSelectDate && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">
                Cliquez sur un jour non collecté pour le sélectionner
              </span>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
