"""Build the public author directory and participant challenge statements.

Only data/challenges.json is read. No access to the private challenge repository
is needed, and no organizer material is included in the archive.
"""
from collections import Counter
from html import escape
from pathlib import Path
from urllib.parse import urlsplit
from share_meta import social_meta
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'data/challenges.json').read_text(encoding='utf-8'))
CATEGORIES = DATA['categories']
PEOPLE = {person['name']: person for person in DATA['people']}
CHALLENGES = sorted(DATA['challenges'], key=lambda c: (CATEGORIES.index(c['category']), c['name'].casefold()))
e = escape

assert len(PEOPLE) == 30 and len(CHALLENGES) == 36
assert len({c['slug'] for c in CHALLENGES}) == len(CHALLENGES)
for c in CHALLENGES:
    assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', c['slug'])
    assert set(c) == {'slug', 'name', 'category', 'authors', 'description'}
    assert c['authors'] and all(a in PEOPLE for a in c['authors'])
for person in PEOPLE.values():
    if 'github_url' in person:
        assert urlsplit(person['github_url']).hostname == 'github.com'
        assert urlsplit(person['avatar_url']).hostname == 'avatars.githubusercontent.com'


def avatar(name, size=40):
    person = PEOPLE[name]
    if 'avatar_url' in person:
        return f'<img class="avatar" src="{e(person["avatar_url"], quote=True)}" alt="" width="{size}" height="{size}" loading="lazy">'
    return f'<span class="avatar avatar-initial" aria-hidden="true">{e(name[0])}</span>'


def profile(name, css='author-profile'):
    inside = avatar(name) + f'<span>{e(name)}</span>'
    person = PEOPLE[name]
    if 'github_url' in person:
        return f'<a class="{css}" href="{e(person["github_url"], quote=True)}">{inside}</a>'
    return f'<span class="{css}">{inside}</span>'


def page(title, description, body, filename, css_class, depth=0):
    prefix = '../' * depth
    asset_hash = {name: hashlib.sha256((ROOT / 'assets' / name).read_bytes()).hexdigest()[:12] for name in ['site.css', 'site.js']}
    html = f'''<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#181715">
  <meta name="description" content="{e(description, quote=True)}">
{social_meta(title + ' · MSG CTF 2026', description, 'https://msg-ctf.github.io/' + filename)}
  <title>{e(title)} · MSG CTF 2026</title>
  <link rel="canonical" href="https://msg-ctf.github.io/{filename}">
  <link rel="icon" type="image/svg+xml" href="{prefix}assets/brand/favicon.svg">
  <link rel="preload" href="{prefix}assets/fonts/Pretendard-common.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{prefix}assets/site.css?v={asset_hash['site.css']}">
  <script src="{prefix}assets/site.js?v={asset_hash['site.js']}" defer></script>
</head>
<body class="{css_class}" id="page-top">
  <a class="skip-link" href="#main">본문으로 이동</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="{prefix}index.html" aria-label="MSG CTF 처음으로">
        <span class="brand-mark"><img src="{prefix}assets/brand/event-logo.webp" alt="MSG CTF" width="1254" height="1254"></span>
        <span class="brand-divider" aria-hidden="true"></span><span class="brand-label">2026</span>
      </a>
      <nav aria-label="주요 메뉴"><a href="{prefix}index.html#results">결과</a><a href="{prefix}authors.html" aria-current="page">출제자</a><a href="{prefix}platform.html">플랫폼</a></nav>
      <a class="header-github" href="https://github.com/MSG-CTF" aria-label="MSG CTF GitHub">GitHub <span class="github-icon" aria-hidden="true"></span></a>
    </div>
  </header>
  <main id="main">{body}</main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div><span class="footer-title">MSG CTF 2026</span><p>2026년 11월 8일의 대회와 개발 기록</p></div>
      <div class="footer-links"><a href="{prefix}challenges.html">문제 아카이브</a><a class="github-link" href="https://github.com/MSG-CTF"><span class="github-icon" aria-hidden="true"></span>GitHub</a><a href="#page-top">맨 위로 ↑</a></div>
    </div>
  </footer>
</body>
</html>
'''
    return '\n'.join(line.rstrip() for line in html.splitlines()) + '\n'


def catalog_heading(kind):
    authors = kind == 'authors'
    title = '출제자' if authors else '문제 아카이브'
    subtitle = '일반 문제 30개 · KOTH 6개' if authors else '2026 MSG CTF에 나왔던 일반 문제 30개와 KOTH 6개'
    return f'''
    <section class="catalog-heading container" aria-labelledby="page-title">
      <a class="back-link" href="index.html">← 대회 기록</a>
      <div class="catalog-title"><h1 id="page-title">{title}</h1><p>{subtitle}</p></div>
      <nav class="catalog-tabs" aria-label="출제자와 문제">
        <a href="authors.html"{' aria-current="page"' if authors else ''}>출제자 <span>30</span></a>
        <a href="challenges.html"{' aria-current="page"' if not authors else ''}>문제 아카이브 <span>36</span></a>
      </nav>
    </section>'''


def controls(kind, counts):
    filters = ''.join(f'<button type="button" data-category-filter="{category}" aria-pressed="{str(category == "all").lower()}">{"전체" if category == "all" else category.upper()} <span>{counts[category]}</span></button>' for category in ['all', *CATEGORIES])
    return f'''
      <div class="catalog-controls" hidden>
        <div class="catalog-search-row">
          <p id="catalog-status" role="status" aria-live="polite">{'출제자 30명 · 36문제' if kind == 'authors' else '전체 36문제'}</p>
          <label class="catalog-search"><span class="sr-only">문제 또는 출제자 검색</span><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" name="q" placeholder="문제 · 출제자 검색" maxlength="200" autocomplete="off" aria-controls="catalog-items"></label>
        </div>
        <div class="catalog-filters" role="group" aria-label="문제 분야 선택">{filters}</div>
      </div>'''


def empty_state():
    return '<div class="catalog-empty" hidden><p>찾는 문제나 출제자가 없습니다</p><button type="button" data-catalog-reset>전체 보기</button></div>'


def author_directory():
    cards = []
    counts = {'all': len(PEOPLE)}
    counts.update({cat: len({a for c in CHALLENGES if c['category'] == cat for a in c['authors']}) for cat in CATEGORIES})
    for name in sorted(PEOPLE, key=str.casefold):
        challenges = [c for c in CHALLENGES if name in c['authors']]
        rows = '\n'.join(f'''<li data-category="{c['category']}" data-slug="{c['slug']}" data-search="{e(name + ' ' + c['name'], quote=True)}"><a href="challenges/{c['slug']}.html"><span class="genre-tag">{c['category'].upper()}</span><span>{e(c['name'])}</span><span class="problem-arrow" aria-hidden="true">↗</span></a></li>''' for c in challenges)
        cards.append(f'''<article class="author-card" data-author="{e(name, quote=True)}">
          <div class="author-card-heading"><h2>{profile(name)}</h2><span class="author-problem-count">{len(challenges)}문제</span></div>
          <ul>{rows}</ul>
        </article>''')
    body = catalog_heading('authors') + f'''
    <div class="catalog-content container" data-catalog="authors">
      {controls('authors', counts)}
      <div class="author-grid" id="catalog-items">{''.join(cards)}</div>
      {empty_state()}
      <p class="author-basis">출제자 표기는 문제 README와 최초 등록 기록을 기준으로 정리했습니다 <a href="https://github.com/MSG-CTF/msg-ctf.github.io/blob/main/docs/challenge-authors.md">출제 기록 ↗</a></p>
    </div>'''
    (ROOT / 'authors.html').write_text(page('출제자', 'MSG CTF 출제자 30명과 함께 만든 문제들', body, 'authors.html', 'page-authors'), encoding='utf-8')


def excerpt(c):
    text = re.sub(r'[`*]', '', c['description']).split('\n\n')[0]
    text = ' '.join(text.split())
    return text if len(text) <= 132 else text[:131].rstrip() + '…'


def archive_index():
    counts = dict(Counter(c['category'] for c in CHALLENGES), all=len(CHALLENGES))
    cards = []
    for index, c in enumerate(CHALLENGES, 1):
        people = ''.join(f'<span class="challenge-person">{avatar(name, 24)}<span>{e(name)}</span></span>' for name in c['authors'])
        cards.append(f'''<article class="challenge-card" data-category="{c['category']}" data-search="{e(c['name'] + ' ' + ' '.join(c['authors']), quote=True)}">
          <div class="challenge-card-meta"><span class="genre-tag">{c['category'].upper()}</span><span>{index:02}</span></div>
          <h2><a href="challenges/{c['slug']}.html">{e(c['name'])}<span aria-hidden="true">↗</span></a></h2>
          <p class="challenge-excerpt">{e(excerpt(c))}</p>
          <div class="challenge-people">{people}</div>
        </article>''')
    body = catalog_heading('challenges') + f'''
    <div class="catalog-content container" data-catalog="challenges">
      {controls('challenges', counts)}
      <div class="challenge-grid" id="catalog-items">{''.join(cards)}</div>
      {empty_state()}
      <p class="author-basis">문제를 누르면 출제자가 작성한 대회 지문을 볼 수 있습니다</p>
    </div>'''
    (ROOT / 'challenges.html').write_text(page('문제 아카이브', '일반 문제 30개와 KOTH 6개의 지문과 출제 기록', body, 'challenges.html', 'page-archive'), encoding='utf-8')


def inline(text):
    # Escape everything before adding the small subset of participant Markdown.
    pieces = re.split(r'(https?://[^\s<>"`]+|`[^`]+`|\*\*[^*]+\*\*)', text)
    output = []
    for part in pieces:
        if re.fullmatch(r'https?://[^\s<>"`]+', part):
            output.append(f'<a href="{e(part, quote=True)}" rel="noopener noreferrer">{e(part)}</a>')
        elif part.startswith('`') and part.endswith('`') and len(part) > 2:
            output.append('<code>' + e(part[1:-1]) + '</code>')
        elif part.startswith('**') and part.endswith('**') and len(part) > 4:
            output.append('<strong>' + e(part[2:-2]) + '</strong>')
        else:
            output.append(e(part))
    return ''.join(output)


def statement(text):
    blocks = []
    for paragraph in re.split(r'\n\s*\n', text):
        lines = paragraph.splitlines()
        if all(line.startswith('- ') for line in lines):
            blocks.append('<ul>' + ''.join('<li>' + inline(line[2:]) + '</li>' for line in lines) + '</ul>')
        else:
            blocks.append('<p>' + '<br>'.join(inline(line) for line in lines) + '</p>')
    return '\n'.join(blocks)


def detail_pages():
    (ROOT / 'challenges').mkdir(exist_ok=True)
    for c in CHALLENGES:
        by_author = ''.join(profile(name, 'detail-author') for name in c['authors'])
        related = [item for item in CHALLENGES if item['category'] == c['category'] and item['slug'] != c['slug']]
        other_links = ''.join(f'<a href="{other["slug"]}.html">{e(other["name"])} <span aria-hidden="true">↗</span></a>' for other in related)
        body = f'''
    <article class="challenge-detail container">
      <a class="back-link" href="../challenges.html?category={c['category']}">← {c['category'].upper()} 문제 목록</a>
      <header class="detail-heading">
        <div class="detail-eyebrow"><a class="genre-tag" href="../challenges.html?category={c['category']}">{c['category'].upper()}</a><span>MSG CTF 2026</span></div>
        <h1>{e(c['name'])}</h1>
        <div class="detail-authors"><span>출제</span>{by_author}</div>
      </header>
      <div class="detail-body">
        <section class="challenge-statement" aria-labelledby="statement-title">
          <h2 id="statement-title">대회 지문</h2>
          <div class="statement-prose">{statement(c['description'])}</div>
        </section>
        <aside class="related-challenges" aria-labelledby="related-title"><h2 id="related-title">함께 출제된 {c['category'].upper()} 문제</h2>{other_links}<a class="all-challenges-link" href="../challenges.html">전체 36문제 보기 →</a></aside>
      </div>
      <p class="statement-source">2026년 11월 8일 대회 기록 <span aria-hidden="true">·</span> <a href="https://github.com/MSG-CTF/msg-ctf.github.io/blob/main/docs/challenge-archive.md">아카이브 출처 ↗</a></p>
    </article>'''
        filename = f'challenges/{c["slug"]}.html'
        (ROOT / filename).write_text(page(c['name'], excerpt(c), body, filename, 'page-challenge', depth=1), encoding='utf-8')


author_directory()
archive_index()
detail_pages()
print(f'Built {len(PEOPLE)} author profiles and {len(CHALLENGES)} challenge pages')
