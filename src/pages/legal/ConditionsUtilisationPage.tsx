import { Link } from 'react-router-dom';
import { AppRoutes } from '@/config/routes.config';
import { useSEO } from '@/hooks/useSEO';

const sections = [
  { title: 'Objet', content: 'Les présentes conditions régissent l\'accès et l\'utilisation de l\'application Kimifinance fournie par Kimistack. En utilisant l\'application, vous acceptez ces conditions.' },
  { title: 'Accès et utilisation', items: ['L\'Utilisateur doit être majeur selon la réglementation locale ou disposer d\'une autorisation légale.', 'L\'Utilisateur s\'engage à fournir des informations exactes et complètes lors de la création de son compte.', 'L\'Utilisateur est responsable de la confidentialité de ses identifiants et mots de passe.'] },
  { title: 'Services proposés', items: ['La gestion de l\'épargne, crédits et collectes.', 'La consultation des comptes, transactions et historiques.', 'La communication avec les agents et le support.', 'L\'activation de certains services peut nécessiter la validation par un gestionnaire ou chef d\'agence.'] },
  { title: 'Obligations de l\'Utilisateur', items: ['Respecter la législation en vigueur au Cameroun.', 'Ne pas utiliser l\'application à des fins frauduleuses ou illégales.', 'Ne pas transmettre de virus, logiciels malveillants ou données corrompues.', 'Ne pas créer de compte multiple pour contourner les règles financières.'] },
  { title: 'Propriété intellectuelle', content: 'Tous les contenus, logos, designs et codes sources appartiennent à Kimistack. L\'Utilisateur ne peut pas copier, reproduire ou redistribuer ces éléments sans autorisation écrite.' },
  { title: 'Responsabilité', content: 'Kimistack n\'est pas responsable des pertes financières résultant d\'erreurs de saisie ou d\'utilisation incorrecte de l\'application. L\'application est fournie « en l\'état ». Nous nous engageons à assurer disponibilité et sécurité, mais certains incidents techniques peuvent survenir.' },
  { title: 'Suspension et résiliation', items: ['Kimistack peut suspendre ou résilier le compte d\'un utilisateur en cas de violation des CGU ou de suspicion de fraude.', 'L\'Utilisateur peut demander la fermeture de son compte via l\'application ou le site officiel.'] },
  { title: 'Notifications et communications', content: 'Les notifications peuvent être envoyées via l\'application, email ou SMS pour les rappels de collecte, crédit ou épargne. L\'Utilisateur peut gérer ses préférences depuis son compte.' },
  { title: 'Modifications des CGU', content: 'Les CGU peuvent être mises à jour. Les modifications seront publiées dans l\'application ou sur le site officiel et notifieront les utilisateurs. La poursuite de l\'utilisation après modification vaut acceptation.' },
];

export default function ConditionsUtilisationPage() {
  useSEO({
    title: 'Conditions générales d\'utilisation',
    description: 'Conditions générales d\'utilisation (CGU) – Kimifinance',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link to={AppRoutes.HOME} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            ← Retour à l'accueil
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Conditions générales d'utilisation (CGU) – Kimifinance</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-10 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {i + 1} {s.title}
              </h2>
              {s.content && <p className="text-gray-600 leading-relaxed">{s.content}</p>}
              {s.items && (
                <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
                  {s.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
