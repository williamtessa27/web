import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppRoutes } from '@/config/routes.config';
import { useSEO } from '@/hooks/useSEO';
import clsx from 'clsx';

// ─── Images (remplaçables par vos assets) ───
const IMG = {
  mobile: '/collect_mobile.png',
  mobile_2: '/capture1.png',
  team: '/team.png',
  dashboard: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
};

// Titres du hero qui défilent (animation)
const HERO_ROTATING_TITLES = [
  'Booster votre productivité',
  'Optimiser la collecte de vos clients',
  'Suivi en temps réel',
  'Collecte simplifiée, partout.',
];

// Images dans les mockups (laptop, tablette, téléphone) — mettez vos captures dans /public
const HERO_DEVICE_IMAGES = {
  laptop: '/desktop.png',
  tablet: '/tablette.png',
  phone: '/capture1.png',
};
// Fallback si les fichiers ci‑dessus n'existent pas encore
const HERO_DEVICE_FALLBACK = '/capture1.png';

// ─── DATA ────────────────────────────────────────────
const problems = [
  {
    icon: '💸',
    title: 'Pertes de fonds non traçables',
    desc: 'Le cash quotidien circule sans suivi fiable.',
    detail: 'Sans outil dédié, les écarts entre ce qui a été collecté et ce qui est remis en caisse restent difficiles à détecter. Les pertes et les erreurs de comptage deviennent la norme, avec des réconciliations longues et des litiges fréquents avec les collecteurs et les clients.',
  },
  {
    icon: '📵',
    title: 'Zones sans connexion',
    desc: 'En zone rurale, les outils classiques ne fonctionnent pas.',
    detail: 'Les collecteurs travaillent souvent dans des zones où internet est absent ou très instable. Les solutions 100 % en ligne sont inutilisables sur le terrain. Il faut un outil qui enregistre les opérations hors ligne et synchronise dès que la connexion revient.',
  },
  {
    icon: '📋',
    title: 'Cahiers et papier',
    desc: 'Le suivi manuel génère erreurs et retards.',
    detail: 'Les cahiers, feuilles Excel et rapports papier multiplient les erreurs de report, les pertes de données et les retards de consolidation. La direction ne dispose pas d’une vision fiable et à jour pour piloter l’activité et prendre des décisions.',
  },
  {
    icon: '🔍',
    title: 'Aucune visibilité temps réel',
    desc: 'Impossible de suivre les tournées et les collectes en direct.',
    detail: 'Sans tableau de bord centralisé, vous ne savez pas en temps réel combien a été collecté, par qui, et où. Les alertes (client absent, montant anormal) arrivent trop tard. La supervision des équipes terrain et le reporting restent lourds et peu réactifs.',
  },
];

const features = [
  { icon: '📱', title: 'Mobile offline', desc: 'Saisie des paiements sans internet. Sync automatique au retour du réseau.', color: 'bg-primary-50 text-primary-600' },
  { icon: '🗺️', title: 'Tournées', desc: 'Circuits de collecte, zones par collecteur, suivi en temps réel.', color: 'bg-accent-50 text-accent-600' },
  { icon: '👥', title: 'Clients', desc: 'Fichier client, historique de paiements, solde et souscriptions.', color: 'bg-secondary-50 text-secondary-500' },
  { icon: '📊', title: 'Tableau de bord', desc: 'Montants collectés, performances collecteurs, tendances.', color: 'bg-primary-50 text-primary-600' },
  { icon: '💰', title: 'Commissions', desc: 'Calcul automatique selon les règles que vous définissez.', color: 'bg-amber-50 text-amber-600' },
  { icon: '🔐', title: 'Sécurité & rôles', desc: 'Accès par rôle. Données isolées par entreprise.', color: 'bg-rose-50 text-rose-600' },
];

const steps = [
  { num: '01', title: 'Créez votre entreprise', desc: 'Inscrivez votre structure et configurez vos zones.' },
  { num: '02', title: 'Ajoutez vos collecteurs', desc: 'Comptes terrain et affectation des zones.' },
  { num: '03', title: 'Enregistrez vos clients', desc: 'Clients, souscriptions et plans de paiement.' },
  { num: '04', title: 'Collectez & suivez', desc: 'Saisie des paiements (même offline), suivi en temps réel.' },
];

const stats = [
  { value: '100%', label: 'Offline' },
  { value: '<2s', label: 'Sync' },
  { value: 'Multi', label: 'Entreprise' },
  { value: '24/7', label: 'Suivi' },
];

const faqs = [
  { q: "L'application fonctionne-t-elle sans internet ?", a: "Oui. Les collecteurs enregistrent les paiements hors ligne. Les données se synchronisent dès que la connexion revient." },
  { q: "Combien coûte Kimifinance ?", a: "Kimifinance est gratuit pendant la phase de lancement. Aucune carte requise." },
  { q: "Peut-on gérer plusieurs entreprises ?", a: "Oui. Architecture multi-tenant : chaque entreprise a ses collecteurs, clients et données." },
  { q: "Comment sont calculées les commissions ?", a: "Vous définissez les règles (%, fixe, paliers). Le système calcule automatiquement." },
  { q: "Existe-t-il une app mobile ?", a: "Oui. App Flutter pour les collecteurs : offline complet et géolocalisation." },
];

// ─── COMPONENTS ──────────────────────────────────────
function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = (
    <>
      <a href="#features" onClick={closeMobileMenu} className="hover:text-primary-600 transition-colors">Fonctionnalités</a>
      <a href="#how-it-works" onClick={closeMobileMenu} className="hover:text-primary-600 transition-colors">Comment ça marche</a>
      <a href="#faq" onClick={closeMobileMenu} className="hover:text-primary-600 transition-colors">FAQ</a>
      <Link to={AppRoutes.CONTACT} onClick={closeMobileMenu} className="hover:text-primary-600 transition-colors">Contact</Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 min-w-0">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink" onClick={closeMobileMenu}>
          <img src="/logo_collect.png" alt="Kimifinance" className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain shrink-0" />
          <span className="text-base sm:text-lg font-bold text-gray-900 truncate">Kimifinance</span>
        </Link>

        {/* Desktop: liens au centre */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-gray-600 shrink-0">
          {navLinks}
        </div>

        {/* Desktop: Connexion + Commencer */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <Link to={AppRoutes.LOGIN} className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-2 transition-colors">Connexion</Link>
          <Link to={AppRoutes.REGISTER} className="text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">Commencer</Link>
        </div>

        {/* Mobile: uniquement le bouton menu (toujours visible, pas de scroll horizontal) */}
        <div className="flex md:hidden items-center shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2.5 -mr-1 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors touch-manipulation"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu (panneau déroulant) — Connexion et Commencer inclus pour éviter overflow header */}
      <div
        className={clsx(
          'md:hidden overflow-hidden transition-all duration-200 ease-out',
          mobileMenuOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-t border-gray-100 bg-white/98 backdrop-blur-sm px-4 py-4 pb-5 flex flex-col gap-1">
          <a href="#features" onClick={closeMobileMenu} className="py-3 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 font-medium transition-colors">Fonctionnalités</a>
          <a href="#how-it-works" onClick={closeMobileMenu} className="py-3 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 font-medium transition-colors">Comment ça marche</a>
          <a href="#faq" onClick={closeMobileMenu} className="py-3 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 font-medium transition-colors">FAQ</a>
          <Link to={AppRoutes.CONTACT} onClick={closeMobileMenu} className="py-3 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 font-medium transition-colors">Contact</Link>
          <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2">
            <Link to={AppRoutes.LOGIN} onClick={closeMobileMenu} className="py-3 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 font-medium transition-colors text-center">Connexion</Link>
            <Link to={AppRoutes.REGISTER} onClick={closeMobileMenu} className="py-3 px-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 text-center transition-colors">Commencer</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

const HERO_TITLE_DURATION_MS = 3500;

function Hero() {
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTitleIndex((i) => (i + 1) % HERO_ROTATING_TITLES.length);
    }, HERO_TITLE_DURATION_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Fond charte (dégradé, pas de slide) */}
      <div className="absolute inset-0 gradient-hero" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
            La collecte de{' '}
            <span className="text-accent-300">paiements</span>
            <br />
            <span className="relative inline-block min-h-[1.15em] w-full sm:w-auto" aria-live="polite">
              {HERO_ROTATING_TITLES.map((text, i) => (
                <span
                  key={text}
                  className={clsx(
                    'block transition-all duration-500 ease-out',
                    i === titleIndex
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-3 absolute left-0 top-0 pointer-events-none'
                  )}
                  style={i === titleIndex ? undefined : { position: 'absolute' as const }}
                  aria-hidden={i !== titleIndex}
                >
                  {text}
                </span>
              ))}
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/85 max-w-xl leading-relaxed">
            Gérez vos collecteurs, suivez les paiements journaliers et pilotez votre activité — même sans connexion. Tout en temps réel.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link to={AppRoutes.REGISTER} className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-lg">
              Commencer gratuitement
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            <Link to={AppRoutes.CONTACT} className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-medium px-6 py-3.5 rounded-xl border border-white/20 hover:bg-white/20 transition-all">
              Démo
            </Link>
          </div>
        </div>

        {/* Mockups : laptop, tablette, téléphone (images remplaçables) */}
        <div className="relative hidden lg:flex items-end justify-center gap-3 min-h-[420px]">
          {/* Laptop */}
          <div className="relative z-20 w-[78%] max-w-[440px]">
            <div className="relative rounded-lg border-4 border-gray-800 shadow-2xl bg-gray-900 overflow-hidden" style={{ paddingBottom: '62%' }}>
              <div className="absolute inset-2 rounded overflow-hidden bg-gray-100">
                <img src={HERO_DEVICE_IMAGES.laptop} alt="Application sur ordinateur" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = HERO_DEVICE_FALLBACK; }} />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-3 rounded-b-lg bg-gray-800" />
            </div>
          </div>
          {/* Tablette */}
          <div className="relative z-10 w-[44%] max-w-[240px] -ml-4 self-center">
            <div className="rounded-xl border-4 border-gray-700 shadow-xl bg-gray-800 overflow-hidden" style={{ paddingBottom: '133%' }}>
              <div className="absolute inset-2 rounded-md overflow-hidden bg-gray-100">
                <img src={HERO_DEVICE_IMAGES.tablet} alt="Application sur tablette" className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = HERO_DEVICE_FALLBACK; }} />
              </div>
            </div>
          </div>
          {/* Téléphone */}
          <div className="relative z-30 w-[26%] max-w-[145px] -ml-6 self-end mb-2">
            <div className="rounded-[1.25rem] border-4 border-gray-800 shadow-xl bg-gray-900 overflow-hidden" style={{ paddingBottom: '208%' }}>
              <div className="absolute inset-1.5 rounded-[0.6rem] overflow-hidden bg-gray-100">
                <img src={HERO_DEVICE_IMAGES.phone} alt="Application sur mobile" className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = HERO_DEVICE_FALLBACK; }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problems() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="problems" className="py-24 sm:py-28 bg-gradient-to-b from-primary-50/50 to-white relative overflow-hidden">
      {/* Fond discret pour mettre en avant la section */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-100/30 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Pourquoi Kimifinance ?</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            La collecte terrain est encore archaïque
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
            Ces difficultés freinent chaque jour des centaines de structures. Kimifinance a été conçu pour les résoudre de façon concrète et durable.
          </p>
          <p className="mt-4 text-base text-gray-500">
            Passez la souris sur chaque point pour en savoir plus.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((p, index) => (
            <div
              key={p.title}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={clsx(
                'group relative bg-white rounded-2xl border-2 transition-all duration-300 ease-out overflow-hidden',
                'hover:shadow-xl hover:shadow-primary-100/30 hover:-translate-y-1',
                hoveredIndex === index
                  ? 'border-primary-300 shadow-lg shadow-primary-100/20'
                  : 'border-gray-100 hover:border-primary-200'
              )}
            >
              <div className="p-6">
                <span className="text-3xl mb-4 block transition-transform duration-300 group-hover:scale-110" role="img" aria-hidden>{p.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
                {/* Zone dépliante au survol (collapse) */}
                <div
                  className={clsx(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    hoveredIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="pt-4 mt-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100">
                      {p.detail}
                    </p>
                  </div>
                </div>
              </div>
              {/* Indicateur visuel "en savoir plus" quand non survolé */}
              {hoveredIndex !== index && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>En savoir plus</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-gray-500 max-w-xl mx-auto">
          Ces quatre enjeux résument le quotidien de nombreuses IMF. Kimifinance apporte une réponse intégrée : mobile offline, suivi temps réel et données centralisées.
        </p>
      </div>
    </section>
  );
}

function SolutionBlock() {
  return (
    <section className="py-20 sm:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">La solution</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Collecte terrain et bureau, unifiées</h2>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed">
              Une plateforme unique pour vos collecteurs sur le terrain et vos équipes au bureau. Données synchronisées, tableaux de bord en temps réel, épargne et crédit intégrés.
            </p>
            <ul className="mt-6 space-y-3">
              {['Application mobile offline pour les collecteurs', 'Tableau de bord et rapports en temps réel', 'Gestion clients, épargne et crédit'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-100 text-accent-600 text-sm font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2 relative">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src={IMG.mobile} alt="Application mobile collecte" className="w-full h-auto object-cover aspect-[3/4] max-h-[480px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Fonctionnalités</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Tout ce dont vous avez besoin</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Kimifinance digitalise l’ensemble de votre processus de collecte.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300">
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4', f.color)}>{f.icon}</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-16 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-white">{s.value}</div>
              <div className="mt-1 text-sm font-semibold text-white/90">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Comment ça marche</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Opérationnel en 4 étapes</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative">
              <div className="text-5xl font-black text-primary-100 mb-3">{step.num}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBlock() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img src={IMG.team} alt="Équipe et collaboration" className="w-full h-auto object-cover aspect-[4/3]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Ils nous font confiance</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Conçu pour les institutions de microfinance</h2>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed">
              Kimifinance accompagne les IMF et structures de collecte qui veulent professionnaliser leur suivi terrain, sécuriser les flux et offrir épargne et crédit à leurs clients.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <span className="inline-flex items-center rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700">Multi-entreprise</span>
              <span className="inline-flex items-center rounded-full bg-accent-50 px-4 py-2 text-sm font-medium text-accent-600">Offline first</span>
              <span className="inline-flex items-center rounded-full bg-secondary-50 px-4 py-2 text-sm font-medium text-secondary-600">Temps réel</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section id="faq" className="py-20 sm:py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">FAQ</p>
          <h2 className="mt-3 text-3xl font-extrabold text-gray-900 tracking-tight">Questions fréquentes</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                <svg className={clsx('w-5 h-5 text-gray-400 shrink-0 transition-transform', openIndex === i && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              {openIndex === i && <div className="px-5 pb-5"><p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Badge Google Play (official asset)
const PLAYSTORE_BADGE = 'https://play.google.com/intl/en_us/badges/static/images/badges/fr_badge_web_generic.png';

function AppMobile() {
  return (
    <section className="py-20 sm:py-24 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Application mobile</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Kimifinance sur votre smartphone</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">Collectez hors ligne, synchronisez en un clic. L’app est disponible sur le Play Store.</p>
        </div>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
          {/* Espace dédié : mockup mobile avec capture d’écran */}
          <div className="flex-shrink-0">
            <div className="relative w-[280px] sm:w-[300px] mx-auto">
              <div className="aspect-[9/19] max-h-[520px] rounded-[2.5rem] border-[14px] border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
                <img
                  src={IMG.mobile_2}
                  alt="Application Kimifinance sur mobile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          {/* Badge Play Store + CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <p className="text-sm font-medium text-gray-600 mb-4">Téléchargez l’application</p>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
              aria-label="Disponible sur Google Play"
            >
              <img
                src={PLAYSTORE_BADGE}
                alt="Disponible sur Google Play"
                className="h-14 w-auto object-contain"
              />
            </a>
            <p className="mt-4 text-xs text-gray-500 max-w-[260px]">Pour Android. Collecte terrain, synchronisation automatique et tableau de bord à jour.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-3xl p-10 sm:p-16 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Prêt à digitaliser vos collectes ?</h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">Rejoignez les structures qui utilisent Kimifinance pour suivre leurs paiements en toute sérénité.</p>
            <div className="mt-8">
              <Link to={AppRoutes.REGISTER} className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-lg">
                Commencer gratuitement
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/50">Gratuit · Aucune carte requise</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo_collect.png" alt="Kimifinance" className="h-[60px] w-[60px] object-contain shrink-0" />
              <span className="text-lg font-bold">Kimifinance</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">Application de collecte de paiements journaliers par Kimistack.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">Produit</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Comment ça marche</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">Plateforme</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to={AppRoutes.LOGIN} className="hover:text-white transition-colors">Connexion</Link></li>
              <li><Link to={AppRoutes.REGISTER} className="hover:text-white transition-colors">Créer un compte</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">Légal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to={AppRoutes.POLITIQUE_CONFIDENTIALITE} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Politique de confidentialité</Link>
              </li>
              <li>
                <Link to={AppRoutes.CONDITIONS_UTILISATION} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Conditions d'utilisation</Link>
              </li>
              <li><Link to={AppRoutes.CONTACT} className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© Kimistack. Tous droits réservés.</p>
          <p className="text-xs text-gray-600">Fait avec passion</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  useSEO({
    title: 'Accueil',
    description: 'Kimifinance — Collecte de paiements journaliers simplifiée. Gérez vos collecteurs, tournées et tableaux de bord, même hors ligne. Application offline, multi-entreprises.',
  });

  return (
    <div className="min-h-screen bg-white antialiased">
      <Navbar />
      <Hero />
      <Problems />
      <SolutionBlock />
      <Features />
      <Stats />
      <HowItWorks />
      <TrustBlock />
      <FAQ />
      <AppMobile />
      <CTA />
      <Footer />
    </div>
  );
}
