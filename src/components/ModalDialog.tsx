import {
  useEffect,
  useRef,
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
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
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

  useEffect(() => {
    const handleModalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = getFocusableElements(dialog);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements.at(-1)!;
      const activeElement = document.activeElement;
      const hasFocusableFocus = focusableElements.includes(activeElement as HTMLElement);

      if (
        event.shiftKey &&
        (activeElement === firstFocusableElement || !hasFocusableFocus)
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === lastFocusableElement || !hasFocusableFocus)
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };
    document.addEventListener("keydown", handleModalKeyDown, true);
    return () => document.removeEventListener("keydown", handleModalKeyDown, true);
  }, [onDismiss]);

  return (
    <div
      className={onBackdropDismiss ? "modal-backdrop modal-backdrop--dismissible" : "modal-backdrop"}
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
        className={className ? `modal-dialog ${className}` : "modal-dialog"}
      >
        {children}
      </section>
    </div>
  );
}
