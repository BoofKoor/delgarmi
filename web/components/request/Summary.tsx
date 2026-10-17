import { Lock, Phone, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { PhoneLink } from '@/components/site/Missing';
import { dayLabel } from '@/components/ui';
import { SERVICES } from '@/content/services';
import { answerText, asksStart, asksTimeWindow, fill, formatMobile, isInPerson, normalizeMobile, type FormDefinition } from '@/lib/form';
import type { FormState } from './draft';

type Row = { label: string; value: ReactNode; screen: string };

function rows(def: FormDefinition, s: FormState, today: number | null): Row[] {
  if (!s.service) return [];
  const form = def.services[s.service];
  const out: Row[] = [{ label: 'خدمت', value: SERVICES[s.service].name, screen: 'service' }];
  form.screens.forEach((screen, i) => {
    for (const id of screen.questions) {
      const q = form.questions[id];
      const value = q.control === 'counter' ? answerText(q, s.answers[id] ?? q.default) : answerText(q, s.answers[id]);
      if (value) out.push({ label: q.summary, value, screen: `detail-${i}` });
    }
  });
  if (isInPerson(form, s.answers)) {
    if (s.city) out.push({ label: 'شهر', value: s.neighbourhood.trim() ? `${s.city.name}، ${s.neighbourhood.trim()}` : s.city.name, screen: 'place' });
  } else if (s.answers.session) {
    out.push({ label: 'مکان', value: 'آنلاین', screen: 'place' });
  }
  if (asksStart(form, s.answers) && s.start) {
    const t = def.place.start;
    const value = s.start.kind === 'asap' ? t.asap
      : s.start.kind === 'tomorrow' ? (today !== null ? fill(t.tomorrow, { day: dayLabel(today + 1) }) : null)
      : s.start.date !== null ? dayLabel(s.start.date) : null;
    if (value) out.push({ label: 'شروع', value, screen: 'place' });
  }
  if (asksTimeWindow(form, s.answers) && s.timeWindow) {
    const label = def.place.timeWindow.options.find((o) => o.value === s.timeWindow)?.label;
    if (label) out.push({ label: 'ساعت', value: label, screen: 'place' });
  }
  const name = s.name.trim();
  const mobile = normalizeMobile(s.mobile);
  if (name || mobile) {
    // The number isolated, so its groups read left to right inside Persian text and never break.
    const number = mobile ? <span className="num">{formatMobile(mobile)}</span> : null;
    out.push({ label: 'تماس', value: <>{name}{name && number ? '، ' : null}{number}</>, screen: 'contact' });
  }
  return out;
}

/** Desktop only: every answer so far, each with a way back to its screen. */
export function Summary({ def, state, today, onEdit }: { def: FormDefinition; state: FormState; today: number | null; onEdit: (screen: string) => void }) {
  const list = rows(def, state, today);
  return (
    <aside className="form-aside" aria-labelledby="summary-title">
      <div className="summary">
        <h2 id="summary-title">خلاصه‌ی درخواست</h2>
        {list.length ? (
          <dl>
            {list.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>
                  <span>{r.value}</span>
                  <button type="button" className="link-btn" aria-label={`ویرایش ${r.label}`} onClick={() => onEdit(r.screen)}>ویرایش</button>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="summary-empty">پاسخ‌هایتان اینجا جمع می‌شود تا پیش از ثبت، همه را یک‌جا ببینید.</p>
        )}
      </div>
      <ul className="reassure">
        <li><Lock className="ic" aria-hidden="true" focusable="false" strokeWidth={1.75} /><span>اطلاعات این درخواست را فقط همکاران دلگرمی و مرکزی که معرفی می‌شود می‌بینند.</span></li>
        <li><Smartphone className="ic" aria-hidden="true" focusable="false" strokeWidth={1.75} /><span>پاسخ‌ها روی همین دستگاه ذخیره می‌شوند؛ اگر صفحه بسته شد، از همین‌جا ادامه دهید.</span></li>
        <li><Phone className="ic" aria-hidden="true" focusable="false" strokeWidth={1.75} /><span>سؤالی دارید؟ <PhoneLink /></span></li>
      </ul>
    </aside>
  );
}
