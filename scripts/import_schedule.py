"""Import only the public schedule sheet; do not publish workbook or grade sheets.
Usage: python3 scripts/import_schedule.py /path/to/workbook.xlsx
Merged homework/quiz cells are scheduled windows, not explicit due dates.
"""
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
TOPICS = {'DP': 'Dynamic Programming', 'Greedy': 'Greedy Algorithms', 'Graph': 'Graph Algorithms', 'MST': 'Minimum Spanning Trees', 'SSSP': 'Single-Source Shortest Paths', 'APSP': 'All-Pairs Shortest Paths', 'Flow': 'Network Flow', 'NP': 'NP-Completeness'}
MONTHS = {'شهریور': 'Shahrivar', 'مهر': 'Mehr', 'آبان': 'Aban', 'آذر': 'Azar', 'دی': 'Dey'}
DAYS = {'شنبه': 'Saturday', 'یکشنبه': 'Sunday', 'دوشنبه': 'Monday', 'سهشنبه': 'Tuesday', 'چهارشنبه': 'Wednesday', 'پنجشنبه': 'Thursday', 'جمعه': 'Friday'}
with ZipFile(sys.argv[1]) as z:
    strings = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    workbook = ET.fromstring(z.read('xl/workbook.xml'))
    sheet = next(s for s in workbook.find('s:sheets', NS) if s.get('name') == 'schedule')
    rid = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = next(r.get('Target') for r in rels if r.get('Id') == rid)
    root = ET.fromstring(z.read('xl/' + target))
    cells = {}
    for c in root.findall('.//s:sheetData/s:row/s:c', NS):
        v = c.find('s:v', NS)
        if v is not None:
            cells[c.get('r')] = strings[int(v.text)] if c.get('t') == 's' else v.text
    merged = {}
    for m in root.findall('.//s:mergeCell', NS):
        start, end = m.get('ref').split(':')
        col = re.match('[A-Z]+', start)[0]
        first, last = int(re.search(r'\d+', start)[0]), int(re.search(r'\d+', end)[0])
        merged[start] = last
        if col in ['A', 'C', 'F'] and first >= 3:
            for row in range(first, last + 1):
                cells.setdefault(f'{col}{row}', cells.get(start, ''))

def date(row):
    return f"{int(float(cells[f'B{row}']))} {MONTHS[cells[f'A{row}']]}"

def span(first, last):
    return date(first) if first == last else f'{date(first)} – {date(last)}'

def day(row):
    return DAYS[cells[f'E{row}'].replace(' ', '').replace('\u200c', '')]

p = Path(__file__).resolve().parents[1] / 'data/site.json'
data = json.loads(p.read_text())
schedule = []
lectures = []
windows = []
for week in range(1, 19):
    rows = [r for r in range(3, 127) if int(float(cells[f'C{r}'])) == week]
    details = []
    for r in rows:
        if f'D{r}' in cells:
            number = int(float(cells[f'D{r}']))
            topic = TOPICS[cells[f'F{r}']]
            details.append(f'{day(r)}, {date(r)}: Lecture {number} — {topic}')
            lectures.append(dict(title=f'Lecture {number:02d} — {topic}', description=f'Week {week} · {day(r)}', due=date(r), url=''))
    if not details:
        details.append('No lecture sessions listed.')
    for r in rows:
        for col in ['G', 'H', 'I', 'J']:
            key = f'{col}{r}'
            if key not in cells:
                continue
            value = cells[key].strip()
            dates = span(r, merged.get(key, r))
            if col in ['G', 'H']:
                number = int(re.search(r'hw(\d+)', value, re.I)[1])
                label = data['assignments'][number - 1]['title']
                details.append(f'Homework window: {label} · {dates}')
                windows.append((number - 1, dates))
            elif col == 'I':
                index = {'quiz dp': 7, 'quiz greedy': 8, 'quiz graph': 9, 'quiz mst': 10, 'quiz sp': 11, 'quiz flow': 12}[value.lower()]
                details.append(f"Quiz window: {data['assignments'][index]['title']} · {dates}")
                windows.append((index, dates))
            else:
                clean = re.sub(r'\s+', ' ', value)
                details.append(f'TA session: {clean} · {dates}')
    schedule.append(dict(title=f'Week {week}', description='\n'.join(details), due=span(rows[0], rows[-1]), url=''))
for index, dates in windows:
    item = data['assignments'][index]
    # Preserve unrelated administrator content and any explicitly entered due date.
    old = re.sub(r'(^|\n)Scheduled window: [^\n]*', '', item['description']).strip()
    item['description'] = '\n'.join(filter(None, [old, f'Scheduled window: {dates} (Persian calendar).']))
data['schedule'] = schedule
# Keep existing resource links/descriptions when updating lecture dates and titles.
for i, lecture in enumerate(lectures):
    if i < len(data['lectures']):
        lecture['url'] = data['lectures'][i]['url']
        if data['lectures'][i]['description']:
            lecture['description'] = data['lectures'][i]['description']
data['lectures'] = lectures
assert len(schedule) == 18 and len(lectures) == 30 and len(windows) == 13
p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(f'Imported {len(schedule)} weeks, {len(lectures)} lectures, and {len(windows)} assessment windows.')
