import { ModalDialog } from "./ModalDialog";
import type { Language } from "../i18n/LanguageContext";
import { getLocaleChoiceLabel } from "../services/LocalePreferenceService";

type Props = {
  savedLanguage: Language;
  requestedLanguage: Language;
  onUseSavedLanguage: () => void;
  onUseRequestedLanguage: () => void;
};

const copy = {
  en: {
    title: "Display this link in another language?",
    message: "This link requests a different display language from your saved preference.",
  },
  ja: {
    title: "別の言語でこのリンクを表示しますか？",
    message: "このリンクは、保存されている表示言語とは異なる言語を指定しています。",
  },
} as const;

export function LocaleConflictDialog({
  savedLanguage,
  requestedLanguage,
  onUseSavedLanguage,
  onUseRequestedLanguage,
}: Props) {
  const text = copy[savedLanguage];
  const savedLabel = getLocaleChoiceLabel(savedLanguage, "saved");
  const requestedLabel = getLocaleChoiceLabel(requestedLanguage, "requested");

  return (
    <ModalDialog
      ariaLabelledby="locale-conflict-title"
      onDismiss={onUseSavedLanguage}
      onBackdropDismiss={onUseSavedLanguage}
      className="locale-conflict-dialog"
    >
      <h2 id="locale-conflict-title">{text.title}</h2>
      <p>{text.message}</p>
      <div className="modal-actions">
        <button type="button" lang={savedLabel.lang} onClick={onUseSavedLanguage}>{savedLabel.label}</button>
        <button type="button" lang={requestedLabel.lang} onClick={onUseRequestedLanguage}>{requestedLabel.label}</button>
      </div>
    </ModalDialog>
  );
}
