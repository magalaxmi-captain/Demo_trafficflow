from pathlib import Path

source = Path(__file__).resolve().parent
html = (source / 'page.html').read_text(encoding='utf-8')
for marker, filename in [('MODEL_SCRIPT', 'model.js'), ('UI_SCRIPT', 'ui.js')]:
    html = html.replace('<!-- ' + marker + ' -->', '<script>\n' + (source / filename).read_text(encoding='utf-8') + '\n</script>')
output = source.parent / 'KMeans-Predictor.html'
output.write_text(html, encoding='utf-8')
print('Created', output)
