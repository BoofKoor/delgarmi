import { fa } from '@/lib/digits';

/** «مرحله‌ی ۲ از ۴» plus the step name and a bar. The bar is decorative; the text is what screen readers get. */
export function Stepper({ step, total, name }: { step: number; total: number; name: string }) {
  return (
    <div className="dg-steps" role="group" aria-label="پیشرفت فرم">
      <div className="dg-steps-text">
        <span className="dg-steps-count">مرحله‌ی {fa(step)} از {fa(total)}</span>
        <span className="dg-steps-name">{name}</span>
      </div>
      <div className="dg-steps-bar" aria-hidden="true" style={total === 4 ? undefined : { gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i + 1 < step ? 'is-done' : i + 1 === step ? 'is-current' : undefined} />
        ))}
      </div>
    </div>
  );
}
