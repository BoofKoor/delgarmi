import { checkedProps, type ChoiceBase } from './choice';

export type ChipOption = string | { value: string; label: string };

/** Short one- or two-word options without a description. Wrap in QuestionGroup. */
export function ChoiceChips({ options, ...base }: ChoiceBase & { options: readonly ChipOption[] }) {
  const type = base.multiple ? 'checkbox' : 'radio';
  return (
    <div className="dg-chips">
      {options.map((o) => {
        const value = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        return (
          <label className="dg-chip" key={value}>
            <input type={type} name={base.name} value={value} aria-describedby={base.describedBy} {...checkedProps(base, value)} />
            <span>{label}</span>
          </label>
        );
      })}
    </div>
  );
}
