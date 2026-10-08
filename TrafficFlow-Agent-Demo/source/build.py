from pathlib import Path
source = Path(__file__).resolve().parent
html = (source / 'page.html').read_text(encoding='utf-8')
for marker, file in [('ENGINE_SCRIPT', 'engine.js'), ('APP_SCRIPT', 'app.js')]:
    html = html.replace('<!-- ' + marker + ' -->', '<script>\n' + (source / file).read_text(encoding='utf-8') + '\n</script>')
target = source.parent / 'TrafficFlow-Agent-Demo.html'
target.write_text(html, encoding='utf-8')
print(target)
