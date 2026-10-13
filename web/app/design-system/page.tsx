import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  Button,
  Checkbox,
  ChoiceCards,
  ChoiceChips,
  LogoMark,
  Notice,
  QuestionGroup,
  ServiceCard,
  StatusBadge,
  StatusTimeline,
  Stepper,
  TextField,
} from '@/components/ui';
import tokens from '@/design/tokens.json';
import { STATUS_LABELS, type Status } from '@/lib/statuses';
import { CitySearchDemo, CounterDemo, DatePickerDemo } from './demos';
import './showcase.css';

export const metadata: Metadata = {
  title: 'سیستم طراحی',
  robots: { index: false, follow: false },
};

function Card({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <section className="ds-card" aria-labelledby={`c-${name}`}>
      <header className="ds-card-head">
        <h3 id={`c-${name}`} dir="ltr">{name}</h3>
        <p>{note}</p>
      </header>
      <div className="ds-card-body">{children}</div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ds-group">
      <h2 className="ds-group-title">{title}</h2>
      <div className="ds-grid">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  const typeStyles = tokens.type.groups.flatMap((g) => g.styles.map((s) => ({ ...s, family: g.family })));
  return (
    <main id="main" className="ds-page container">
      <header className="ds-head">
        <LogoMark size={56} />
        <div>
          <h1>سیستم طراحی دلگرمی</h1>
          <p>همه‌ی کامپوننت‌ها در کد سایت، با همان توکن‌ها و همان کلاس‌های سیستم طراحی.</p>
        </div>
      </header>

      <section className="ds-group" aria-labelledby="g-colors">
        <h2 className="ds-group-title" id="g-colors">رنگ‌ها</h2>
        <ul className="ds-swatches">
          {tokens.color.tokens.map((t) => (
            <li key={t.name} className="ds-swatch">
              <span className="ds-swatch-chip" style={{ background: `var(--${t.name})` }} />
              <span className="ds-swatch-name" dir="ltr">{t.name}</span>
              <span className="ds-swatch-value ds-code" dir="ltr">{t.value.startsWith('{') ? `→ ${t.value.slice(1, -1)}` : t.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ds-group" aria-labelledby="g-type">
        <h2 className="ds-group-title" id="g-type">تایپوگرافی</h2>
        <div className="ds-type">
          {typeStyles.map((s) => (
            <div key={s.name} className="ds-type-row">
              <span className="ds-type-meta ds-code" dir="ltr">{s.name} · {s.fontSize} / {s.lineHeight} / {s.fontWeight}</span>
              <span
                className={s.family === 'display' ? 'font-display' : undefined}
                style={{ fontSize: `var(--type-${s.name}-size)`, lineHeight: `var(--type-${s.name}-line)`, fontWeight: `var(--type-${s.name}-weight)` }}
              >
                {s.sample}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Group title="دکمه‌ها">
        <Card name="Button" note="اصلی، ثانویه، روی عکس، غیرفعال، در حال ارسال">
          <div className="ds-row">
            <Button size="lg">درخواست مراقب</Button>
            <Button>مرحله‌ی بعد</Button>
            <Button variant="secondary">مرحله‌ی قبل</Button>
            <Button disabled>ثبت درخواست</Button>
            <Button loading>در حال ثبت</Button>
          </div>
          <div className="ds-row ds-dark">
            <Button>درخواست مراقب</Button>
            <Button variant="on-photo">آشنایی با خدمات</Button>
          </div>
        </Card>
      </Group>

      <Group title="فرم">
        <Card name="TextField" note="عادی، موبایل، خطا">
          <div className="ds-stack">
            <TextField id="tf-name" label="نام و نام خانوادگی" autoComplete="name" defaultValue="مریم احمدی" />
            <TextField id="tf-mobile" label="شماره موبایل" type="tel" inputMode="numeric" autoComplete="tel" ltr placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹" help="کد تأیید به همین شماره پیامک می‌شود." />
            <TextField id="tf-mobile-bad" label="شماره موبایل" type="tel" inputMode="numeric" ltr defaultValue="0912345" error="شماره‌ی موبایل ۱۱ رقم است و با ۰۹ شروع می‌شود." />
          </div>
        </Card>

        <Card name="ChoiceCard" note="انتخاب نوع مراقبت در فرم درخواست">
          <div className="dg-form">
            <QuestionGroup legend="چه نوع مراقبتی لازم دارید؟" className="ds-last">
              <ChoiceCards
                name="care"
                defaultValue="day"
                options={[
                  { value: 'hourly', title: 'ساعتی', hint: 'چند ساعت در روز، چند روز در هفته' },
                  { value: 'day', title: 'روزانه', hint: 'از صبح تا عصر' },
                  { value: 'night', title: 'شبانه', hint: 'از شب تا صبح' },
                  { value: 'live-in', title: 'شبانه‌روزی', hint: 'مراقب در خانه می‌ماند' },
                ]}
              />
            </QuestionGroup>
          </div>
        </Card>

        <Card name="ChoiceChip" note="تک‌انتخابی، چندانتخابی، خطا">
          <QuestionGroup legend="برای چه کسی؟">
            <ChoiceChips name="who" defaultValue="مادر" options={['پدر', 'مادر', 'همسر', 'خودم', 'دیگری']} />
          </QuestionGroup>
          <QuestionGroup legend="سن کودکان">
            <ChoiceChips name="kid-ages" multiple defaultValue={['زیر ۱ سال', '۱ تا ۳ سال']} options={['زیر ۱ سال', '۱ تا ۳ سال', '۳ تا ۶ سال', 'بالای ۶ سال']} />
          </QuestionGroup>
          <QuestionGroup
            legend="مراقب خانم باشد یا آقا؟"
            why="اگر ترجیحی دارید، مرکز را بر همین اساس انتخاب می‌کنیم."
            error="یکی از گزینه‌ها را انتخاب کنید."
            errorId="gender-error"
            className="ds-last"
          >
            <ChoiceChips name="gender" describedBy="gender-error" options={['فرقی نمی‌کند', 'خانم', 'آقا']} />
          </QuestionGroup>
        </Card>

        <Card name="Checkbox" note="رضایت ارسال اطلاعات">
          <div className="ds-stack">
            <Checkbox id="cb-consent" defaultChecked>
              موافقم اطلاعات این درخواست فقط برای مرکزی که معرفی می‌شود فرستاده شود. <a href="#privacy">حریم خصوصی</a>
            </Checkbox>
            <Checkbox id="cb-sms">پیامک‌های پیگیری را دریافت کنم.</Checkbox>
          </div>
        </Card>

        <Card name="Counter" note="تعداد کودکان در فرم پرستار کودک">
          <CounterDemo />
        </Card>

        <Card name="CitySearch" note="فهرست باز، با کیبورد و لمس">
          <CitySearchDemo />
        </Card>

        <Card name="DatePicker" note="مهر ۱۴۰۵؛ امروز ۲۱، انتخاب ۲۶">
          <DatePickerDemo />
        </Card>

        <Card name="Stepper" note="پیشرفت فرم درخواست">
          <Stepper step={2} total={4} name="جزئیات مراقبت" />
        </Card>
      </Group>

      <Group title="محتوا">
        <Card name="ServiceCard" note="کارت خدمت در صفحه‌ی اصلی">
          <ServiceCard
            href="/design-system#c-ServiceCard"
            image="/images/card-elderly.webp"
            alt="مراقب در حال همراهی با سالمندِ روی ویلچر، در نور غروب"
            title="مراقبت سالمند"
            text="همراه و مراقب آموزش‌دیده، ساعتی یا شبانه‌روزی."
          />
        </Card>
      </Group>

      <Group title="بازخورد">
        <Card name="StatusBadge" note="وضعیت‌های درخواست در صفحه‌ی پیگیری و پنل تیم">
          <div className="ds-row">
            {(Object.keys(STATUS_LABELS) as Status[]).map((s) => <StatusBadge key={s} status={s} />)}
          </div>
        </Card>

        <Card name="Notice" note="اطلاع‌رسانی، هشدار، موفقیت، خطا">
          <div className="ds-stack">
            <Notice title="هنوز در یزد مرکز همکار نداریم">
              درخواستتان در لیست انتظار ثبت می‌شود و به محض فعال شدن شهر خبرتان می‌کنیم. <a href="#waitlist">ثبت در لیست انتظار</a>
            </Notice>
            <Notice tone="warning" title="دستور پزشک لازم است">
              برای سرم و تزریق، نسخه یا دستور پزشک را هنگام مراجعه‌ی پرستار آماده داشته باشید.
            </Notice>
            <Notice tone="success" title="درخواست شما ثبت شد">
              کد پیگیری: <span className="num">۱۰۴۵۸۲</span>
            </Notice>
            <Notice tone="danger" title="کد تأیید درست نیست">
              کد ۵ رقمی پیامک‌شده را دوباره وارد کنید یا کد جدید بخواهید.
            </Notice>
          </div>
        </Card>

        <Card name="StatusTimeline" note="انجام‌شده، فعلی، مانده">
          <StatusTimeline
            items={[
              { title: 'جدید', meta: 'سه‌شنبه ۲۱ مهر، ساعت ۱۰:۲۴', state: 'done' },
              { title: 'در حال تماس', meta: 'ساعت ۱۰:۴۰، جزئیات تلفنی کامل شد', state: 'done' },
              { title: 'در حال پیدا کردن مرکز', meta: 'مراکز دارای مجوز اصفهان بررسی می‌شوند', state: 'current' },
              { title: 'معرفی به مرکز', state: 'todo' },
              { title: 'در حال ارائه‌ی خدمت', state: 'todo' },
            ]}
          />
        </Card>
      </Group>
    </main>
  );
}
