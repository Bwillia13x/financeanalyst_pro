import PropTypes from 'prop-types';
import { useEffect } from 'react';

import Icon from '../AppIcon';
import Button from '../ui/Button';

const ShortcutsOverlay = ({ isOpen, onClose, categories, formatKeyCombo }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const Section = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <section className="mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</h3>
        <ul className="divide-y divide-border rounded-md overflow-hidden border border-border">
          {items.map((s) => (
            <li key={`${s.key}-${s.action}`} className="flex items-center justify-between px-3 py-2 bg-card/60">
              <span className="text-sm text-foreground/90">{s.description || s.action}</span>
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                {formatKeyCombo(s.key)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  Section.propTypes = {
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string.isRequired, action: PropTypes.string, description: PropTypes.string })
    )
  };

  return (
    <div className="fixed inset-0 z-[1200]">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="absolute left-1/2 top-20 -translate-x-1/2 w-[min(720px,92vw)] bg-popover text-popover-foreground border border-border rounded-xl shadow-elevation-3"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon name="Keyboard" size={18} />
            <h2 id="shortcuts-title" className="text-sm font-semibold">Keyboard Shortcuts</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Esc</kbd>
            <span>to close</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close shortcuts"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
          <Section title="General" items={categories.general} />
          <Section title="Navigation" items={categories.navigation} />
          <Section title="Analysis" items={categories.analysis} />
          <Section title="Data" items={categories.data} />
          <Section title="View" items={categories.view} />
          <Section title="Quick" items={categories.quick} />
        </div>
      </div>
    </div>
  );
};

ShortcutsOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.shape({
    general: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string.isRequired, action: PropTypes.string, description: PropTypes.string })
    ),
    navigation: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string.isRequired, action: PropTypes.string, description: PropTypes.string })
    ),
    analysis: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string.isRequired, action: PropTypes.string, description: PropTypes.string })
    ),
    data: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string.isRequired, action: PropTypes.string, description: PropTypes.string })
    ),
    view: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string.isRequired, action: PropTypes.string, description: PropTypes.string })
    ),
    quick: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string.isRequired, action: PropTypes.string, description: PropTypes.string })
    )
  }).isRequired,
  formatKeyCombo: PropTypes.func.isRequired
};

export default ShortcutsOverlay;
