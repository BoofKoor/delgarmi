import type { Metadata } from 'next';
import { DoneView } from '@/components/request/DoneView';

export const metadata: Metadata = { title: 'درخواست ثبت شد', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** After the form: the tracking code and what happens next, read from the server. */
export default async function DonePage({ searchParams }: Props) {
  const params = await searchParams;
  const code = typeof params.code === 'string' && /^\d{6}$/.test(params.code) ? params.code : null;
  return <DoneView code={code} />;
}
