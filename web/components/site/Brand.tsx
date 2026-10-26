import Link from 'next/link';
import { LogoMark } from '@/components/ui';

/** The mark and the name, linking home. The name is set in Pofak (display-sm), as the design system says. */
export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link className="dg-brand" href="/" aria-label="دلگرمی، صفحه‌ی اول" onClick={onClick}>
      <LogoMark size={44} />
      <span className="dg-brand-name" aria-hidden="true">دلگرمی</span>
    </Link>
  );
}
