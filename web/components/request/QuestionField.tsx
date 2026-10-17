import { ChoiceCards, ChoiceChips, Counter, QuestionGroup } from '@/components/ui';
import type { Answer, Question } from '@/lib/form';

/** One question of the form, drawn with the design-system control its definition names. */
export function QuestionField({
  id,
  question,
  value,
  error,
  onChange,
}: {
  id: string;
  question: Question;
  value: Answer | undefined;
  error?: string;
  onChange: (value: Answer) => void;
}) {
  const errorId = `${id}-error`;
  if (question.control === 'counter') {
    const labelId = `${id}-label`;
    return (
      <div className="dg-group" data-field={id}>
        <span className="dg-group-label" id={labelId}>{question.label}</span>
        <Counter
          labelId={labelId}
          min={question.min ?? 1}
          max={question.max ?? 6}
          value={typeof value === 'number' ? value : (question.default ?? question.min ?? 1)}
          onChange={onChange}
        />
      </div>
    );
  }
  const options = question.options ?? [];
  const common = {
    name: id,
    multiple: question.multiple,
    value: value === undefined ? (question.multiple ? [] : null) : (value as string | string[]),
    onChange,
    describedBy: error ? errorId : undefined,
  };
  return (
    <div data-field={id}>
      <QuestionGroup legend={question.label} hideLegend={question.hideLegend} why={question.why} error={error} errorId={errorId}>
        {question.control === 'cards' ? (
          <ChoiceCards {...common} options={options.map((o) => ({ value: o.value, title: o.label, hint: o.hint }))} />
        ) : (
          <ChoiceChips {...common} options={options.map((o) => ({ value: o.value, label: o.label }))} />
        )}
      </QuestionGroup>
    </div>
  );
}
