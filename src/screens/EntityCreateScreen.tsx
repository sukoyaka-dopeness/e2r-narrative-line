import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

type EntityCreateScreenProps = {
  onCreate: (name: string, description: string) => void;
  onCancel: () => void;
};

export function EntityCreateScreen({ onCreate, onCancel }: EntityCreateScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const normalizedName = name.trim();

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
        <button type="button" onClick={onCancel}>{ja ? "戻る" : "Back"}</button>
        <button type="button" disabled={normalizedName.length === 0} onClick={() => onCreate(normalizedName, description)}>
          {ja ? "作成して関連付ける" : "Create and Associate"}
        </button>
      </div>
    </div>
  );
}
