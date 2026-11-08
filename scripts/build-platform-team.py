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


def readme_person(login, role_label=''):
    person = profiles[login]
    url = escape(person['url'], quote=True)
    profile = (f'<a href="{url}"><img src="{escape(person["avatar"], quote=True)}" '
               f'width="28" height="28" align="absmiddle" alt="{escape(login, quote=True)}"> {escape(login)}</a>')
    return f'| {escape(role_label)} | {profile} | {escape(person["duty"])} |'


credits = ['| 팀 | 참여자 | 맡은 일 |', '| --- | --- | --- |', readme_person(lead['login'], lead['label'])]
for role in data['roles']:
    credits.extend(readme_person(login, role['label'] if i == 0 else '') for i, login in enumerate(role['members']))
replace_block(ROOT / 'README.md', 'TEAM_CREDITS', '\n' + '\n'.join(credits) + '\n')
print(f'Rendered lead + {len(groups)} teams, {len(assigned)} GitHub profiles in website and README')
