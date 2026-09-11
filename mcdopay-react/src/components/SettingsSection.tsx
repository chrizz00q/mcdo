import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsSectionProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({ icon: Icon, title, description, children }: SettingsSectionProps) {
  return (
    <section className="card settings-section">
      <div className="settings-section__header">
        <div className="settings-section__icon">
          <Icon size={17} />
        </div>
        <div>
          <h2>{title}</h2>
          {description && <p className="settings-section__description">{description}</p>}
        </div>
      </div>
      <div className="settings-section__body">{children}</div>
    </section>
  );
}
