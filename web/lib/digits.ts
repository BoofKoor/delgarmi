const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

/** Latin digits → Persian digits, for display. */
export function fa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA[Number(d)]);
}

/** Persian or Arabic-Indic digits → Latin digits, for storage and validation. */
export function latin(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}
