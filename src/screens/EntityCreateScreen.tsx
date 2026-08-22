import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { getDetailDiscardCopy } from "../services/DetailDiscardCopyService";

type EntityCreateScreenProps = {
  onCreate: (name: string, description: string) => void;
  onPendingWorkChange: (pending: boolean) => void;
  pendingDraft?: EntityCreateDraft;
  onDraftChange: (draft: EntityCreateDraft) => void;
  onClearDraft: () => void;
  onCancel: () => void;
};

export type EntityCreateDraft = { name: string; description: string };

export function EntityCreateScreen({ onCreate, onCancel, onPendingWorkChange, pendingDraft, onDraftChange, onClearDraft }: EntityCreateScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const [name, setName] = useState(pendingDraft?.name ?? "");
  const [description, setDescription] = useState(pendingDraft?.description ?? "");
  const normalizedName = name.trim();
  const disposingDraftRef = useRef(false);

  useEffect(() => {
    const pending = normalizedName.length > 0 || description.length > 0;
    onPendingWorkChange(pending);
    if (pending && !disposingDraftRef.current) onDraftChange({ name, description });
    else onClearDraft();
  }, [normalizedName, description, name, onPendingWorkChange, onDraftChange, onClearDraft]);

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <h1>{ja ? "新しいエンティティを作成" : "Create New Entity"}</h1>
        <p>{ja ? "作成したエンティティを、このできごとに関連付けます。" : "The new Entity will be associated with this Event."}</p>
      </div>

      <div>
        <label>{ja ? "名前" : "Name"}</label>
        <br />
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={ja ? "人物・組織・場所などを入力してください" : "Enter a person, organization, place, or other entity"}
        />
      </div>

      <br />

      <div>
        <label>{ja ? "説明" : "Description"}</label>
        <br />
        <textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>

      <div className="detail-primary-actions">
        <div className="detail-primary-actions__primary">
          <button type="button" disabled={normalizedName.length === 0} onClick={() => { disposingDraftRef.current = true; onClearDraft(); onCreate(normalizedName, description); }}>
            {ja ? "作成して関連付ける" : "Create and Associate"}
          </button>
        </div>
        <div className="detail-primary-actions__exit">
          <button className="danger-action" type="button" onClick={() => { disposingDraftRef.current = true; onClearDraft(); onCancel(); }}>{getDetailDiscardCopy(language, "entity-create-draft")}</button>
        </div>
      </div>
    </div>
  );
}
