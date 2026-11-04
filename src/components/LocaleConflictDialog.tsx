import { ModalDialog } from "./ModalDialog";
import type { Language } from "../i18n/LanguageContext";
import { useRef } from "react";

type Props = {
  savedLanguage: Language;
  requestedLanguage: Language;
  onUseSavedLanguage: () => void;
  onUseRequestedLanguage: () => void;
};

function finishLocaleChoice(action: () => void) {
  action();
  window.requestAnimationFrame(() => {
    if (document.activeElement === document.body) document.querySelector<HTMLElement>("header a, header button")?.focus();
  });
}

export function LocaleConflictDialog({
  savedLanguage,
  requestedLanguage,
  onUseSavedLanguage,
  onUseRequestedLanguage,
}: Props) {
  const savedRef = useRef<HTMLButtonElement>(null);

  return (
    <ModalDialog
      ariaLabelledby="locale-conflict-title"
      ariaDescribedby="locale-conflict-detail"
      initialFocusRef={savedRef}
      onDismiss={() => finishLocaleChoice(onUseSavedLanguage)}
      onBackdropDismiss={() => finishLocaleChoice(onUseSavedLanguage)}
      className="locale-conflict-dialog"
    >
      <h2 id="locale-conflict-title"><span lang="en">Which language would you like to use?</span><span lang="ja">どちらの言語で表示しますか？</span></h2>
      <p id="locale-conflict-detail" className="locale-conflict-help"><span lang="en">Your choice applies to this visit only. Your saved language will not change.</span><span lang="ja">この選択は今回の表示にのみ適用されます。保存済みの言語は変更されません。</span></p>
      <div className="modal-actions">
        {(["en", "ja"] as const).map(language => <button key={language} ref={language === savedLanguage ? savedRef : undefined} type="button" lang={language} onClick={() => finishLocaleChoice(language === requestedLanguage ? onUseRequestedLanguage : onUseSavedLanguage)}>{language === "en" ? "English" : "日本語"}</button>)}
      </div>
    </ModalDialog>
  );
}
