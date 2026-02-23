import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineBars3, HiOutlineBell, HiOutlineArrowRightOnRectangle, HiOutlineUserCircle } from 'react-icons/hi2';
import { useAuthStore } from '@/core/store/auth.store';
import { useLanguageStore, type Locale } from '@/core/store/language.store';
import i18n from '@/core/i18n';
import { AppRoutes } from '@/config/routes.config';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { locale, setLocale } = useLanguageStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'fr' ? 'fr' : 'en';
    }
  }, [locale]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    i18n.changeLanguage(newLocale);
  };
  const {
    list: notificationList,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <HiOutlineBars3 className="h-6 w-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Langue EN/FR */}
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/80 p-0.5">
          <button
            type="button"
            onClick={() => handleLocaleChange('en')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              locale === 'en'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => handleLocaleChange('fr')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              locale === 'fr'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Français"
          >
            FR
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={notificationButtonRef}
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 relative"
            aria-label={t('header.notifications')}
          >
            <HiOutlineBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown
            list={notificationList}
            unreadCount={unreadCount}
            loading={notificationsLoading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClose={() => setShowNotifications(false)}
            isOpen={showNotifications}
            anchorRef={notificationButtonRef}
          />
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
              {user?.photoProfilUrl ? (
                <img src={user.photoProfilUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.nom?.charAt(0)
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.nom}</span>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.nom}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link
                  to={AppRoutes.PROFIL}
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <HiOutlineUserCircle className="h-4 w-4" />
                  {t('header.profile')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error-500 hover:bg-error-50"
                >
                  <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                  {t('header.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
