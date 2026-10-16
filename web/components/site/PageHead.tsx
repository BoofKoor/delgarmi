import type { ReactNode } from 'react';
import { Crumbs } from './Crumbs';

/** Breadcrumbs, the page title and its first paragraph, for the text pages. */
export function PageHead({ title, lead, crumb, children }: { title: string; lead?: ReactNode; crumb?: string; children?: ReactNode }) {
  return (
    <>
      <div className="container">
        <Crumbs items={[{ label: crumb ?? title }]} />
      </div>
      <section className="page-head" aria-labelledby="page-title">
        <div className="container">
          <h1 id="page-title">{title}</h1>
          {lead ? <p className="lead">{lead}</p> : null}
          {children}
        </div>
      </section>
    </>
  );
}
