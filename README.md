# دلگرمی

سایت و پنل تیم دلگرمی (delgarmi.com). معماری، مدل داده و مراحل ساخت در سند «دلگرمی — پیشنهاد فنی (قدم ۴)» آمده است.

| پوشه | چیست |
| --- | --- |
| `web/` | سایت: Next.js 16.3، React 19.3، TypeScript |
| `api/` | API و پنل تیم: Django 5.2، Django REST Framework 3.18، Python 3.13 |
| `deploy/` | تنظیمات nginx و اسکریپت انتشار |
| `docker-compose.yml` | پنج سرویس روی یک سرور: nginx، web، api، worker، db |

## اجرای محلی

سایت:

```bash
cd web
npm ci
npm run dev          # http://localhost:3000 ، کامپوننت‌ها: /design-system
```

بک‌اند (به PostgreSQL نیاز دارد):

```bash
docker run -d --name delgarmi-db -e POSTGRES_DB=delgarmi -e POSTGRES_USER=delgarmi -e POSTGRES_PASSWORD=local -p 127.0.0.1:5432:5432 postgres:18-alpine
cd api
python3.13 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
export DJANGO_DEBUG=1 PANEL_PATH=panel-local POSTGRES_HOST=127.0.0.1 POSTGRES_PASSWORD=local
python manage.py migrate && python manage.py runserver   # پنل: http://localhost:8000/panel-local/
```

## تست‌ها

```bash
cd web && npm test && npm run build && npx playwright install chromium && npm run test:e2e
cd api && python -m pytest        # با همان متغیرهای PostgreSQL بالا
```

GitHub Actions همین‌ها را روی هر push و Pull Request اجرا می‌کند: تست‌های واحد، ساخت با بررسی TypeScript، تست مرورگر (axe، کیبورد، ده عرض صفحه، روی دسکتاپ و گوشی) و تست‌های Django با PostgreSQL 18.

## سرور و انتشار

نصب سرور یک دستور است. روی یک سرور خالی Ubuntu یا Debian، با root:

```bash
bash install-delgarmi.sh
```

`install-delgarmi.sh` همان `deploy/install.sh` است. خروجی‌اش انگلیسی است و این کارها را خودش انجام می‌دهد:

- نصب Docker و افزودن swap روی سرورهای کم‌رم
- باز کردن ۸۰ و ۴۴۳ در ufw و صبر تا DNS دامنه برسد
- گرفتن گواهی Let's Encrypt و تنظیم تمدید خودکار آن
- ساختن رمزهای تصادفی در `/opt/delgarmi/.env`
- ساختن ایمیج‌ها، بالا آوردن پنج سرویس و روشن کردن به‌روزرسانی خودکار

تنها کار دستی یک بار است: اسکریپت یک کلید فقط‌خواندنی چاپ می‌کند که باید در Settings ← Deploy keys مخزن اضافه شود. اسکریپت منتظر می‌ماند و بعد خودش ادامه می‌دهد. اجرای دوباره‌اش بی‌خطر است و رمزها، گواهی و داده‌ها را نگه می‌دارد.

انتشار خودکار است: هر push روی `main` که همه‌ی تست‌هایش سبز شود، شاخه‌ی `release` را به همان commit می‌برد. سرور هر دقیقه `release` را نگاه می‌کند و اگر جلو رفته باشد، ایمیج‌ها را می‌سازد و سرویس‌ها را دوباره بالا می‌آورد (`deploy/update.sh`). اگر نسخه‌ی تازه سالم بالا نیاید، به نسخه‌ی قبل برمی‌گردد و آن commit را رد می‌کند تا commit بعدی برسد.

روی سرور:

```bash
delgarmi status    # نسخه‌ی در حال اجرا، آخرین بررسی، سلامت سایت، تاریخ انقضای گواهی
delgarmi update    # همین حالا به‌روز کن
delgarmi logs      # گزارش انتشارها و سرویس‌ها
```

## سیستم طراحی

`web/design/tokens.json` و `web/design/components.css` کپی بدون تغییر سیستم طراحی‌اند. تغییر اول در سیستم طراحی انجام می‌شود و بعد این دو فایل دوباره کپی می‌شوند. `styles/tokens.css` در هر build از روی `tokens.json` ساخته می‌شود و یک تست مطمئن می‌شود هر متغیری که CSS به کار می‌برد تعریف شده باشد.

## فونت‌ها

IRANYekanX و Pofak خریداری شده‌اند و فقط برای delgarmi.com مجازند. این مخزن باید خصوصی بماند و فایل فونت‌ها جای دیگری منتشر نشود. کدهای لایسنس در `web/public/fonts/FontLicense.txt` نوشته می‌شوند.
