"use client";

import { useMemo, useState } from "react";
import type {
  AiFieldPolicy,
  CustomizationDefinition,
  CustomizationFieldKind,
  CustomizationFieldRule,
  FieldVisibilityRule,
  LegacySlot,
  TemplateId,
} from "@/lib/customization/contract";

const kinds: readonly CustomizationFieldKind[] = [
  "photo",
  "logo",
  "text",
  "name",
  "date",
  "qr",
  "color",
  "choice",
  "number",
];

const templates: readonly TemplateId[] = [
  "standee",
  "trophy",
  "medal",
  "keychain",
  "id-card",
  "name-plate",
  "keepsake",
];

const slots: readonly LegacySlot[] = ["artwork", "text-1", "text-2"];

const defaultAi: AiFieldPolicy = {
  backgroundRemoval: "optional",
  enhancement: "optional",
  smartCrop: "optional",
};

function cloneDefinition(definition: CustomizationDefinition) {
  return JSON.parse(JSON.stringify(definition)) as CustomizationDefinition;
}

function nextFieldId(fields: readonly CustomizationFieldRule[]) {
  let n = fields.length + 1;
  while (fields.some((field) => field.id === "field-" + n)) n++;
  return "field-" + n;
}

function fieldForKind(
  field: CustomizationFieldRule,
  kind: CustomizationFieldKind,
): CustomizationFieldRule {
  const base: CustomizationFieldRule = {
    id: field.id,
    kind,
    label: field.label,
    required: field.required,
    ...(field.visibility ? { visibility: field.visibility } : {}),
  };

  if (kind === "photo" || kind === "logo")
    return {
      ...base,
      legacySlot: "artwork",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: 8 * 1024 * 1024,
      maxPixels: 25_000_000,
      ai: defaultAi,
    };

  if (kind === "text" || kind === "name" || kind === "date" || kind === "qr")
    return {
      ...base,
      ...(field.legacySlot === "text-1" || field.legacySlot === "text-2"
        ? { legacySlot: field.legacySlot }
        : {}),
      minLength: field.minLength ?? 0,
      maxLength: field.maxLength ?? (kind === "qr" ? 1000 : 180),
    };

  if (kind === "choice")
    return { ...base, choices: field.choices?.length ? field.choices : ["Option 1"] };

  if (kind === "number")
    return {
      ...base,
      ...(field.min !== undefined ? { min: field.min } : {}),
      ...(field.max !== undefined ? { max: field.max } : {}),
    };

  return base;
}

export function CustomizationRuleBuilder({
  productId,
  initialDefinition,
  latestDraftRevision,
  publishedRevision,
}: {
  productId: string;
  initialDefinition: CustomizationDefinition;
  latestDraftRevision?: number | null;
  publishedRevision?: number | null;
}) {
  const [definition, setDefinition] = useState(() =>
    cloneDefinition(initialDefinition),
  );
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const fieldIds = useMemo(
    () => definition.fields.map((field) => field.id),
    [definition.fields],
  );

  const updateField = (
    index: number,
    updater: (field: CustomizationFieldRule) => CustomizationFieldRule,
  ) =>
    setDefinition((current) => ({
      ...current,
      fields: current.fields.map((field, i) =>
        i === index ? updater(field) : field,
      ),
    }));

  const setVisibility = (
    fieldIndex: number,
    rules: readonly FieldVisibilityRule[],
  ) =>
    updateField(fieldIndex, (field) => ({
      ...field,
      ...(rules.length ? { visibility: rules } : { visibility: undefined }),
    }));

  async function save(ruleStatus: "draft" | "published") {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/customization-rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          status: ruleStatus,
          definition,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        rule?: { revision?: number; status?: string };
      };
      if (!response.ok) throw new Error(data.error || "Unable to save rule.");
      setStatus(
        `${ruleStatus === "published" ? "Published" : "Draft saved"} as revision ${data.rule?.revision ?? "?"}.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save rule.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card">
      <div className="admin-top">
        <div>
          <h2>Customization Rule Builder</h2>
          <p>
            Product: <code>{productId}</code>
          </p>
          <small>
            Published revision: {publishedRevision ?? "none"} · Latest draft:{" "}
            {latestDraftRevision ?? "none"}
          </small>
        </div>
        <div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save("draft")}
          >
            Save Draft
          </button>{" "}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save("published")}
          >
            Publish
          </button>
        </div>
      </div>

      {status && (
        <p role={status.includes("Unable") || status.includes("Invalid") ? "alert" : "status"}>
          {status}
        </p>
      )}

      <div className="admin-rule-grid">
        <label>
          Minimum quantity
          <input
            type="number"
            min={1}
            max={10000}
            value={definition.quantity.min}
            onChange={(event) =>
              setDefinition((current) => ({
                ...current,
                quantity: {
                  ...current.quantity,
                  min: Number(event.target.value) || 1,
                },
              }))
            }
          />
        </label>
        <label>
          Maximum quantity
          <input
            type="number"
            min={1}
            max={10000}
            value={definition.quantity.max}
            onChange={(event) =>
              setDefinition((current) => ({
                ...current,
                quantity: {
                  ...current.quantity,
                  max: Number(event.target.value) || 1,
                },
              }))
            }
          />
        </label>
      </div>

      <fieldset className="admin-rule-fieldset">
        <legend>Preview templates</legend>
        <div className="admin-rule-checks">
          {templates.map((template) => (
            <label key={template}>
              <input
                type="checkbox"
                checked={definition.templates.includes(template)}
                onChange={(event) =>
                  setDefinition((current) => ({
                    ...current,
                    templates: event.target.checked
                      ? [...current.templates, template]
                      : current.templates.filter((item) => item !== template),
                  }))
                }
              />
              {template}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="admin-top">
        <h2>Fields</h2>
        <button
          type="button"
          onClick={() =>
            setDefinition((current) => ({
              ...current,
              fields: [
                ...current.fields,
                {
                  id: nextFieldId(current.fields),
                  kind: "text",
                  label: "New field",
                  required: false,
                  minLength: 0,
                  maxLength: 180,
                },
              ],
            }))
          }
        >
          Add Field
        </button>
      </div>

      {definition.fields.map((field, index) => (
        <section className="admin-rule-field" key={index}>
          <div className="admin-rule-grid">
            <label>
              Field ID
              <input
                value={field.id}
                maxLength={80}
                onChange={(event) =>
                  updateField(index, (current) => ({
                    ...current,
                    id: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  }))
                }
              />
            </label>
            <label>
              Label
              <input
                value={field.label}
                maxLength={100}
                onChange={(event) =>
                  updateField(index, (current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Type
              <select
                value={field.kind}
                onChange={(event) =>
                  updateField(index, (current) =>
                    fieldForKind(
                      current,
                      event.target.value as CustomizationFieldKind,
                    ),
                  )
                }
              >
                {kinds.map((kind) => (
                  <option value={kind} key={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Legacy slot
              <select
                value={field.legacySlot ?? ""}
                onChange={(event) =>
                  updateField(index, (current) => {
                    const value = event.target.value as LegacySlot | "";
                    return value
                      ? { ...current, legacySlot: value }
                      : { ...current, legacySlot: undefined };
                  })
                }
              >
                <option value="">None</option>
                {slots.map((slot) => (
                  <option value={slot} key={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="admin-rule-inline">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(event) =>
                updateField(index, (current) => ({
                  ...current,
                  required: event.target.checked,
                }))
              }
            />
            Required
          </label>

          {(["text", "name", "date", "qr"] as const).includes(
            field.kind as "text" | "name" | "date" | "qr",
          ) && (
            <div className="admin-rule-grid">
              <label>
                Minimum length
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={field.minLength ?? 0}
                  onChange={(event) =>
                    updateField(index, (current) => ({
                      ...current,
                      minLength: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Maximum length
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={field.maxLength ?? 180}
                  onChange={(event) =>
                    updateField(index, (current) => ({
                      ...current,
                      maxLength: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
            </div>
          )}

          {field.kind === "number" && (
            <div className="admin-rule-grid">
              <label>
                Minimum number
                <input
                  type="number"
                  value={field.min ?? ""}
                  onChange={(event) =>
                    updateField(index, (current) => ({
                      ...current,
                      min:
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Maximum number
                <input
                  type="number"
                  value={field.max ?? ""}
                  onChange={(event) =>
                    updateField(index, (current) => ({
                      ...current,
                      max:
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
          )}

          {field.kind === "choice" && (
            <label>
              Choices (one per line)
              <textarea
                rows={5}
                value={(field.choices ?? []).join("\n")}
                onChange={(event) =>
                  updateField(index, (current) => ({
                    ...current,
                    choices: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </label>
          )}

          {(field.kind === "photo" || field.kind === "logo") && (
            <>
              <div className="admin-rule-grid">
                <label>
                  Max file size (MB)
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={Math.round((field.maxBytes ?? 8 * 1024 * 1024) / 1024 / 1024)}
                    onChange={(event) =>
                      updateField(index, (current) => ({
                        ...current,
                        maxBytes:
                          Math.max(1, Number(event.target.value) || 1) *
                          1024 *
                          1024,
                      }))
                    }
                  />
                </label>
                <label>
                  Max megapixels
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={Math.round((field.maxPixels ?? 25_000_000) / 1_000_000)}
                    onChange={(event) =>
                      updateField(index, (current) => ({
                        ...current,
                        maxPixels:
                          Math.max(1, Number(event.target.value) || 1) *
                          1_000_000,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="admin-rule-grid">
                {(
                  [
                    ["backgroundRemoval", "Background removal"],
                    ["enhancement", "Enhancement"],
                    ["smartCrop", "Smart crop"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <select
                      value={field.ai?.[key] ?? "disabled"}
                      onChange={(event) =>
                        updateField(index, (current) => ({
                          ...current,
                          ai: {
                            ...(current.ai ?? defaultAi),
                            [key]: event.target.value as "disabled" | "optional",
                          },
                        }))
                      }
                    >
                      <option value="disabled">Disabled</option>
                      <option value="optional">Optional</option>
                    </select>
                  </label>
                ))}
              </div>
            </>
          )}

          <fieldset className="admin-rule-fieldset">
            <legend>Conditional visibility</legend>
            {(field.visibility ?? []).map((rule, ruleIndex) => (
              <div className="admin-rule-grid" key={ruleIndex}>
                <label>
                  Depends on
                  <select
                    value={rule.fieldId}
                    onChange={(event) => {
                      const rules = [...(field.visibility ?? [])];
                      rules[ruleIndex] = {
                        ...rule,
                        fieldId: event.target.value,
                      };
                      setVisibility(index, rules);
                    }}
                  >
                    <option value="">Select field</option>
                    {fieldIds
                      .filter((id) => id !== field.id)
                      .map((id) => (
                        <option value={id} key={id}>
                          {id}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Condition
                  <select
                    value={rule.operator}
                    onChange={(event) => {
                      const operator = event.target
                        .value as FieldVisibilityRule["operator"];
                      const rules = [...(field.visibility ?? [])];
                      rules[ruleIndex] = {
                        fieldId: rule.fieldId,
                        operator,
                        ...(operator === "equals" || operator === "not-equals"
                          ? { value: rule.value ?? "" }
                          : {}),
                      };
                      setVisibility(index, rules);
                    }}
                  >
                    <option value="equals">Equals</option>
                    <option value="not-equals">Does not equal</option>
                    <option value="present">Is present</option>
                    <option value="not-present">Is not present</option>
                  </select>
                </label>
                {(rule.operator === "equals" ||
                  rule.operator === "not-equals") && (
                  <label>
                    Value
                    <input
                      value={String(rule.value ?? "")}
                      onChange={(event) => {
                        const rules = [...(field.visibility ?? [])];
                        rules[ruleIndex] = {
                          ...rule,
                          value: event.target.value,
                        };
                        setVisibility(index, rules);
                      }}
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setVisibility(
                      index,
                      (field.visibility ?? []).filter((_, i) => i !== ruleIndex),
                    )
                  }
                >
                  Remove condition
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setVisibility(index, [
                  ...(field.visibility ?? []),
                  {
                    fieldId: fieldIds.find((id) => id !== field.id) ?? "",
                    operator: "present",
                  },
                ])
              }
            >
              Add condition
            </button>
          </fieldset>

          <button
            type="button"
            onClick={() =>
              setDefinition((current) => ({
                ...current,
                fields: current.fields.filter((_, i) => i !== index),
              }))
            }
          >
            Remove Field
          </button>
        </section>
      ))}
    </div>
  );
}
