# Source data

`ostan.csv`, `shahrestan.csv` and `shahr.csv` come unchanged from **iran-cities v3.0** by Ahmad Azizi
(https://github.com/ahmadazizi/iran-cities, `releases/v3.0/csv/`, MIT licence, see
`LICENSE-iran-cities`). That release (Mordad 1399) is built from the Statistical Centre of Iran's
official divisions: 31 provinces and 1,354 cities (rows with `shahr_type = 0`; rows with
`shahr_type = 2` are municipal districts and are skipped).

`../build_cities.py` turns them into `../cities.json`, fixing spacing (ZWNJ in compounds such as
نجف‌آباد and خمینی‌شهر) and adding Latin slugs for the cities that get their own page.
Two cities with the same name in one province get their county in brackets: «گلوگاه (بابل)».

Migration `catalog/0002` loads `cities.json` into a new database. If the source changes later,
rebuild `cities.json` and add a new migration that updates the existing rows.
