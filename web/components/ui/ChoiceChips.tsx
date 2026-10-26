import type { LucideIcon } from 'lucide-react';
import { checkedProps, type ChoiceBase } from './choice';

export type ChipOption = string | { value: string; label: string; icon?: LucideIcon };

/**
 * Short one- or two-word options without a description. Wrap in QuestionGroup. A chosen chip
 * gets the check mark from the stylesheet; an option's own icon (if any) shows until then.
 */
export function ChoiceChips({ options, ...base }: ChoiceBase & { options: readonly ChipOption[] }) {
  const type = base.multiple ? 'checkbox' : 'radio';
  return (
    <div className="dg-chips">
      {options.map((o) => {
        const value = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const Icon = typeof o === 'string' ? undefined : o.icon;
        return (
          <label className="dg-chip" key={value}>
            <input type={type} name={base.name} value={value} aria-describedby={base.describedBy} {...checkedProps(base, value)} />
            <span>
              {Icon ? <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} /> : null}
              {label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
