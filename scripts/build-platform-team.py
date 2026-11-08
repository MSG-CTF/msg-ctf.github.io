"""Keep the website and README team credits in sync."""
from html import escape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'data/platform-team.json').read_text(encoding='utf-8'))
profiles = {person['login']: person for person in data['profiles']}
lead = data['lead']
assigned = [lead['login']] + [login for role in data['roles'] for login in role['members']]
assert len(assigned) == len(set(assigned)) and set(assigned) == set(profiles)
assert len({role['id'] for role in data['roles']}) == len(data['roles'])
for person in profiles.values():
    assert person['url'] == 'https://github.com/' + person['login']
    assert person['avatar'].startswith('https://avatars.githubusercontent.com/u/')
    assert person['duty']


def avatar(person, size=52):
    return (f'<img class="avatar" src="{escape(person["avatar"], quote=True)}" '
            f'width="{size}" height="{size}" loading="lazy" decoding="async" alt="">')


def replace_block(path, marker, body):
    content = path.read_text(encoding='utf-8')
    content, count = re.subn(r'<!-- ' + marker + r' -->.*?<!-- END_' + marker + r' -->',
        lambda _: f'<!-- {marker} -->\n{body}\n<!-- END_{marker} -->', content, flags=re.S)
    assert count == 1, path
    path.write_text(content, encoding='utf-8')


leader = profiles[lead['login']]
lead_html = f'''<section class="team-lead" aria-labelledby="role-lead">
          {avatar(leader, 80)}
          <div><h3 id="role-lead">{escape(lead['label'])}</h3>
            <a class="role-person" href="{escape(leader['url'], quote=True)}"><span class="role-name">@{escape(leader['login'])}</span></a>
            <p>{escape(leader['duty'])}</p>
          </div>
        </section>'''

groups = []
for role in data['roles']:
    people = []
    for login in role['members']:
        person = profiles[login]
        people.append(f'''<li><a class="role-person" href="{escape(person['url'], quote=True)}">{avatar(person)}<span class="role-copy"><span class="role-name">@{escape(login)}</span><span class="role-duty">{escape(person['duty'])}</span></span></a></li>''')
    role_id = escape(role['id'], quote=True)
    groups.append(f'''<section class="role-group" aria-labelledby="role-{role_id}" data-role="{role_id}">
          <h3 id="role-{role_id}">{escape(role['label'])}</h3>
          <p class="role-scope">{escape(role['scope'])}</p>
          <ul class="role-people">{''.join(people)}</ul>
        </section>''')

replace_block(ROOT / 'platform.html', 'ROLE_DIRECTORY',
    lead_html + '\n<div class="role-directory">\n' + '\n'.join(groups) + '\n</div>')


def readme_person(login, size=60, label=''):
    person = profiles[login]
    url = escape(person['url'], quote=True)
    duty = '<br>'.join(escape(part) for part in person['duty'].split(' · '))
    role = f'<br><sub><b>{escape(label)}</b></sub>' if label else ''
    return (f'<p align="center"><a href="{url}"><img src="{escape(person["avatar"], quote=True)}" '
            f'width="{size}" height="{size}" alt="{escape(login, quote=True)}"></a><br>'
            f'<b>{escape(login)}</b>{role}<br><sub>{duty}</sub></p>')


roles = {role['id']: role for role in data['roles']}
credits = [f'<table align="center"><tr><td align="center" width="240">{readme_person(lead["login"], 80, lead["label"])}</td></tr></table>']
for row in [['frontend', 'backend', 'devsecops'], ['broker', 'scheduler', 'runtime', 'sla']]:
    cells = []
    for key in row:
        role = roles[key]
        people = '\n'.join(readme_person(login) for login in role['members'])
        cells.append(f'<td align="center" valign="top" width="{780 // len(row)}"><h3>{escape(role["label"])}</h3><p><sub>{escape(role["scope"])}</sub></p>\n{people}</td>')
    credits.append('<table align="center"><tr>\n' + '\n'.join(cells) + '\n</tr></table>')
replace_block(ROOT / 'README.md', 'TEAM_CREDITS', '\n\n'.join(credits))
print(f'Rendered lead + {len(groups)} teams, {len(assigned)} GitHub profiles in website and README')
