"""Render the same technology groups in the README and platform page."""
from pathlib import Path
from html import escape
import json
import re

ROOT=Path(__file__).resolve().parent.parent
data=json.loads((ROOT/'data/tech-stack.json').read_text(encoding='utf-8'))
rows=[]
groups=[]
for group in data['groups']:
    icons=[]
    tiles=[]
    for item in group['items']:
        assert (ROOT/item['icon']).is_file()
        name=escape(item['name'],quote=True)
        src=escape(item['icon'],quote=True)
        icons.append(f'<img src="{src}" width="44" height="44" alt="{name}" title="{name}">')
        tiles.append(f'<li><img src="{src}" width="52" height="52" loading="lazy" decoding="async" alt=""><span>{escape(item["name"])}</span></li>')
    names=' · '.join(escape(item['name']) for item in group['items'])
    extra='<br><sub>'+escape(group['note'])+'</sub>' if group.get('note') else ''
    rows.append(f'<tr><th align="left" width="135">{escape(group["label"])}</th><td align="center" width="640"><p>{" &nbsp; ".join(icons)}<br><sub>{names}</sub>{extra}</p></td></tr>')
    note='<p class="tech-note">'+escape(group['note'])+'</p>' if group.get('note') else ''
    groups.append(f'<section class="tech-group" data-tech-group="{group["id"]}" aria-labelledby="tech-{group["id"]}"><h4 id="tech-{group["id"]}">{escape(group["label"])}</h4><ul class="tech-items">{"".join(tiles)}</ul>{note}</section>')

def replace(path,body):
    content=path.read_text(encoding='utf-8')
    content,count=re.subn(r'<!-- TECH_STACK -->.*?<!-- END_TECH_STACK -->',lambda _: '<!-- TECH_STACK -->\n'+body+'\n<!-- END_TECH_STACK -->',content,flags=re.S)
    assert count==1,path
    path.write_text(content,encoding='utf-8')

replace(ROOT/'README.md','<table align="center">\n'+'\n'.join(rows)+'\n</table>')
replace(ROOT/'platform.html','<div class="tech-grid">\n'+'\n'.join(groups)+'\n</div>')
print(f'Rendered {len(groups)} technology groups and {sum(len(g["items"]) for g in data["groups"])} icons')
