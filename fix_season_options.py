with open('app/import/page.tsx', 'r') as f:
    content = f.read()

old_options = '''<select value={route.season} onChange={(e) => updateRoute(ri, 'season', e.target.value)} style={inputStyle}>
                            <option value="high">High</option>
                            <option value="low">Low</option>
                            <option value="peak">Peak</option>
                          </select>'''

new_options = '''<select value={route.season} onChange={(e) => updateRoute(ri, 'season', e.target.value)} style={inputStyle}>
                            <option value="high">High (Nov-Apr)</option>
                            <option value="low">Low (May-Oct)</option>
                            <option value="peak">Peak (Dec21-Jan31)</option>
                            <option value="nov_dec">Nov - Dec 19</option>
                            <option value="dec_feb">Dec 20 - Feb</option>
                            <option value="mar_apr">Mar - Apr</option>
                            <option value="may_jun">May - Jun</option>
                            <option value="jul_aug">Jul - Aug</option>
                            <option value="sep_oct">Sep - Oct</option>
                          </select>'''

if old_options in content:
    content = content.replace(old_options, new_options)
    print("Added monthly season options!")
else:
    print("Pattern not found")

with open('app/import/page.tsx', 'w') as f:
    f.write(content)
