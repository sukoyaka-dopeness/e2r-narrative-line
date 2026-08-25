import { useEffect, useId, useRef, useState } from "react";

type WorkspaceMoreMenuProps = {
  label: string;
  openDatasetLabel: string;
  exportDatasetLabel: string;
  onOpenDataset: () => void;
  onExportDataset: () => void;
};

export function WorkspaceMoreMenu({
  label,
  openDatasetLabel,
  exportDatasetLabel,
  onOpenDataset,
  onExportDataset,
}: WorkspaceMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    firstItemRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const activate = (callback: () => void) => {
    setOpen(false);
    triggerRef.current?.focus();
    callback();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }

    if (event.key === "Tab") {
      setOpen(false);
      return;
    }

    if (items.length === 0) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  };

  return (
    <div className="workspace-more-menu">
      <button
        ref={triggerRef}
        className="workspace-more-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        {label}
      </button>
      {open && (
        <div
          ref={menuRef}
          className="workspace-more-panel"
          id={menuId}
          role="menu"
          onKeyDown={handleMenuKeyDown}
        >
          <button
            ref={firstItemRef}
            className="workspace-more-item"
            type="button"
            role="menuitem"
            onClick={() => activate(onOpenDataset)}
          >
            {openDatasetLabel}
          </button>
          <button
            className="workspace-more-item"
            type="button"
            role="menuitem"
            onClick={() => activate(onExportDataset)}
          >
            {exportDatasetLabel}
          </button>
        </div>
      )}
    </div>
  );
}
