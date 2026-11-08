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
for role in data['roles']:
    assert role['repositories']
    assert all(repo['url'].startswith('https://github.com/MSG-CTF/') for repo in role['repositories'])

GITHUB_ICON = '<span class="github-icon" aria-hidden="true"></span>'


def repository_link(label, url, css='role-repository'):
    return (f'<a class="{css}" href="{escape(url, quote=True)}" '
            f'aria-label="{escape(label, quote=True)} GitHub">{escape(label)}{GITHUB_ICON}</a>')


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
          <div><h3 id="role-lead">{repository_link(lead['label'], lead['url'])}</h3>
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
    primary, *extra = role['repositories']
    extra_links = ('<div class="role-resources">' + ''.join(repository_link(repo['label'], repo['url']) for repo in extra) + '</div>') if extra else ''
    groups.append(f'''<section class="role-group" aria-labelledby="role-{role_id}" data-role="{role_id}">
          <h3 id="role-{role_id}">{repository_link(role['label'], primary['url'])}</h3>
          <p class="role-scope">{escape(role['scope'])}</p>{extra_links}
          <ul class="role-people">{''.join(people)}</ul>
        </section>''')

replace_block(ROOT / 'platform.html', 'ROLE_DIRECTORY',
    lead_html + '\n<div class="role-directory">\n' + '\n'.join(groups) + '\n</div>')


def readme_person(login):
    person = profiles[login]
    url = escape(person['url'], quote=True)
    parts = person['duty'].split(' · ')
    duty = escape(parts[0]) + ('<br>' + escape(' · '.join(parts[1:])) if len(parts) > 1 else '')
    return (f'<a href="{url}"><img src="{escape(person["avatar"], quote=True)}" '
            f'width="52" height="52" alt="{escape(login, quote=True)}"></a><br>'
            f'<b>{escape(login)}</b><br><sub>{duty}</sub>')


def readme_role(role, colspan=1):
    primary, *extra = role['repositories']
    heading = f'<a href="{escape(primary["url"], quote=True)}">{escape(role["label"])}</a>'
    extra_links = ' &nbsp; <sub>' + ' · '.join(f'<a href="{escape(repo["url"], quote=True)}">{escape(repo["label"])}</a>' for repo in extra) + '</sub>' if extra else ''
    return f'<th align="center" colspan="{colspan}">{heading}{extra_links}</th>'


roles = {role['id']: role for role in data['roles']}
credits = [f'''<p align="center"><a href="{escape(leader['url'], quote=True)}"><img src="{escape(leader['avatar'], quote=True)}" width="48" height="48" align="absmiddle" alt="{escape(leader['login'], quote=True)}"></a> &nbsp; <b>{escape(leader['login'])}</b> · <a href="{escape(lead['url'], quote=True)}"><b>{escape(lead['label'])}</b></a><br><sub>{escape(leader['duty'])}</sub></p>''']
rows = []
for key in ['frontend', 'backend', 'devsecops']:
    role = roles[key]
    cells = [f'<td align="center" valign="top" colspan="{12 // len(role["members"])}" width="{780 // len(role["members"])}">{readme_person(login)}</td>' for login in role['members']]
    rows.append('<tr>' + readme_role(role, 12) + '</tr>\n<tr>\n' + '\n'.join(cells) + '\n</tr>')
remaining = [roles[key] for key in ['broker', 'scheduler', 'runtime', 'sla']]
headers = ''.join(readme_role(role, 3) for role in remaining)
cells = [f'<td align="center" valign="top" colspan="3" width="195">{readme_person(role["members"][0])}</td>' for role in remaining]
assert all(len(role['members']) == 1 for role in remaining)
rows.append('<tr>' + headers + '</tr>\n<tr>\n' + '\n'.join(cells) + '\n</tr>')
credits.append('<table align="center">\n' + '\n'.join(rows) + '\n</table>')
replace_block(ROOT / 'README.md', 'TEAM_CREDITS', '\n\n'.join(credits))
print(f'Rendered lead + {len(groups)} teams, {len(assigned)} GitHub profiles in website and README')
