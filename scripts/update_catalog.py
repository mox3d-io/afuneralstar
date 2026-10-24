"""Refresh the hand-maintained Pages catalog. Local files only; never deploys.
Run from any directory: python scripts/update_catalog.py
The historical build.mjs predates later site changes; do not use it for this draft.
"""
from pathlib import Path
import re, json
from html import escape as esc
ROOT = Path(__file__).resolve().parents[1]
GROUPS = [
 ('Collapse Trilogy', [('Consumed by a Funeral Star','consumed','consumed-cover.webp','Cosmic'),('Homeless and Hopeless','homeless','homeless-cover.webp','Civic'),('The Land of Silver and Sorrow','silver-and-sorrow','silver-cover.webp','Romantic')]),
 ('Ignite Trilogy', [('Now We Ignite','now-we-ignite','now-we-ignite-cover.webp','Cosmic'),('Monuments','monuments','monuments-cover.webp','Civic'),('Saudade By The Sea','saudade-by-the-sea','saudade-cover-thumb.webp','Romantic')]),
 ('The Endless Night Trilogy', [('A Scar In The Star','a-scar-in-the-star','scar-cover.webp','Cosmic'),('Survive Until Dawn','survive-until-dawn','survive-cover.webp','Civic'),('The Endless Night',None,None,'Romantic')]),
 ('EPs', [('Hell Joseon','hell-joseon','HellJoseon.webp','Civic'),('Plomo y Polvo: Reyna','reyna','reyna-eyes.webp','Romantic'),('Entropy Cuts','entropy-cuts','entropycuts.webp','Cosmic')]),
]
def catalog():
 out = '<div class="catalog catalog-refresh"><div class="catalog-head"><h2>Discography</h2></div>'
 for group, items in GROUPS:
  out += f'<section class="trilogy" aria-label="{group}"><h3 class="trilogy-label">{group}</h3><div class="icons">'
  for title,slug,cover,theme in items:
   art = f'<img loading="lazy" decoding="async" width="600" height="600" src="/assets/img/{cover}" alt="{esc(title)}">' if cover else '<span>Coming soon</span>'
   content=f'<span class="icon-art">{art}</span><span class="icon-name">{esc(title)}</span><span class="icon-sub">{theme}</span>'
   out += f'<a class="icon" href="/releases/{slug}/">{content}</a>' if slug else f'<div class="icon is-coming">{content}</div>'
  out += '</div></section>'
 return out+'</div>'
def meta(html,title,description,url,image='sitebanner.webp'):
 html=re.sub(r'<title>.*?</title>',f'<title>{esc(title)}</title>',html,count=1)
 for key,value in [('description',description),('og:title',title),('twitter:title',title),('og:description',description),('twitter:description',description),('og:url',url),('og:image',f'https://afuneralstar.com/assets/img/{image}'),('twitter:image',f'https://afuneralstar.com/assets/img/{image}')]:
  html=re.sub(r'(<meta (?:name|property)="'+re.escape(key)+r'" content=")[^"]*',lambda m:m[1]+esc(value,quote=True),html)
 return re.sub(r'(<link rel="canonical" href=")[^"]*',lambda m:m[1]+url,html)
# Preserve the established site shell and analytics, replacing only homepage content.
p=ROOT/'index.html';html=p.read_text()
intro='<header class="catalog-intro"><h1>A Funeral Star</h1></header>'
html=re.sub(r'(<section class="view is-active home"[^>]*>).*?(?=<div class="home-connect">)',lambda m:m[1]+intro+catalog()+'\n',html,flags=re.S)
html=re.sub(r'<script>\s*\(function\(\)\{.*?saudade_hero_view.*?</script>','',html,flags=re.S)
html=meta(html,'A Funeral Star | Discography','Explore the Collapse, Ignite, and Endless Night trilogies, plus EPs from A Funeral Star. Cosmic, Civic, Romantic.','https://afuneralstar.com/')
# Bring homepage structured catalog metadata up to date as well.
def schema(m):
 d=json.loads(m[1]);d['album']=[{'@type':'MusicAlbum','name':t,'url':f'https://afuneralstar.com/releases/{s}/','image':f'https://afuneralstar.com/assets/img/{c}'} for _,items in GROUPS for t,s,c,_ in items if s]
 return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False,indent=2)+'</script>'
html=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,html,count=1,flags=re.S)
html=html.replace('data-page="catalog-home"','data-page="home"').replace('<em>and</em>', 'and')
if '<div class="banner-top" data-banner-slot>' not in html:
 html=html.replace('<main class="stage" id="stage">', '<main class="stage" id="stage"><div class="banner-top" data-banner-slot></div>', 1)
if '<div class="banner-slot" data-banner-slot' not in html:
 html=html.replace('</section>\n    </main>', '<div class="banner-slot" data-banner-slot aria-label="Merch"></div></section>\n    </main>', 1)
p.write_text(html)
# Use the same catalog on the existing Releases directory.
p=ROOT/'releases/index.html';html=p.read_text()
html=re.sub(r'(<main\b[^>]*>).*?(</main>)',lambda m:m[1]+'<section class="view is-active">'+catalog()+'</section>'+m[2],html,flags=re.S)
html=meta(html,'Releases | A Funeral Star','Albums and EPs from A Funeral Star: Cosmic, Civic, Romantic.','https://afuneralstar.com/releases/')
p.write_text(html)
# New internal album destinations use the existing release-page shell.
template=(ROOT/'releases/reyna/index.html').read_text()
for title,slug,cover,theme,group,url,label in [
 ('Saudade By The Sea','saudade-by-the-sea','saudade-cover.webp','Romantic','Ignite Trilogy','https://open.spotify.com/album/0kfIUzgoyonRVuvGVN5EOP','Listen on Spotify'),
 ('Survive Until Dawn','survive-until-dawn','survive-cover.webp','Civic','The Endless Night Trilogy','https://distrokid.com/hyperfollow/afuneralstar/survive-until-dawn','Streaming services')]:
 h=meta(template,title+' | A Funeral Star',f'{title} by A Funeral Star. {theme} · {group}.',f'https://afuneralstar.com/releases/{slug}/',cover)
 h=re.sub(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@type':'MusicAlbum','name':title,'byArtist':{'@type':'MusicGroup','name':'A Funeral Star'},'url':f'https://afuneralstar.com/releases/{slug}/','image':f'https://afuneralstar.com/assets/img/{cover}'})+'</script>',h,flags=re.S)
 h=h.replace('data-page="release-reyna"',f'data-page="release-{slug}"')
 body=f'''<section class="view is-active" aria-label="{title}"><div class="album"><div class="album-cover"><img class="album-art" src="/assets/img/{cover}" width="600" height="600" alt="{title} album art"><div class="album-meta"><p class="album-eyebrow">{theme} · {group}</p><h1 class="album-title">{title}</h1><nav class="hero-links" aria-label="Listen"><a class="hero-link is-primary" href="{url}" target="_blank" rel="noopener" data-album="{title}" data-platform="{'Spotify' if 'spotify' in url else 'HyperFollow'}">{label}</a></nav></div></div></div><div class="view-continue"><a href="/releases/">All releases →</a></div></section>'''
 h=re.sub(r'(<main\b[^>]*>).*?(</main>)',lambda m:m[1]+body+m[2],h,flags=re.S)
 out=ROOT/'releases'/slug;out.mkdir(exist_ok=True);(out/'index.html').write_text(h)
# Keep common navigation consistent across public site pages, never campaign pages.
nav='';foot=''
for group,items in GROUPS:
 nav+=f'<p class="menu-label">{group}</p>'
 foot+=f'<div class="foot-col"><p class="foot-col-label">{group}</p>'
 for title,slug,cover,theme in items:
  if slug:
   nav+=f'<a class="menu-link" href="/releases/{slug}/">{esc(title)}</a>'
   foot+=f'<a href="/releases/{slug}/">{esc(title)}</a>'
  else:
   nav+=f'<span class="menu-link">{title} · Coming soon</span>'
   foot+=f'<span>{title} · Coming soon</span>'
 foot+='</div>'
public_dirs={'about','releases','lyrics','merch','mailing-list','privacy','data-deletion','romantic-ignition','gallery','videos'}
for p in ROOT.rglob('*.html'):
 rel=p.relative_to(ROOT)
 if len(rel.parts)>1 and rel.parts[0] not in public_dirs:continue
 h=p.read_text()
 h=re.sub(r'<p class="menu-label">(?:Latest|Ignition|Collapse(?: Trilogy)?|Ignite Trilogy)</p>.*?(?=<p class="menu-label">Browse</p>)',nav,h,flags=re.S)
 h=re.sub(r'(<div class="foot-cols">).*?(?=<div class="foot-col">\s*<p class="foot-col-label">Browse</p>)',lambda m:m[1]+foot,h,flags=re.S)
 h=h.replace('href="/releases/now-we-ignite/" aria-current="page">Releases','href="/releases/" aria-current="page">Releases').replace('href="/releases/now-we-ignite/">Releases','href="/releases/">Releases')
 # About prose is explicitly reserved for a later workshop.
 if rel.parts[0]!='about':h=h.replace('Societal','Civic').replace('Other Transmissions','EPs')
 h=h.replace('/assets/img/ReynaCut.webp','/assets/img/reyna-eyes.webp')
 p.write_text(h)
# Include the two new released albums in the sitemap.
p=ROOT/'sitemap.xml';s=p.read_text()
for slug in ['saudade-by-the-sea','survive-until-dawn']:
 u=f'https://afuneralstar.com/releases/{slug}/'
 if u not in s:s=s.replace('</urlset>',f'<url><loc>{u}</loc></url>\n</urlset>')
p.write_text(s)
print('Catalog refreshed locally. No publication performed.')

# Preserve the former announcement URL without its obsolete unreleased copy.
(ROOT/'romantic-ignition/index.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Saudade By The Sea | A Funeral Star</title><link rel="canonical" href="https://afuneralstar.com/releases/saudade-by-the-sea/"><meta http-equiv="refresh" content="0;url=/releases/saudade-by-the-sea/"></head><body><a href="/releases/saudade-by-the-sea/">Saudade By The Sea — album page</a></body></html>')

# Keep generated markup whitespace-clean.
p=ROOT/"index.html"
p.write_text("\n".join(line.rstrip() for line in p.read_text().splitlines())+"\n")

# Author-written album descriptions are maintained independently of layout.
summaries = json.loads((ROOT/'content/catalog/album-summaries.json').read_text())
for slug, summary in summaries.items():
 p = ROOT/'releases'/slug/'index.html'
 html = p.read_text()
 blurb = '<p class="album-blurb">'+esc(summary)+'</p>'
 if re.search(r'<p class="album-blurb">.*?</p>', html, flags=re.S):
  html = re.sub(r'<p class="album-blurb">.*?</p>', lambda m: blurb, html, count=1, flags=re.S)
 else:
  html, count = re.subn(r'(<h1 class="album-title">.*?</h1>)', lambda m: m[1]+blurb, html, count=1, flags=re.S)
  assert count == 1, slug
 p.write_text(html)
