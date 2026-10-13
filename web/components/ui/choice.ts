import type { ChangeEvent } from 'react';

/** Props shared by ChoiceChips and ChoiceCards. Without `value` the inputs are uncontrolled. */
export type ChoiceBase = {
  name: string;
  multiple?: boolean;
  value?: string | string[] | null;
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  /** Usually the QuestionGroup's errorId. */
  describedBy?: string;
};

export function checkedProps(base: ChoiceBase, optionValue: string) {
  const { multiple, value, defaultValue, onChange } = base;
  const has = (v: ChoiceBase['value'] | ChoiceBase['defaultValue']) =>
    Array.isArray(v) ? v.includes(optionValue) : v === optionValue;
  if (value === undefined) return { defaultChecked: has(defaultValue) };
  return {
    checked: has(value),
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;
      if (!multiple) return onChange(optionValue);
      const current = Array.isArray(value) ? value : [];
      onChange(e.target.checked ? [...current, optionValue] : current.filter((v) => v !== optionValue));
    },
  };
}
