import docx
import json

doc = docx.Document('Patent_Granting_Concurrence_Form-III.docx')
data = {
    'paragraphs': [p.text for p in doc.paragraphs],
    'tables': []
}
for t in doc.tables:
    t_data = []
    for r in t.rows:
        t_data.append([c.text for c in r.cells])
    data['tables'].append(t_data)

with open('form3_concurrence_dump.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Dumped successfully!')
