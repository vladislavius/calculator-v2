'use client';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accentColor?: string;
  badge?: string | number;
}

export default function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  accentColor = 'var(--os-aqua)',
  badge,
}: CollapsibleSectionProps) {
  return (
    <div className="os-collapsible">
      <div className="os-collapsible__header" onClick={onToggle}>
        <span className="os-collapsible__arrow">{isOpen ? '▼' : '▶'}</span>
        <span className="os-collapsible__title" style={{ color: accentColor }}>{title}</span>
        {badge !== undefined && (
          <span className="os-collapsible__badge" style={{ background: `${accentColor}22`, color: accentColor }}>
            {badge}
          </span>
        )}
      </div>
      {isOpen && <div className="os-collapsible__body">{children}</div>}
    </div>
  );
}
