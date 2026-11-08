"""Render role-based GitHub credits from the public, allowlisted team data."""
from html import escape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'data/platform-team.json').read_text(encoding='utf-8'))
profiles = {person['login']: person for person in data['profiles']}
assigned = [login for role in data['roles'] for login in role['members']]
assert len(assigned) == len(set(assigned)) and set(assigned) == set(profiles)
assert len({role['id'] for role in data['roles']}) == len(data['roles'])

groups = []
for role in data['roles']:
    people = []
    for login in role['members']:
        person = profiles[login]
        assert person['url'] == 'https://github.com/' + login
        assert person['avatar'].startswith('https://avatars.githubusercontent.com/u/')
        people.append(f'''<li><a class="role-person" href="{escape(person['url'], quote=True)}"><img class="avatar" src="{escape(person['avatar'], quote=True)}" width="40" height="40" loading="lazy" decoding="async" alt=""><span>@{escape(login)}</span></a></li>''')
    role_id = escape(role['id'], quote=True)
    groups.append(f'''<section class="role-group" aria-labelledby="role-{role_id}" data-role="{role_id}">
          <h3 id="role-{role_id}">{escape(role['label'])}</h3>
          <ul class="role-people">{''.join(people)}</ul>
        </section>''')

target = ROOT / 'platform.html'
html = target.read_text(encoding='utf-8')
html, count = re.subn(r'<!-- ROLE_DIRECTORY -->.*?<!-- END_ROLE_DIRECTORY -->',
    lambda _: '<!-- ROLE_DIRECTORY -->\n' + '\n'.join(groups) + '\n<!-- END_ROLE_DIRECTORY -->',
    html, flags=re.S)
assert count == 1
target.write_text(html, encoding='utf-8')
print(f'Rendered {len(groups)} roles and {len(assigned)} GitHub profiles')
