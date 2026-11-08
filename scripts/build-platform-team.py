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


def readme_person(login):
    person = profiles[login]
    url = escape(person['url'], quote=True)
    return (f'<tr><td width="78"><a href="{url}"><img src="{escape(person["avatar"], quote=True)}" '
            f'width="48" height="48" alt="{escape(login, quote=True)}"></a></td>'
            f'<td><a href="{url}"><strong>{escape(login)}</strong></a><br>{escape(person["duty"])}</td></tr>')


roles = {role['id']: role for role in data['roles']}


def readme_teams(ids):
    cells = []
    for role_id in ids:
        role = roles[role_id]
        people = '\n'.join(readme_person(login) for login in role['members'])
        cells.append(f'''<td valign="top" width="{100 // len(ids)}%">
<h3>{escape(role['label'])}</h3>
<p>{escape(role['scope'])}</p>
<table>{people}</table>
</td>''')
    return '<table align="center"><tr>\n' + '\n'.join(cells) + '\n</tr></table>'


credits = f'''<div align="center">
<h3>{escape(lead['label'])}</h3>
<a href="{escape(leader['url'], quote=True)}"><img src="{escape(leader['avatar'], quote=True)}" width="80" height="80" alt="{escape(leader['login'], quote=True)}"></a>
<p><a href="{escape(leader['url'], quote=True)}"><strong>{escape(leader['login'])}</strong></a><br>{escape(leader['duty'])}</p>
</div>

'''
credits += '\n\n'.join(readme_teams(ids) for ids in [
    ['frontend', 'backend'], ['broker', 'scheduler', 'runtime'], ['devsecops', 'sla']])
replace_block(ROOT / 'README.md', 'TEAM_CREDITS', credits)
print(f'Rendered lead + {len(groups)} teams, {len(assigned)} GitHub profiles in website and README')
