import requests

# 1. Login as alan.turing
url_base = 'http://127.0.0.1:8000/api'
login_data = {
    'username': 'alan.turing',
    'password': 'testpass123'
}

response = requests.post(f"{url_base}/auth/login/", json=login_data)
if response.status_code != 200:
    print("Login failed:", response.json())
    exit(1)

tokens = response.json()
access_token = tokens.get('access')
print("Successfully logged in. Access token obtained.")

# 2. Get active offices/assignments for Alan Turing
headers = {
    'Authorization': f"Bearer {access_token}"
}

profile_response = requests.get(f"{url_base}/auth/me/", headers=headers)
print("Profile details:")
profile = profile_response.json()
print("Staff Profile:", profile.get('staff_profile'))

# Let's search/get Alan's assignments
assignments_response = requests.get(f"{url_base}/assignments/", headers=headers)
assignments = assignments_response.json()
print("\nAssignments fetched:", assignments)

# Let's search offices
offices_response = requests.get(f"{url_base}/offices/search/", headers=headers)
offices = offices_response.json().get('results', [])
turing_office = None
for o in offices:
    if o.get('room_number') == 'CR128' and 'Turing' in o.get('building_name', ''):
        turing_office = o
        break

if not turing_office:
    print("Could not find CR128 office in Turing Hall")
    # Just take the first office
    if offices:
        turing_office = offices[0]

print("\nUsing office:", turing_office)

# 3. Post equipment request
if turing_office:
    req_data = {
        'office': turing_office['id'],
        'asset_type': 'computer',
        'quantity': 1,
        'reason': 'Need a new computer for research',
        'status': 'pending'
    }
    
    req_response = requests.post(f"{url_base}/equipment-requests/", json=req_data, headers=headers)
    print("\nEquipment request response (Status Code:", req_response.status_code, "):")
    print(req_response.json())
