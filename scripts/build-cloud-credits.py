"""Compose standalone README diagrams from the local, attributed cloud logos."""
from html import escape
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
ET.register_namespace('', 'http://www.w3.org/2000/svg')


def logo(name, x, y, size=52):
    svg = ET.parse(ROOT / f'assets/cloud/{name}.svg').getroot()
    svg.set('x', str(x))
    svg.set('y', str(y))
    svg.set('width', str(size))
    svg.set('height', str(size))
    markup = ET.tostring(svg, encoding='unicode')
    for original in re.findall(r'\bid="([^"]+)"', markup):
        markup = markup.replace(f'id="{original}"', f'id="logo-{name}-{original}"')
        markup = markup.replace(f'url(#{original})', f'url(#logo-{name}-{original})')
    return markup


def text(x, y, value, size=24, fill='#f5ecdb', weight=400, anchor='start'):
    return (f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" '
            f'font-weight="{weight}" text-anchor="{anchor}">{escape(value)}</text>')


def server(x, y):
    return f'''<g transform="translate({x} {y})" fill="none" stroke="#d4b17a" stroke-width="2.2" stroke-linecap="round">
      <rect x="-20" y="0" width="40" height="16" rx="3"/>
      <rect x="-20" y="22" width="40" height="16" rx="3"/>
      <path d="M-10 8h1m7 0h12M-10 30h1m7 0h12"/>
    </g>'''


def monitor(x, y):
    return f'''<g transform="translate({x} {y})" fill="none" stroke="#d4b17a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="-24" y="0" width="48" height="32" rx="4"/>
      <path d="M0 32v9m-12 0h24M-10 10l5 6-5 6m13 0h8"/>
    </g>'''


def frame(width, height, content):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
  <title id="title">무료 크레딧으로 모은 실행 자원, 클라우드 추가 결제 0원</title>
  <desc id="desc">AWS, GCP, Azure의 무료 크레딧으로 확보한 실행 자원을 Resource Broker에 연결했습니다. 스케줄러와 런타임을 거쳐 문제를 실행하고, 종료 후 자원 정리와 예약 반납을 거쳐 다시 사용했습니다. 0원은 크레딧 적용 후 실제 추가 결제액입니다.</desc>
  <defs>
    <linearGradient id="background" x2="1" y2="1"><stop stop-color="#231c15"/><stop offset="1" stop-color="#171411"/></linearGradient>
    <linearGradient id="broker" x2="1" y2="1"><stop stop-color="#3a2d1e"/><stop offset="1" stop-color="#251f17"/></linearGradient>
    <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1l5 3-5 3" fill="none" stroke="#c7a46c" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></marker>
  </defs>
  <rect x="1" y="1" width="{width-2}" height="{height-2}" rx="16" fill="url(#background)" stroke="#4a3927"/>
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif">
    {content}
  </g>
</svg>
'''


def desktop():
    parts = [text(38, 55, '무료 크레딧으로 모은 실행 자원', 27, weight=600),
             text(824, 54, '추가 결제', 19, '#c9b79c', anchor='end'),
             text(962, 57, '0원', 44, '#e7c28c', 700, 'end'),
             '<path d="M38 84H962" stroke="#4a3927"/>']
    for name, label, y in [('aws', 'AWS', 112), ('gcp', 'GCP', 192), ('azure', 'Azure', 272)]:
        parts += [f'<rect x="38" y="{y}" width="60" height="60" rx="12" fill="#faf5ec"/>',
                  logo(name, 42, y+4), text(116, y+25, label, 24, weight=600),
                  text(116, y+51, '무료 크레딧', 18, '#c9b79c')]
    parts += ['<g fill="none" stroke="#c7a46c" stroke-width="2"><path d="M264 142h40q16 0 16 16v48q0 16 16 16h55" marker-end="url(#arrow)"/><path d="M264 222h72M264 302h40q16 0 16-16v-48q0-16 16-16"/></g>',
              '<rect x="402" y="134" width="246" height="176" rx="12" fill="url(#broker)" stroke="#a7895c"/>',
              server(525, 156), text(525, 229, 'Resource Broker', 25, weight=600, anchor='middle'),
              text(525, 265, '실행 자원 통합', 23, anchor='middle'),
              text(525, 291, 'CPU · 메모리 예약', 17, '#c9b79c', anchor='middle'),
              '<g fill="none" stroke="#c7a46c" stroke-width="2"><path d="M666 202h88" marker-end="url(#arrow)"/><path d="M754 252h-88" marker-end="url(#arrow)"/></g>',
              text(710, 189, '배정', 18, '#e7c28c', anchor='middle'),
              text(710, 281, '반납', 18, '#e7c28c', anchor='middle'),
              monitor(870, 152), text(870, 236, '문제 실행', 28, weight=600, anchor='middle'),
              text(870, 269, '컨테이너 · 전용 VM', 19, '#c9b79c', anchor='middle')]
    return frame(1000, 360, '\n    '.join(parts))


def mobile():
    parts = [text(270, 44, '무료 크레딧으로 모은 실행 자원', 26, weight=600, anchor='middle'),
             text(270, 93, '클라우드 추가 결제 0원', 32, '#e7c28c', 700, 'middle'),
             '<path d="M30 116h480" stroke="#4a3927"/>']
    for name, label, x in [('aws', 'AWS', 105), ('gcp', 'GCP', 270), ('azure', 'Azure', 435)]:
        parts += [f'<rect x="{x-34}" y="140" width="68" height="68" rx="13" fill="#faf5ec"/>',
                  logo(name, x-28, 146, 56), text(x, 241, label, 27, weight=600, anchor='middle'),
                  text(x, 270, '무료 크레딧', 21, '#c9b79c', anchor='middle')]
    parts += ['<g fill="none" stroke="#c7a46c" stroke-width="2"><path d="M105 286v10q0 16 16 16h298q16 0 16-16v-10M270 286v47" marker-end="url(#arrow)"/></g>',
              '<rect x="108" y="346" width="324" height="146" rx="12" fill="url(#broker)" stroke="#a7895c"/>',
              server(270, 364), text(270, 438, 'Resource Broker', 28, weight=600, anchor='middle'),
              text(270, 473, '실행 자원 통합 · 예약', 23, '#c9b79c', anchor='middle'),
              '<g fill="none" stroke="#c7a46c" stroke-width="2"><path d="M240 510v62" marker-end="url(#arrow)"/><path d="M300 572v-62" marker-end="url(#arrow)"/></g>',
              text(218, 550, '배정', 22, '#e7c28c', anchor='end'),
              text(322, 550, '반납', 22, '#e7c28c'),
              monitor(270, 600), text(270, 684, '문제 실행', 31, weight=600, anchor='middle'),
              text(270, 718, '컨테이너 · 전용 VM', 23, '#c9b79c', anchor='middle')]
    return frame(540, 750, '\n    '.join(parts))


for filename, markup in [('cloud-credits.svg', desktop()), ('cloud-credits-mobile.svg', mobile())]:
    ET.fromstring(markup)
    (ROOT / 'assets' / filename).write_text(markup, encoding='utf-8', newline='\n')
    print(f'assets/{filename}')
