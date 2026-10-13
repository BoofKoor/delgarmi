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

## انتشار

هر push روی `main` بعد از سبز شدن تست‌ها ایمیج‌های web و api را می‌سازد، با SSH روی سرور می‌برد (`docker save` / `docker load`) و `docker compose up` می‌کند. چهار Secret در مخزن لازم است: `DEPLOY_HOST`، `DEPLOY_PORT`، `DEPLOY_SSH_KEY` و `DEPLOY_HOST_KEY`. تا تنظیم نشده‌اند، انتشار رد می‌شود و فقط تست‌ها اجرا می‌شوند.

روی سرور همه‌چیز در `/opt/delgarmi` است و رمزها فقط در `/opt/delgarmi/.env` (نمونه: `.env.example`).

## سیستم طراحی

`web/design/tokens.json` و `web/design/components.css` کپی بدون تغییر سیستم طراحی‌اند. تغییر اول در سیستم طراحی انجام می‌شود و بعد این دو فایل دوباره کپی می‌شوند. `styles/tokens.css` در هر build از روی `tokens.json` ساخته می‌شود و یک تست مطمئن می‌شود هر متغیری که CSS به کار می‌برد تعریف شده باشد.

## فونت‌ها

IRANYekanX و Pofak خریداری شده‌اند و فقط برای delgarmi.com مجازند. این مخزن باید خصوصی بماند و فایل فونت‌ها جای دیگری منتشر نشود. کدهای لایسنس در `web/public/fonts/FontLicense.txt` نوشته می‌شوند.
