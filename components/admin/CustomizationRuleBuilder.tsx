"use client";

import { useMemo, useState } from "react";
import { saveCustomizationRuleDraft } from "@/app/admin/customization-rules/actions";
import type {
  CustomizationDefinition,
  CustomizationFieldKind,
  CustomizationFieldRule,
  TemplateId,
} from "@/lib/customization/contract";

const templates: TemplateId[] = [
  "standee",
  "trophy",
  "medal",
  "keychain",
  "id-card",
  "name-plate",
  "keepsake",
];

const scalarKinds: CustomizationFieldKind[] = [
  "text",
  "name",
  "date",
  "qr",
  "color",
  "choice",
  "number",
];

function numberOrUndefined(value: string) {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function updateField(
  definition: CustomizationDefinition,
  index: number,
  patch: Partial<CustomizationFieldRule>,
): CustomizationDefinition {
  return {
    ...definition,
    fields: definition.fields.map((field, fieldIndex) =>
      fieldIndex === index ? { ...field, ...patch } : field,
    ),
  };
}

export function CustomizationRuleBuilder({
  productId,
  productName,
  initialDefinition,
}: {
  productId: string;
  productName: string;
  initialDefinition: CustomizationDefinition;
}) {
  const [definition, setDefinition] =
    useState<CustomizationDefinition>(initialDefinition);
  const fieldIds = useMemo(
    () => definition.fields.map((field) => field.id),
    [definition.fields],
  );
  const hasArtwork = definition.fields.some(
    (field) => field.legacySlot === "artwork",
  );

  function addScalarField() {
    const taken = new Set(fieldIds);
    let n = definition.fields.length + 1;
    while (taken.has("field-" + n)) n += 1;
    setDefinition({
      ...definition,
      fields: [
        ...definition.fields,
        {
          id: "field-" + n,
          kind: "text",
          label: "Additional text",
          required: false,
          maxLength: 180,
        },
      ],
    });
  }

  function addArtworkField() {
    if (hasArtwork) return;
    setDefinition({
      ...definition,
      fields: [
        {
          id: "artwork",
          kind: "photo",
          label: "Photo / logo",
          required: false,
          legacySlot: "artwork",
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          maxBytes: 8 * 1024 * 1024,
          maxPixels: 25_000_000,
          ai: {
            backgroundRemoval: "optional",
            enhancement: "optional",
            smartCrop: "optional",
          },
        },
        ...definition.fields,
      ],
    });
  }

  return (
    <form action={saveCustomizationRuleDraft}>
      <input type="hidden" name="product_id" value={productId} />
      <input
        type="hidden"
        name="definition"
        value={JSON.stringify(definition)}
      />

      <p>
        <strong>{productName}</strong>
        <br />
        <span className="muted">
          {productId} · category {definition.categoryId}
        </span>
      </p>

      <div className="option-fields">
        <label>
          Minimum quantity
          <input
            type="number"
            min={1}
            max={10000}
            value={definition.quantity.min}
            onChange={(event) =>
              setDefinition({
                ...definition,
                quantity: {
                  ...definition.quantity,
                  min: event.target.valueAsNumber || 1,
                },
              })
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
              setDefinition({
                ...definition,
                quantity: {
                  ...definition.quantity,
                  max: event.target.valueAsNumber || 1,
                },
              })
            }
          />
        </label>
      </div>

      <fieldset>
        <legend>Preview templates</legend>
        <div className="option-fields">
          {templates.map((template) => (
            <label className="consent" key={template}>
              <input
                type="checkbox"
                checked={definition.templates.includes(template)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...definition.templates, template]
                    : definition.templates.filter(
                        (current) => current !== template,
                      );
                  setDefinition({ ...definition, templates: next });
                }}
              />
              <span>{template}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <h3>Fields</h3>
      <div className="admin-list">
        {definition.fields.map((field, index) => {
          const artwork = field.legacySlot === "artwork";
          const visibility = field.visibility?.[0];
          return (
            <article className="admin-card" key={field.id + "-" + index}>
              <div className="option-fields">
                <label>
                  Field ID
                  <input
                    value={field.id}
                    maxLength={80}
                    onChange={(event) =>
                      setDefinition(
                        updateField(definition, index, {
                          id: event.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-")
                            .replace(/^-+/, "")
                            .slice(0, 80),
                        }),
                      )
                    }
                  />
                </label>
                <label>
                  Type
                  <select
                    value={field.kind}
                    onChange={(event) =>
                      setDefinition(
                        updateField(definition, index, {
                          kind: event.target.value as CustomizationFieldKind,
                        }),
                      )
                    }
                  >
                    {(artwork
                      ? (["photo", "logo"] as CustomizationFieldKind[])
                      : scalarKinds
                    ).map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Label
                  <input
                    value={field.label}
                    maxLength={100}
                    onChange={(event) =>
                      setDefinition(
                        updateField(definition, index, {
                          label: event.target.value,
                        }),
                      )
                    }
                  />
                </label>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) =>
                      setDefinition(
                        updateField(definition, index, {
                          required: event.target.checked,
                        }),
                      )
                    }
                  />
                  <span>Required</span>
                </label>
              </div>

              {(field.kind === "text" ||
                field.kind === "name" ||
                field.kind === "qr") && (
                <div className="option-fields">
                  <label>
                    Minimum characters
                    <input
                      type="number"
                      min={0}
                      max={2000}
                      value={field.minLength ?? ""}
                      onChange={(event) =>
                        setDefinition(
                          updateField(definition, index, {
                            minLength: numberOrUndefined(event.target.value),
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Maximum characters
                    <input
                      type="number"
                      min={0}
                      max={2000}
                      value={field.maxLength ?? ""}
                      onChange={(event) =>
                        setDefinition(
                          updateField(definition, index, {
                            maxLength: numberOrUndefined(event.target.value),
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {field.kind === "number" && (
                <div className="option-fields">
                  <label>
                    Minimum value
                    <input
                      type="number"
                      value={field.min ?? ""}
                      onChange={(event) =>
                        setDefinition(
                          updateField(definition, index, {
                            min: numberOrUndefined(event.target.value),
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Maximum value
                    <input
                      type="number"
                      value={field.max ?? ""}
                      onChange={(event) =>
                        setDefinition(
                          updateField(definition, index, {
                            max: numberOrUndefined(event.target.value),
                          }),
                        )
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
                      setDefinition(
                        updateField(definition, index, {
                          choices: event.target.value
                            .split("\n")
                            .map((choice) => choice.trim())
                            .filter(Boolean),
                        }),
                      )
                    }
                  />
                </label>
              )}

              {artwork && (
                <>
                  <div className="option-fields">
                    <label>
                      Maximum file size (MB)
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={
                          field.maxBytes
                            ? Math.round(field.maxBytes / 1024 / 1024)
                            : ""
                        }
                        onChange={(event) => {
                          const mb = numberOrUndefined(event.target.value);
                          setDefinition(
                            updateField(definition, index, {
                              maxBytes:
                                mb === undefined
                                  ? undefined
                                  : Math.round(mb * 1024 * 1024),
                            }),
                          );
                        }}
                      />
                    </label>
                    <label>
                      Maximum megapixels
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={
                          field.maxPixels
                            ? Math.round(field.maxPixels / 1_000_000)
                            : ""
                        }
                        onChange={(event) => {
                          const mp = numberOrUndefined(event.target.value);
                          setDefinition(
                            updateField(definition, index, {
                              maxPixels:
                                mp === undefined
                                  ? undefined
                                  : Math.round(mp * 1_000_000),
                            }),
                          );
                        }}
                      />
                    </label>
                  </div>
                  <div className="option-fields">
                    {(
                      [
                        ["backgroundRemoval", "Background removal"],
                        ["enhancement", "Enhancement"],
                        ["smartCrop", "Smart crop"],
                      ] as const
                    ).map(([key, label]) => (
                      <label className="consent" key={key}>
                        <input
                          type="checkbox"
                          checked={field.ai?.[key] === "optional"}
                          onChange={(event) =>
                            setDefinition(
                              updateField(definition, index, {
                                ai: {
                                  backgroundRemoval:
                                    field.ai?.backgroundRemoval ?? "disabled",
                                  enhancement:
                                    field.ai?.enhancement ?? "disabled",
                                  smartCrop:
                                    field.ai?.smartCrop ?? "disabled",
                                  [key]: event.target.checked
                                    ? "optional"
                                    : "disabled",
                                },
                              }),
                            )
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {!artwork && (
                <div className="option-fields">
                  <label>
                    Conditional visibility
                    <select
                      value={visibility?.operator ?? ""}
                      onChange={(event) => {
                        const operator = event.target.value;
                        setDefinition(
                          updateField(definition, index, {
                            visibility: operator
                              ? [
                                  {
                                    fieldId:
                                      visibility?.fieldId ||
                                      fieldIds.find((id) => id !== field.id) ||
                                      "",
                                    operator: operator as
                                      | "present"
                                      | "not-present",
                                  },
                                ]
                              : undefined,
                          }),
                        );
                      }}
                    >
                      <option value="">Always visible</option>
                      <option value="present">Show when field is present</option>
                      <option value="not-present">
                        Show when field is not present
                      </option>
                    </select>
                  </label>
                  {visibility && (
                    <label>
                      Depends on field
                      <select
                        value={visibility.fieldId}
                        onChange={(event) =>
                          setDefinition(
                            updateField(definition, index, {
                              visibility: [
                                {
                                  ...visibility,
                                  fieldId: event.target.value,
                                },
                              ],
                            }),
                          )
                        }
                      >
                        {fieldIds
                          .filter((id) => id !== field.id)
                          .map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setDefinition({
                    ...definition,
                    fields: definition.fields.filter(
                      (_, fieldIndex) => fieldIndex !== index,
                    ),
                  })
                }
              >
                Remove field
              </button>
            </article>
          );
        })}
      </div>

      <div className="editor-toolbar">
        <button type="button" onClick={addScalarField}>
          Add field
        </button>
        {!hasArtwork && (
          <button type="button" onClick={addArtworkField}>
            Add photo / logo field
          </button>
        )}
      </div>

      <details>
        <summary>Advanced JSON preview</summary>
        <pre>{JSON.stringify(definition, null, 2)}</pre>
      </details>

      <p className="muted">
        Save creates a new draft revision. Nothing changes on the customer
        storefront until that revision is explicitly published.
      </p>
      <button type="submit">Save draft revision</button>
    </form>
  );
}
