# Shared test data

`normalize-fa.json` lists inputs and the search key each must fold to. Both `api/catalog/text.py`
and `web/lib/text.ts` are tested against it, so the panel search and the site search agree.

`jalali.json` lists Gregorian days and their Shamsi dates, for `api/common/jalali.py` and
`web/lib/jalali.ts`.

`mobile.json` lists ways people type a mobile number and the number each must become (`null`: not
a mobile number). Both `api/accounts/otp.py` and `web/lib/form.ts` are tested against it, so the
form never accepts a number the API refuses.
