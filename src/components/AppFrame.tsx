import { useState } from "react";
import type { ReactNode } from "react";
import { ModalDialog } from "./ModalDialog";

type AppFrameProps = {
  children: ReactNode;
};

export function AppFrame({ children }: AppFrameProps) {
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  return (
    <div className="app-frame">
      <header className="app-header">
        <span className="app-brand">NarrativeLine</span>
      </header>

      <div className="app-content">{children}</div>

      <footer className="app-footer">
        <small>E2R timeline editor</small>
        <button
          type="button"
          className="credits-button"
          onClick={() => setIsCreditsOpen(true)}
        >
          Credits
        </button>
      </footer>

      {isCreditsOpen && (
        <ModalDialog
          ariaLabelledby="credits-heading"
          onDismiss={() => setIsCreditsOpen(false)}
        >
          <h2 id="credits-heading">Credits</h2>
          <p>NarrativeLine 0.1.0</p>
          <p>Created by sukoyaka-dopeness</p>
          <p>Released 2026-08-06</p>
          <p>
            With gratitude to all the AI systems that contributed to this
            project.
          </p>
          <p>
            <a
              href="https://github.com/sukoyaka-dopeness/e2r-narrative-line"
              target="_blank"
              rel="noreferrer"
            >
              NarrativeLine repository
            </a>
            <br />
            <a
              href="https://github.com/sukoyaka-dopeness/e2r-spec"
              target="_blank"
              rel="noreferrer"
            >
              E2R specification repository
            </a>
          </p>
          <div className="modal-actions">
            <button type="button" onClick={() => setIsCreditsOpen(false)}>
              Close
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
