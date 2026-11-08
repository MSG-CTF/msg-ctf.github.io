"""Shared social tags for static pages and the challenge archive generator."""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re

IMAGE = 'https://msg-ctf.github.io/assets/social/msg-ctf-2026-share.jpg'
IMAGE_ALT = 'MSG CTF 2026 · 75팀 150명이 참가한 보드게임형 해킹 대회 · 무료 크레딧 적용 후 클라우드 추가 결제 0원'


def social_meta(title, description, url):
    tags = [
        ('property', 'og:title', title),
        ('property', 'og:description', description),
        ('property', 'og:type', 'website'),
        ('property', 'og:site_name', 'MSG CTF 2026'),
        ('property', 'og:locale', 'ko_KR'),
        ('property', 'og:url', url),
        ('property', 'og:image', IMAGE),
        ('property', 'og:image:secure_url', IMAGE),
        ('property', 'og:image:type', 'image/jpeg'),
        ('property', 'og:image:width', '1200'),
        ('property', 'og:image:height', '630'),
        ('property', 'og:image:alt', IMAGE_ALT),
        ('name', 'twitter:card', 'summary_large_image'),
        ('name', 'twitter:title', title),
        ('name', 'twitter:description', description),
        ('name', 'twitter:image', IMAGE),
        ('name', 'twitter:image:alt', IMAGE_ALT),
    ]
    return '\n'.join(f'  <meta {key}="{name}" content="{escape(value, quote=True)}">' for key, name, value in tags)


class PageMeta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            self.tags[attrs.get('property', attrs.get('name'))] = attrs.get('content')


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    pages = [*root.glob('*.html'), *(root / 'challenges').glob('*.html')]
    for path in pages:
        html = path.read_text(encoding='utf-8')
        meta = PageMeta()
        meta.feed(html.split('</head>', 1)[0])
        title = 'MSG CTF 2026' if path.name == 'index.html' else meta.tags['og:title']
        tags = social_meta(title, meta.tags['description'], meta.tags['og:url'])
        html = re.sub(r'^\s*<meta (?:property|name)="(?:og:|twitter:)[^\n]+>\n', '', html, flags=re.M)
        html = re.sub(r'(  <meta name="description"[^\n]+>)', lambda m: m[1] + '\n' + tags, html, count=1)
        path.write_text(html, encoding='utf-8', newline='\n')
    print(f'Share metadata updated for {len(pages)} pages')
