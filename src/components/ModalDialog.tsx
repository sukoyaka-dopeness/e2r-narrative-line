import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type ModalDialogProps = {
  ariaLabelledby: string;
  children: ReactNode;
  onDismiss: () => void;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function ModalDialog({
  ariaLabelledby,
  children,
  onDismiss,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstFocusableElement =
      dialog && getFocusableElements(dialog).at(0);

    firstFocusableElement?.focus();

    return () => {
      if (openerRef.current?.isConnected) {
        openerRef.current.focus();
      }
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onDismiss();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusableElements = getFocusableElements(dialog);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements.at(-1)!;

    if (
      event.shiftKey &&
      (document.activeElement === firstFocusableElement ||
        !dialog.contains(document.activeElement))
    ) {
      event.preventDefault();
      lastFocusableElement.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === lastFocusableElement ||
        !dialog.contains(document.activeElement))
    ) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        padding: "1rem",
        backgroundColor: "rgb(0 0 0 / 35%)",
      }}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{
          width: "min(100%, 28rem)",
          padding: "1rem",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          color: "var(--text)",
          backgroundColor: "var(--bg)",
        }}
      >
        {children}
      </section>
    </div>
  );
}
