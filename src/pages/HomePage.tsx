import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <header className="safe-area-top bg-terracotta text-white p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">{t('app.name')}</h1>
          <Link
            to="/settings"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label={t('nav.settings')}
          >
            <SettingsIcon />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md">
          {/* Logo placeholder */}
          <div className="w-32 h-32 mx-auto mb-6 bg-sand rounded-full flex items-center justify-center">
            <span className="text-4xl">🏺</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-earth mb-3">
            {t('home.title')}
          </h2>

          <p className="text-lg text-terracotta font-medium mb-4">
            {t('home.subtitle')}
          </p>

          <p className="text-text-secondary mb-8">
            {t('home.description')}
          </p>

          <Link
            to="/capture"
            className="inline-block bg-terracotta text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-clay transition-colors shadow-lg"
          >
            {t('home.cta')}
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="safe-area-bottom bg-white border-t border-sand">
      <div className="flex justify-around items-center h-16">
        <NavLink to="/" icon={<HomeIcon />} label={t('nav.home')} active />
        <NavLink to="/capture" icon={<CameraIcon />} label={t('nav.capture')} />
        <NavLink to="/gallery" icon={<GalleryIcon />} label={t('nav.gallery')} />
        <NavLink to="/settings" icon={<SettingsIcon />} label={t('nav.settings')} />
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, active = false }: { to: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 px-4 py-2 ${
        active ? 'text-terracotta' : 'text-text-secondary'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}

// Simple SVG icons
function HomeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
