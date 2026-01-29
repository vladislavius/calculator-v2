with open('app/page.tsx', 'r') as f:
    content = f.read()

old_query = '''const { data, error } = await supabase
        .from('boat_options')
        .select('*')
        .eq('boat_id', boat.boat_id)
        .order('option_category', { ascending: true });'''

new_query = '''const { data, error } = await supabase
        .rpc('get_boat_options', { p_boat_id: Number(boat.boat_id) });'''

content = content.replace(old_query, new_query)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("RPC query updated!")
