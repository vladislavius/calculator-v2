with open('app/api/analyze-contract/route.ts', 'r') as f:
    content = f.read()

# Find the season mapping section and expand it
old_season = 'season: low=May-Oct, high=Nov-Apr, peak=Dec21-Jan31'

new_season = '''season - TWO FORMATS supported:
      a) Standard seasons: "low" (May-Oct), "high" (Nov-Apr), "peak" (Dec21-Jan31)
      b) Monthly seasons: "nov_dec" (Nov 1 - Dec 19), "dec_feb" (Dec 20 - Feb), "mar_apr" (Mar - Apr), "may_jun" (May - Jun), "jul_aug" (Jul - Aug), "sep_oct" (Sep - Oct)
      Use monthly format if contract shows prices by month ranges'''

if old_season in content:
    content = content.replace(old_season, new_season)
    print("Updated season mapping with both formats!")
else:
    # Try simpler pattern
    if "season:" in content and "low=May-Oct" in content:
        content = content.replace("low=May-Oct, high=Nov-Apr, peak=Dec21-Jan31", 
            '''TWO FORMATS:
      a) "low"/"high"/"peak" - standard
      b) "nov_dec"/"dec_feb"/"mar_apr"/"may_jun"/"jul_aug"/"sep_oct" - monthly''')
        print("Updated season mapping (alt)!")
    else:
        print("Season pattern not found")

with open('app/api/analyze-contract/route.ts', 'w') as f:
    f.write(content)

print("Done!")
