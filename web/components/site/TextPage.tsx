import Link from 'next/link';
import type { ReactNode } from 'react';
import { PhoneLink } from './Missing';
import { PageHead } from './PageHead';

export type TocItem = { id: string; label: string };

/**
 * A page of text: the column of text, and beside it on wide screens the page's sections and a
 * small help card. On phones the help card follows the text.
 */
export function TextPage({ title, crumb, lead, toc = [], children, help = true }: {
  title: string;
  crumb?: string;
  lead?: ReactNode;
  toc?: TocItem[];
  children: ReactNode;
  help?: boolean;
}) {
  return (
    <>
      <PageHead title={title} crumb={crumb} lead={lead} />
      <div className="container page-body">
        <div className="text-layout">
          <div className="text-main">{children}</div>
          <aside className="text-aside" aria-label="راهنما">
            {toc.length > 1 ? (
              <nav className="toc" aria-labelledby="toc-title">
                <p className="toc-title" id="toc-title">در این صفحه</p>
                <ul>
                  {toc.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}
                </ul>
              </nav>
            ) : null}
            {help ? (
              <div className="help-card">
                <h2>مراقب یا پرستار لازم دارید؟</h2>
                <p>چند سؤال کوتاه؛ همکار دلگرمی تماس می‌گیرد و تا شروع کار کنارتان است.</p>
                <Link className="dg-btn dg-btn--primary" href="/request">ثبت درخواست</Link>
                <PhoneLink className="dg-btn dg-btn--secondary" withIcon label="تماس با پشتیبانی" button />
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}
