import { ArrowLeft, Moon, Settings as SettingsIcon, Sun, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

interface HeaderProps {
  subtitle: string;
}

export function Header({ subtitle }: HeaderProps) {
  const { settings, updateSettings } = useAppData();
  const location = useLocation();
  const onSettingsPage = location.pathname.startsWith('/settings');

  const toggleTheme = () => {
    updateSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__mark" aria-hidden="true">
          <Wallet size={20} strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="app-header__title">{settings.appName}</h1>
          <p className="app-header__subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="app-header__actions">
        <button
          type="button"
          className="icon-toggle"
          onClick={toggleTheme}
          aria-label={settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link
          to={onSettingsPage ? '/' : '/settings'}
          className="icon-toggle"
          aria-label={onSettingsPage ? 'Back to dashboard' : 'Open settings'}
          title={onSettingsPage ? 'Back to dashboard' : 'Settings'}
        >
          {onSettingsPage ? <ArrowLeft size={18} /> : <SettingsIcon size={18} />}
        </Link>
      </div>
    </header>
  );
}
