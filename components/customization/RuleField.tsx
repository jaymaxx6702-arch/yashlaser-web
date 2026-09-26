"use client";

import type {
  CustomizationFieldRule,
  FieldValue,
} from "@/lib/customization/contract";

export function RuleField({
  field,
  value,
  onChange,
}: {
  field: CustomizationFieldRule;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
}) {
  const label = (
    <>
      {field.label}
      {field.required ? " *" : ""}
    </>
  );

  if (field.kind === "photo" || field.kind === "logo") return null;

  if (field.kind === "choice") {
    const current = typeof value === "string" ? value : "";
    return (
      <label>
        {label}
        <select
          value={current}
          required={field.required}
          onChange={(event) => onChange(event.target.value || null)}
        >
          {!field.required && <option value="">—</option>}
          {(field.choices ?? []).map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.kind === "number") {
    return (
      <label>
        {label}
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={typeof value === "number" ? value : ""}
          required={field.required}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? null : event.target.valueAsNumber,
            )
          }
        />
      </label>
    );
  }

  const current = typeof value === "string" ? value : "";
  const common = {
    minLength: field.minLength,
    maxLength: field.maxLength,
    required: field.required,
    value: current,
  };

  if (field.kind === "text" || field.kind === "qr") {
    return (
      <label>
        {label}
        <textarea
          rows={field.kind === "qr" ? 3 : 2}
          {...common}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (field.kind === "date") {
    return (
      <label>
        {label}
        <input
          type="date"
          {...common}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (field.kind === "color") {
    return (
      <label>
        {label}
        <input
          type="text"
          inputMode="text"
          placeholder="#RRGGBB"
          pattern="#[0-9A-Fa-f]{6}"
          {...common}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  return (
    <label>
      {label}
      <input
        type="text"
        {...common}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
