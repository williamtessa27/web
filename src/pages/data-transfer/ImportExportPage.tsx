import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineDocumentArrowDown,
  HiOutlineUsers,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import {
  agenceApi,
  collecteurApi,
  downloadClientsImportTemplate,
  exportClients,
  importClientsFile,
  zoneApi,
} from '@/core/api';
import type { ExportClientsParams, ImportClientsResult } from '@/core/api';
import type { Agence, Collecteur, Zone } from '@/types';
import { StatutClient } from '@/types/enums';
import { AppRoutes } from '@/config/routes.config';
import { useHasPermission } from '@/config/permissions';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

type TransferMode = 'import' | 'export';

export default function ImportExportPage() {
  const canImport = useHasPermission('canCreateClient');
  const canExport = useHasPermission('canExportReport');
  const [mode, setMode] = useState<TransferMode>(canImport ? 'import' : 'export');
  const [zones, setZones] = useState<Zone[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportClientsResult | null>(null);
  const [importForm, setImportForm] = useState({
    idAgence: '',
    idCollecteur: '',
    idZone: '',
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [exportForm, setExportForm] = useState<ExportClientsParams & { actifFilter: '' | 'true' | 'false' }>({
    format: 'xlsx',
    dateDebut: '',
    dateFin: '',
    search: '',
    statut: '',
    actifFilter: '',
    zoneId: '',
    idAgence: '',
  });

  useEffect(() => {
    if (!canImport && !canExport) return;
    zoneApi.list().then(setZones).catch(() => setZones([]));
    agenceApi.list(true).then(setAgences).catch(() => setAgences([]));
    if (canImport) {
      collecteurApi.list({ limit: 500 }).then((res) => setCollecteurs(res.data)).catch(() => setCollecteurs([]));
    }
  }, [canExport, canImport]);

  const handleDownloadTemplate = async () => {
    try {
      const filename = await downloadClientsImportTemplate();
      toast.success(`Modèle téléchargé : ${filename}`);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Erreur lors du téléchargement du modèle');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Sélectionnez un fichier Excel ou CSV.');
      return;
    }
    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await importClientsFile(importFile, {
        idAgence: importForm.idAgence || undefined,
        idCollecteur: importForm.idCollecteur || undefined,
        idZone: importForm.idZone || undefined,
      });
      setImportResult(result);
      if (result.failed > 0) {
        toast.error(`${result.imported} client(s) importé(s), ${result.failed} ligne(s) en échec.`);
      } else {
        toast.success(`${result.imported} client(s) importé(s).`);
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Erreur lors de l’import');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params: ExportClientsParams = {
        format: exportForm.format ?? 'xlsx',
        dateDebut: exportForm.dateDebut || undefined,
        dateFin: exportForm.dateFin || undefined,
        search: exportForm.search || undefined,
        statut: exportForm.statut || undefined,
        zoneId: exportForm.zoneId || undefined,
        idAgence: exportForm.idAgence || undefined,
      };
      if (exportForm.actifFilter === 'true') params.actif = true;
      if (exportForm.actifFilter === 'false') params.actif = false;
      const filename = await exportClients(params);
      toast.success(`Export téléchargé : ${filename}`);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Erreur lors de l’export');
    } finally {
      setExportLoading(false);
    }
  };

  if (!canImport && !canExport) {
    return (
      <Card>
        <p className="text-sm text-gray-600">Vous n’avez pas les permissions nécessaires pour importer ou exporter des données.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import & Export</h1>
        <p className="mt-1 text-gray-500">Centralisez les échanges de données de votre entreprise.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200">
        {canImport && (
          <button
            type="button"
            onClick={() => setMode('import')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
              mode === 'import'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <HiOutlineArrowUpTray className="h-4 w-4" />
            Importer
          </button>
        )}
        {canExport && (
          <button
            type="button"
            onClick={() => setMode('export')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
              mode === 'export'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <HiOutlineArrowDownTray className="h-4 w-4" />
            Exporter
          </button>
        )}
      </div>

      <Card>
        <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <HiOutlineUsers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
              <p className="text-sm text-gray-500">
                {mode === 'import' ? 'Ajouter des clients depuis Excel ou CSV.' : 'Extraire la base clients avec des filtres optionnels.'}
              </p>
            </div>
          </div>
          <Link to={AppRoutes.CLIENTS} className="text-sm font-medium text-primary-700 hover:text-primary-800">
            Voir les clients
          </Link>
        </div>

        {mode === 'import' && canImport ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm text-gray-600">
                Les lignes valides sont créées. Chaque ligne rejetée reste détaillée avec son motif.
              </p>
              <Button variant="secondary" onClick={handleDownloadTemplate} disabled={importLoading}>
                <HiOutlineDocumentArrowDown className="h-4 w-4" />
                Télécharger le modèle
              </Button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fichier Excel ou CSV</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  setImportFile(event.target.files?.[0] ?? null);
                  setImportResult(null);
                }}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Select
                label="Agence par défaut (optionnel)"
                value={importForm.idAgence}
                onChange={(event) => setImportForm((form) => ({ ...form, idAgence: event.target.value }))}
                options={[{ value: '', label: 'Aucune' }, ...agences.map((agence) => ({ value: agence.id, label: agence.nom }))]}
              />
              <Select
                label="Collecteur par défaut (optionnel)"
                value={importForm.idCollecteur}
                onChange={(event) => setImportForm((form) => ({ ...form, idCollecteur: event.target.value }))}
                options={[
                  { value: '', label: 'Aucun' },
                  ...collecteurs.map((collecteur) => ({
                    value: collecteur.id,
                    label: `${collecteur.codeCollecteur}${collecteur.utilisateur ? ` - ${[collecteur.utilisateur.prenom, collecteur.utilisateur.nom].filter(Boolean).join(' ')}` : ''}`,
                  })),
                ]}
              />
              <Select
                label="Zone par défaut (optionnel)"
                value={importForm.idZone}
                onChange={(event) => setImportForm((form) => ({ ...form, idZone: event.target.value }))}
                options={[{ value: '', label: 'Aucune' }, ...zones.map((zone) => ({ value: zone.id, label: zone.nom }))]}
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-600">
              Colonnes reconnues : nom, prénom, email, indicatif, téléphone, genre, date_naissance, lieu_naissance, adresse, ville, pays, agence, collecteur et zone.
              Les rattachements sont optionnels et peuvent être complétés plus tard.
            </div>

            {importResult && (
              <div className="space-y-4 border-t border-gray-100 pt-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Lignes traitées</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">{importResult.totalRows}</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-xs text-green-700">Réussies</p>
                    <p className="mt-1 text-xl font-semibold text-green-800">{importResult.imported}</p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs text-red-700">Échecs</p>
                    <p className="mt-1 text-xl font-semibold text-red-800">{importResult.failed}</p>
                  </div>
                </div>

                {importResult.successes.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">Clients importés</h3>
                    <div className="max-h-56 overflow-auto rounded-lg border border-green-100">
                      {importResult.successes.map((success) => (
                        <div key={`${success.rowNumber}-${success.id}`} className="flex items-center justify-between gap-4 border-b border-green-50 px-3 py-2 last:border-b-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              Ligne {success.rowNumber} · {[success.nom, success.prenom].filter(Boolean).join(' ')}
                            </p>
                            <p className="text-xs text-gray-500">{success.email || success.telephone || success.codeClient}</p>
                          </div>
                          <Badge variant="success">{success.codeClient}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.failures.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">Lignes rejetées</h3>
                    <div className="max-h-64 overflow-auto rounded-lg border border-red-100">
                      {importResult.failures.map((failure) => (
                        <div key={failure.rowNumber} className="border-b border-red-50 p-3 last:border-b-0">
                          <p className="text-sm font-medium text-gray-900">
                            Ligne {failure.rowNumber}{failure.identifier ? ` · ${failure.identifier}` : ''}
                          </p>
                          <p className="mt-1 text-xs text-red-700">{failure.errors.join(' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleImport} disabled={importLoading || !importFile}>
                <HiOutlineArrowUpTray className="h-4 w-4" />
                {importLoading ? 'Import en cours…' : 'Lancer l’import'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Les données sont exportées depuis la base, jusqu’à 30 000 lignes.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Select
                label="Format"
                value={exportForm.format ?? 'xlsx'}
                onChange={(event) => setExportForm((form) => ({ ...form, format: event.target.value as 'xlsx' | 'csv' }))}
                options={[
                  { value: 'xlsx', label: 'Excel (.xlsx)' },
                  { value: 'csv', label: 'CSV' },
                ]}
              />
              <Select
                label="Statut"
                value={exportForm.statut ?? ''}
                onChange={(event) => setExportForm((form) => ({ ...form, statut: event.target.value || undefined }))}
                options={[
                  { value: '', label: 'Tous' },
                  { value: StatutClient.EN_ATTENTE_VALIDATION, label: 'En attente' },
                  { value: StatutClient.ACTIF, label: 'Actif' },
                  { value: StatutClient.SUSPENDU, label: 'Suspendu' },
                  { value: StatutClient.RESILIE, label: 'Résilié' },
                ]}
              />
              <Select
                label="Actif"
                value={exportForm.actifFilter}
                onChange={(event) => setExportForm((form) => ({ ...form, actifFilter: event.target.value as '' | 'true' | 'false' }))}
                options={[
                  { value: '', label: 'Tous' },
                  { value: 'true', label: 'Actifs uniquement' },
                  { value: 'false', label: 'Inactifs uniquement' },
                ]}
              />
              <Select
                label="Zone"
                value={exportForm.zoneId ?? ''}
                onChange={(event) => setExportForm((form) => ({ ...form, zoneId: event.target.value || undefined }))}
                options={[{ value: '', label: 'Toutes' }, ...zones.map((zone) => ({ value: zone.id, label: zone.nom }))]}
              />
              <Select
                label="Agence"
                value={exportForm.idAgence ?? ''}
                onChange={(event) => setExportForm((form) => ({ ...form, idAgence: event.target.value || undefined }))}
                options={[{ value: '', label: 'Toutes' }, ...agences.map((agence) => ({ value: agence.id, label: agence.nom }))]}
              />
              <Input
                label="Recherche"
                placeholder="Nom, prénom ou code client"
                value={exportForm.search ?? ''}
                onChange={(event) => setExportForm((form) => ({ ...form, search: event.target.value }))}
              />
              <Input
                label="Date d’inscription (début)"
                type="date"
                value={exportForm.dateDebut ?? ''}
                onChange={(event) => setExportForm((form) => ({ ...form, dateDebut: event.target.value }))}
              />
              <Input
                label="Date d’inscription (fin)"
                type="date"
                value={exportForm.dateFin ?? ''}
                onChange={(event) => setExportForm((form) => ({ ...form, dateFin: event.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleExport} disabled={exportLoading}>
                <HiOutlineArrowDownTray className="h-4 w-4" />
                {exportLoading ? 'Export en cours…' : 'Télécharger l’export'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
