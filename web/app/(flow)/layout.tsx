import type { ReactNode } from 'react';
import { FlowShell } from '@/components/site/FlowShell';
import '@/styles/site.css';

/** The request form and «ثبت شد»: the simple frame of the form, without the site header and footer. */
export default function FlowLayout({ children }: { children: ReactNode }) {
  return <FlowShell>{children}</FlowShell>;
}
