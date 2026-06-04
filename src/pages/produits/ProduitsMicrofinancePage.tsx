import { Link } from 'react-router-dom';
import { HiOutlineBanknotes, HiOutlineCreditCard, HiOutlineTruck, HiOutlineCog6Tooth, HiOutlinePlus } from 'react-icons/hi2';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import { TypeCalculCredit, TypeProduit } from '@/types';

/** Lien paramétrage sur une carte (icône en haut à droite). */
function CardParametreLink({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to}
      title={title}
      className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
    >
      <HiOutlineCog6Tooth className="h-5 w-5" />
    </Link>
  );
}

export default function ProduitsMicrofinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produits microfinance</h1>
        <p className="text-gray-500 mt-1">
          Les trois piliers de la microfinance : <strong>Collecte</strong>, <strong>Épargne</strong> et <strong>Crédit</strong>. Un client doit être lié à un produit (module) pour en bénéficier. La tontine est un type de plan de collecte, paramétrable dans les plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 relative">
          <CardParametreLink to={AppRoutes.PLANS_COLLECTE} title="Paramétrage : plans de collecte" />
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <HiOutlineTruck className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Collecte</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enregistrement des versements chez le client : montants quotidiens définis par les <strong>plans de collecte</strong> (épargne, tontine, libre). Les collectes alimentent le compte du client.
              </p>
              <Link to={AppRoutes.COLLECTES} className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                Enregistrer des collectes →
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-6 relative">
          <CardParametreLink to={AppRoutes.PLANS_COLLECTE} title="Paramétrage : plans de collecte (épargne)" />
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <HiOutlineBanknotes className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Épargne</h2>
              <p className="text-sm text-gray-500 mt-1">
                Comptes épargne : le client dépose régulièrement et peut retirer selon les conditions. Les montants et types (épargne, bloquée, programmée, tontine) sont définis dans les <strong>plans de collecte</strong>.
              </p>
              <Link to={AppRoutes.PLANS_COLLECTE} className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                Voir les plans de collecte →
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-6 relative">
          <CardParametreLink to={AppRoutes.PRODUITS} title="Paramétrage : produits crédit" />
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <HiOutlineCreditCard className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Crédit</h2>
              <p className="text-sm text-gray-500 mt-1">
                Prêts aux clients : création de dossiers crédit, validation, octroi, remboursement des échéances. Les produits crédit définissent les plafonds, durées, intérêts et pénalités.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  to={AppRoutes.PRODUIT_CREATE}
                  state={{
                    returnTo: AppRoutes.PRODUITS_MICROFINANCE,
                    initialType: TypeProduit.PRET,
                    initialTypeCalculCredit: TypeCalculCredit.FORFAITAIRE_COURT_TERME,
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                >
                  <HiOutlinePlus className="h-4 w-4" />
                  Créer un produit crédit
                </Link>
                <Link to={AppRoutes.PRODUITS} className="text-sm text-primary-600 hover:underline">
                  Gérer les produits crédit →
                </Link>
                <Link to={AppRoutes.CREDIT} className="text-sm text-primary-600 hover:underline">
                  Dossiers crédit →
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Distinction importante</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <strong>Plans de collecte</strong> (icône paramètre sur les cartes Collecte et Épargne) : montants quotidiens (1000 XAF, 2000 XAF…), types (épargne, tontine, libre). Ils définissent ce que le collecteur récupère et comment c’est comptabilisé.
          </li>
          <li>
            <strong>Produits microfinance</strong> : Collecte, Épargne, Crédit. Ce sont les trois piliers. La <strong>tontine</strong> est un type de plan de collecte (cotisation rotative), pas un pilier à part.
          </li>
          <li>
            <strong>Produits crédit</strong> : produits de type prêt qui portent les règles de montant, durée, intérêt, pénalité et mode de calcul. Ils sont ensuite sélectionnés lors de la création d&apos;un dossier crédit.
          </li>
          <li>
            Une <strong>souscription</strong> lie un client à un plan de collecte (ex. collecte 1000 XAF/jour). Les collectes enregistrées alimentent ce plan.
          </li>
        </ul>
      </Card>
    </div>
  );
}
