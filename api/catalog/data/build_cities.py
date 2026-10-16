"""Builds cities.json from the vendored Statistical Centre data in source/.

Run from this folder:  python build_cities.py
The output is committed; the data migration loads it. Re-run only when the source changes.
"""

import csv
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent))
from catalog.text import normalize_fa  # noqa: E402

# Provinces are written without a space after «و» in the source.
PROVINCE_FIX = {
    'سیستان وبلوچستان': 'سیستان و بلوچستان',
    'چهارمحال وبختیاری': 'چهارمحال و بختیاری',
    'کهگیلویه وبویراحمد': 'کهگیلویه و بویراحمد',
}

# Source spellings that the general rules below cannot fix.
NAME_FIX = {
    'چاه بهار': 'چابهار',
    'آران وبیدگل': 'آران و بیدگل',
    'بویین ومیاندشت': 'بوئین و میاندشت',
    'بویین زهرا': 'بوئین‌زهرا',
    'کتالم وسادات شهر': 'کتالم و سادات‌شهر',
    'اسلام آبادغرب': 'اسلام‌آباد غرب',
    'مبارک آباددیز': 'مبارک‌آباد دیز',
    'تازه کندنصرت آباد': 'تازه‌کند نصرت‌آباد',
    'تازه کندانگوت': 'تازه‌کند انگوت',
    # «آباد» written without its madda (مهاباد, گناباد and بهاباد are correct as they are).
    'فخراباد': 'فخرآباد',
    'جعفراباد': 'جعفرآباد',
    'احمدابادصولت': 'احمدآباد صولت',
    'شهراباد': 'شهرآباد',
    'خیراباد': 'خیرآباد',
    'قادراباد': 'قادرآباد',
    'معزابادجابری': 'معزآباد جابری',
    'شاهپوراباد': 'شاهپورآباد',
}

# Cities that get their own page, in priority order (provincial capitals first, then the
# largest other cities). The order also breaks ties in the city search.
MAJOR = [
    ('تهران', 'تهران', 'tehran'), ('مشهد', 'خراسان رضوی', 'mashhad'), ('اصفهان', 'اصفهان', 'isfahan'),
    ('کرج', 'البرز', 'karaj'), ('شیراز', 'فارس', 'shiraz'), ('تبریز', 'آذربایجان شرقی', 'tabriz'),
    ('قم', 'قم', 'qom'), ('اهواز', 'خوزستان', 'ahvaz'), ('کرمانشاه', 'کرمانشاه', 'kermanshah'),
    ('ارومیه', 'آذربایجان غربی', 'urmia'), ('رشت', 'گیلان', 'rasht'), ('زاهدان', 'سیستان و بلوچستان', 'zahedan'),
    ('همدان', 'همدان', 'hamedan'), ('کرمان', 'کرمان', 'kerman'), ('یزد', 'یزد', 'yazd'),
    ('اردبیل', 'اردبیل', 'ardabil'), ('بندرعباس', 'هرمزگان', 'bandar-abbas'), ('اراک', 'مرکزی', 'arak'),
    ('زنجان', 'زنجان', 'zanjan'), ('سنندج', 'کردستان', 'sanandaj'), ('قزوین', 'قزوین', 'qazvin'),
    ('خرم‌آباد', 'لرستان', 'khorramabad'), ('گرگان', 'گلستان', 'gorgan'), ('ساری', 'مازندران', 'sari'),
    ('بجنورد', 'خراسان شمالی', 'bojnurd'), ('بیرجند', 'خراسان جنوبی', 'birjand'), ('ایلام', 'ایلام', 'ilam'),
    ('بوشهر', 'بوشهر', 'bushehr'), ('شهرکرد', 'چهارمحال و بختیاری', 'shahrekord'),
    ('یاسوج', 'کهگیلویه و بویراحمد', 'yasuj'), ('سمنان', 'سمنان', 'semnan'), ('کاشان', 'اصفهان', 'kashan'),
    ('نجف‌آباد', 'اصفهان', 'najafabad'), ('خمینی‌شهر', 'اصفهان', 'khomeini-shahr'),
    ('شاهین‌شهر', 'اصفهان', 'shahin-shahr'), ('بابل', 'مازندران', 'babol'), ('آمل', 'مازندران', 'amol'),
    ('دزفول', 'خوزستان', 'dezful'), ('نیشابور', 'خراسان رضوی', 'neyshabur'), ('سبزوار', 'خراسان رضوی', 'sabzevar'),
    ('قائم‌شهر', 'مازندران', 'qaem-shahr'), ('ساوه', 'مرکزی', 'saveh'), ('بروجرد', 'لرستان', 'borujerd'),
    ('ملایر', 'همدان', 'malayer'), ('ورامین', 'تهران', 'varamin'), ('اسلامشهر', 'تهران', 'eslamshahr'),
    ('شهریار', 'تهران', 'shahriar'), ('پاکدشت', 'تهران', 'pakdasht'), ('کیش', 'هرمزگان', 'kish'),
    ('مراغه', 'آذربایجان شرقی', 'maragheh'), ('خوی', 'آذربایجان غربی', 'khoy'), ('سیرجان', 'کرمان', 'sirjan'),
    ('رفسنجان', 'کرمان', 'rafsanjan'), ('بم', 'کرمان', 'bam'), ('زابل', 'سیستان و بلوچستان', 'zabol'),
    ('آبادان', 'خوزستان', 'abadan'), ('بهبهان', 'خوزستان', 'behbahan'), ('مرودشت', 'فارس', 'marvdasht'),
    ('کازرون', 'فارس', 'kazerun'), ('لار', 'فارس', 'lar'), ('گنبد کاووس', 'گلستان', 'gonbad-kavus'),
    ('لاهیجان', 'گیلان', 'lahijan'), ('بندر انزلی', 'گیلان', 'bandar-anzali'), ('میبد', 'یزد', 'meybod'),
    ('اردکان', 'یزد', 'ardakan'), ('تربت حیدریه', 'خراسان رضوی', 'torbat-heydarieh'), ('قوچان', 'خراسان رضوی', 'quchan'),
]


def tidy(name: str) -> str:
    """Standard spacing: a zero-width non-joiner inside compounds such as نجف‌آباد and خمینی‌شهر."""
    if name in NAME_FIX:
        return NAME_FIX[name]
    name = re.sub(r'(\S) [اآ]باد(?=\s|$|\))', lambda m: m.group(1) + '‌آباد', name)
    name = re.sub(r'(\S) شهر(?=\s|$|\))', lambda m: m.group(1) + '‌شهر', name)
    return name


def main() -> None:
    src = HERE / 'source'
    provinces = {r['id']: PROVINCE_FIX.get(r['name'], r['name']) for r in csv.DictReader(open(src / 'ostan.csv', encoding='utf-8'))}
    rows = [r for r in csv.DictReader(open(src / 'shahr.csv', encoding='utf-8')) if r['shahr_type'] == '0']
    counties = {r['id']: r['name'] for r in csv.DictReader(open(src / 'shahrestan.csv', encoding='utf-8'))}

    cities = [{'code': r['amar_code'], 'name': tidy(r['name']), 'province': provinces[r['ostan']], 'slug': None, 'priority': None} for r in rows]

    # Two cities with one name in one province (گلوگاه in Mazandaran): name the county too.
    seen: dict[tuple[str, str], int] = {}
    for c in cities:
        seen[(c['name'], c['province'])] = seen.get((c['name'], c['province']), 0) + 1
    for c, r in zip(cities, rows):
        county = tidy(counties[r['shahrestan']])
        if seen[(c['name'], c['province'])] > 1 and county != c['name']:
            c['name'] = f"{c['name']} ({county})"

    by_key: dict[tuple[str, str], list[dict]] = {}
    for c in cities:
        by_key.setdefault((normalize_fa(c['name']), c['province']), []).append(c)
    for rank, (name, province, slug) in enumerate(MAJOR, start=1):
        found = by_key.get((normalize_fa(name), province), [])
        if len(found) != 1:
            sys.exit(f'{name} ({province}): {len(found)} matches in the source')
        found[0].update(name=name, slug=slug, priority=rank)

    codes = [c['code'] for c in cities]
    slugs = [c['slug'] for c in cities if c['slug']]
    names = [(c['name'], c['province']) for c in cities]
    assert len(codes) == len(set(codes)), 'duplicate codes'
    assert len(names) == len(set(names)), 'two cities with one name in one province'
    assert len(slugs) == len(set(slugs)) == len(MAJOR), 'duplicate slugs'
    assert len({c['province'] for c in cities}) == 31, 'expected 31 provinces'

    cities.sort(key=lambda c: (c['priority'] or 10_000, c['province'], c['name']))
    out = HERE / 'cities.json'
    out.write_text(json.dumps(cities, ensure_ascii=False, indent=0) + '\n', encoding='utf-8')
    print(f'{out.name}: {len(cities)} cities, {len(slugs)} with pages, {len(set(c["province"] for c in cities))} provinces')


if __name__ == '__main__':
    main()
