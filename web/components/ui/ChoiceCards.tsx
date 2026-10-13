import { cx } from '@/lib/cx';
import { checkedProps, type ChoiceBase } from './choice';

export type CardOption = { value: string; title: string; hint?: string };

/**
 * Large choice cards for options that need a one-line hint. Wrap in QuestionGroup and keep the
 * form column inside `.dg-form`: 2 and 4 options become two columns from 440px, 3 options three
 * columns from 600px, otherwise one column.
 */
export function ChoiceCards({ options, ...base }: ChoiceBase & { options: readonly CardOption[] }) {
  const type = base.multiple ? 'checkbox' : 'radio';
  const columns = options.length >= 2 && options.length <= 4 ? `dg-choices--${options.length}` : undefined;
  return (
    <div className={cx('dg-choices', columns)}>
      {options.map((o) => (
        <label className="dg-choice" key={o.value}>
          <input type={type} name={base.name} value={o.value} aria-describedby={base.describedBy} {...checkedProps(base, o.value)} />
          <span className="dg-choice-title">{o.title}</span>
          {o.hint ? <span className="dg-choice-hint">{o.hint}</span> : null}
        </label>
      ))}
    </div>
  );
}
