"""The text of every SMS the site sends. A real SMS account needs each text approved as a template
by the provider first, so a new or changed text is not live until the provider approves it."""

FA_DIGITS = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')

TEMPLATES = {
    # Latin digits, so phones can offer to fill the code in.
    'otp': 'کد تأیید دلگرمی: {code}',
    'request-new': 'دلگرمی: درخواست شما با کد {code} ثبت شد. همکاران ما برای هماهنگی تماس می‌گیرند.',
    'request-waitlist': 'دلگرمی: درخواست شما با کد {code} در لیست انتظار ثبت شد. '
                        'وقتی این خدمت در شهرتان فعال شد پیامک می‌گیرید.',
}

# What the team panel calls each text.
NAMES = {
    'otp': 'کد تأیید',
    'request-new': 'درخواست ثبت شد',
    'request-waitlist': 'ثبت در لیست انتظار',
}

# Templates whose code is written in Persian digits.
PERSIAN_DIGITS = {'request-new', 'request-waitlist'}


def render(template: str, params: dict) -> str:
    values = {key: str(value) for key, value in params.items()}
    if template in PERSIAN_DIGITS:
        values = {key: value.translate(FA_DIGITS) for key, value in values.items()}
    return TEMPLATES[template].format(**values)
