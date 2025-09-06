import React from 'react';

const Kbd = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 text-xs font-semibold bg-muted text-foreground border border-border rounded">
    {children}
  </kbd>
);

const ShortcutRow = ({ combo, desc }) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="text-sm text-foreground">{desc}</div>
    <div className="space-x-1">
      {combo.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-muted-foreground text-xs">+</span>}
          <Kbd>{k}</Kbd>
        </React.Fragment>
      ))}
    </div>
  </div>
);

const ShortcutsHelp = ({ open, onClose, isMac }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background-overlay" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-background border border-border rounded-xl shadow-elevation-2 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="text-sm text-muted-foreground mb-4">Boost productivity with these quick actions.</div>
        <div className="divide-y divide-border">
          <ShortcutRow combo={[isMac ? '⌘' : 'Ctrl', 'K']} desc="Open Command Palette" />
          <ShortcutRow combo={['/']} desc="Focus Search" />
          <ShortcutRow combo={[isMac ? '⌘' : 'Ctrl', 'S']} desc="Save Workspace/Model" />
          <ShortcutRow combo={['?']} desc="Toggle Shortcuts Help" />
          <ShortcutRow combo={[isMac ? '⌘' : 'Ctrl', 'P']} desc="Quick Navigate" />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">Tip: Press Shift+/ to toggle this help.</div>
      </div>
    </div>
  );
};

export default ShortcutsHelp;

