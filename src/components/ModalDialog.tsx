import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type RefObject,
  type ReactNode,
} from "react";

type ModalDialogProps = {
  ariaLabelledby: string;
  children: ReactNode;
  onDismiss: () => void;
  onBackdropDismiss?: () => void;
  className?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
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
  onBackdropDismiss,
  className,
  initialFocusRef,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstFocusableElement =
      initialFocusRef?.current ?? (dialog && getFocusableElements(dialog).at(0));

    firstFocusableElement?.focus();

    return () => {
      if (openerRef.current?.isConnected) {
        openerRef.current.focus();
      }
    };
  }, [initialFocusRef]);

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
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onBackdropDismiss?.();
      }}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={className ? `modal-dialog ${className}` : "modal-dialog"}
      >
        {children}
      </section>
    </div>
  );
}
