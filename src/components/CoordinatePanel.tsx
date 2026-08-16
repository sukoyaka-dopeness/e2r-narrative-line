import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import type { CoreObject } from "../models/CoreObject";
import type { Dataset } from "../models/Dataset";
import {
  isCoordinateWriteSupported,
  readObjectCoordinates,
  type CoordinateWriteStatus,
} from "../services/CoordinateService";

type CoordinatePanelProps = {
  dataset: Dataset;
  object: CoreObject;
  onSaveCoordinate?: (
    spaceId: string,
    values: Record<string, number>,
  ) => CoordinateWriteStatus;
};

function componentLabel(component: { id: string; name?: string }): string {
  return component.name && component.name !== component.id
    ? `${component.name} (${component.id})`
    : component.id;
}

export function CoordinatePanel({
  dataset,
  object,
  onSaveCoordinate,
}: CoordinatePanelProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const result = readObjectCoordinates(dataset, object);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  if (result.status === "absent") return null;

  if (result.status !== "available") {
    return (
      <section
        className="coordinate-panel"
        aria-label={ja ? "座標（実験的）" : "Coordinates (experimental)"}
      >
        <h2>
          {ja ? "座標（実験的）" : "Coordinates (experimental)"}
        </h2>
        <p className="coordinate-panel__notice">
          {result.status === "unsupported"
            ? ja
              ? "このCoordinate形式のバージョンには未対応です。データは変更せず保持されます。"
              : "This Coordinate format version is not supported. Its data remains unchanged."
            : ja
              ? "Coordinate payloadを安全に解釈できません。データは変更せず保持されます。"
              : "The Coordinate payload cannot be interpreted safely. Its data remains unchanged."}
        </p>
      </section>
    );
  }

  const selected = result.coordinates.find(
    ({ spaceId }) => spaceId === selectedSpaceId,
  ) ?? result.coordinates[0];
  if (!selected) return null;

  const canEdit = Boolean(
    onSaveCoordinate && isCoordinateWriteSupported(selected),
  );
  const editableValues = selected.values.filter(
    ({ id }) => id === "x" || id === "y",
  );
  const editing = editingSpaceId === selected.spaceId;
  const parsedDraftValues = Object.fromEntries(
    editableValues.map(({ id }) => [id, Number(draftValues[id])]),
  );
  const draftIsInvalid = editableValues.some(({ id, minimum, maximum }) => {
    const source = draftValues[id];
    const value = Number(source);
    return (
      source === undefined ||
      source.trim() === "" ||
      !Number.isFinite(value) ||
      (minimum !== undefined && value < minimum) ||
      (maximum !== undefined && value > maximum)
    );
  });

  const beginEditing = () => {
    setEditingSpaceId(selected.spaceId);
    setDraftValues(
      Object.fromEntries(
        editableValues.map(({ id, value }) => [id, String(value)]),
      ),
    );
    setFeedback(null);
  };

  const stopEditing = () => {
    setEditingSpaceId(null);
    setDraftValues({});
  };

  const saveCoordinate = () => {
    if (!onSaveCoordinate || draftIsInvalid) return;
    const status = onSaveCoordinate(selected.spaceId, parsedDraftValues);
    if (status === "updated" || status === "unchanged") {
      stopEditing();
    }
    setFeedback(
      status === "updated"
        ? ja
          ? "座標を保存しました。"
          : "Coordinate saved."
        : status === "unchanged"
          ? ja
            ? "座標は変更されていません。"
            : "The Coordinate was unchanged."
          : ja
            ? "この座標は安全に更新できないため、変更しませんでした。"
            : "This Coordinate could not be updated safely and was left unchanged.",
    );
  };

  return (
    <section
      className="coordinate-panel"
      aria-label={ja ? "座標（実験的）" : "Coordinates (experimental)"}
    >
      <div className="coordinate-panel__header">
        <div>
          <h2>
            {ja ? "座標（実験的）" : "Coordinates (experimental)"}
          </h2>
          <p>
            {canEdit
              ? ja
                ? "対応するgraph Spaceに記録されたx/yだけを数値で更新できます。SpaceやComponentは作成しません。"
                : "Existing x/y values in a supported graph Space can be updated numerically. Spaces and Components are not created."
              : ja
                ? "Datasetに保存された論理座標を読み取り専用で表示しています。"
                : "Read-only logical coordinates stored in the Dataset."}
          </p>
        </div>

        {result.coordinates.length > 1 ? (
          <label className="coordinate-panel__space-picker">
            Space
            <select
              value={selected.spaceId}
              disabled={editing}
              onChange={(inputEvent) => {
                setSelectedSpaceId(inputEvent.target.value);
                setFeedback(null);
              }}
            >
              {result.coordinates.map((coordinate) => (
                <option key={coordinate.spaceId} value={coordinate.spaceId}>
                  {coordinate.spaceName ?? coordinate.spaceId}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="coordinate-panel__space-name">
            <span>Space</span>
            <strong>{selected.spaceName ?? selected.spaceId}</strong>
          </div>
        )}
      </div>

      <dl className="coordinate-panel__values">
        {selected.values.map((component) => (
          <div key={component.id}>
            <dt>{componentLabel(component)}</dt>
            <dd>
              {editing && (component.id === "x" || component.id === "y") ? (
                <input
                  type="number"
                  step="any"
                  min={component.minimum}
                  max={component.maximum}
                  aria-label={componentLabel(component)}
                  value={draftValues[component.id] ?? ""}
                  onChange={(inputEvent) =>
                    setDraftValues((current) => ({
                      ...current,
                      [component.id]: inputEvent.target.value,
                    }))
                  }
                />
              ) : (
                component.value
              )}
              {component.unit ? ` ${component.unit}` : ""}
            </dd>
            {component.positiveDirection ? (
              <small>+ {component.positiveDirection}</small>
            ) : null}
          </div>
        ))}
        {selected.missingComponents.map((component) => (
          <div key={component.id}>
            <dt>{componentLabel(component)}</dt>
            <dd className="coordinate-panel__missing">
              {ja ? "未記録" : "Not recorded"}
            </dd>
            {component.positiveDirection ? (
              <small>+ {component.positiveDirection}</small>
            ) : null}
          </div>
        ))}
      </dl>

      <p className="coordinate-panel__identity">
        <code>{selected.spaceId}</code>
        {selected.kind ? <span>{selected.kind}</span> : null}
      </p>

      {canEdit ? (
        <div className="coordinate-panel__actions">
          {editing ? (
            <>
              <button type="button" onClick={stopEditing}>
                {ja ? "キャンセル" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={saveCoordinate}
                disabled={draftIsInvalid}
              >
                {ja ? "座標を保存" : "Save Coordinate"}
              </button>
            </>
          ) : (
            <button type="button" onClick={beginEditing}>
              {ja ? "記録済み座標を編集" : "Edit Recorded Coordinate"}
            </button>
          )}
        </div>
      ) : null}
      {editing && draftIsInvalid ? (
        <p className="coordinate-panel__notice" role="alert">
          {ja
            ? "すべての値を有効な範囲の有限数にしてください。"
            : "Enter a finite number within the allowed range for every value."}
        </p>
      ) : null}
      {feedback ? (
        <p className="coordinate-panel__notice" role="status">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
