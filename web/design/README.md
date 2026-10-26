# از سیستم طراحی

این دو فایل کپی بدون تغییر سیستم طراحی دلگرمی (نسخه‌ی ۸، ۴ آبان ۱۴۰۵) هستند:

- `tokens.json` ← `project/tokens.json`
- `components.css` ← `project/components/bundle.css`

اینجا ویرایششان نکن. تغییر را در سیستم طراحی بده و دوباره کپی کن؛ `npm test` اگر CSS متغیری بخواهد که در توکن‌ها نیست، شکست می‌خورد.

متغیرها دو لایه‌اند، مثل خود صفحه‌ی سیستم طراحی:

- `styles/tokens.css` را `scripts/build-tokens.mjs` موقع dev، build و test از `tokens.json` می‌سازد: رنگ‌ها، خانواده‌ی فونت‌ها، فهرست توکن‌ها و فونت‌ها. همان چیزی که صفحه‌ی سیستم طراحی هم می‌سازد.
- بخش ساخته‌شده‌ی بالای `components.css`: سبک‌های متن به شکل متغیر (`--type-…`)، اندازه‌های گوشی (`fontSizeMobile` و `valueMobile`) و حذف حرکت. صفحه‌ی سیستم طراحی این‌ها را نمی‌سازد، پس در خود bundle هستند. بعد از هر تغییر `tokens.json`:

  ```sh
  node scripts/build-tokens.mjs --bundle
  ```

  و بعد `components.css` را در `project/components/bundle.css` سیستم طراحی بگذار. تا این کار نشده، تست واحد «keeps the generated block» شکست می‌خورد.

ویرایش توکن‌ها در خود صفحه‌ی سیستم طراحی ممکن است `fontSizeMobile` و `valueMobile` را از `tokens.json` بیندازد، چون صفحه این دو کلید را نمی‌شناسد. بعد از ویرایش در صفحه، پیش از کپی بررسی کن که سر جایشان هستند؛ تست‌های واحد هم اندازه‌های گوشی را می‌سنجند.
