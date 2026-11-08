"""Render the share thumbnail with the site's original artwork and font.

Requires Python Playwright and its Chromium browser. Only the generated JPEG is
needed when serving the site; sharing does not depend on JavaScript or fonts.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'assets/social/msg-ctf-2026-share.jpg'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
    page.goto((ROOT / 'scripts/social-card.html').as_uri(), wait_until='load')
    page.evaluate('''async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
    }''')
    assert page.evaluate("document.fonts.check('32px MSG')")
    page.screenshot(path=str(OUTPUT), type='jpeg', quality=91)
    browser.close()

print(f'{OUTPUT.relative_to(ROOT)}: 1200 x 630, {OUTPUT.stat().st_size:,} bytes')
