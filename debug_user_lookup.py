#!/usr/bin/env python3

import requests
import json
import jwt as jwt_lib

# Test user lookup issue
base_url = "https://flex-enterprise-1.preview.emergentagent.com"
api_url = f"{base_url}/api"

# Step 1: Login and get token
login_response = requests.post(
    f"{api_url}/login",
    json={"username": "admin", "password": "admin123"},
    headers={'Content-Type': 'application/json'},
    timeout=10
)

if login_response.status_code == 200:
    login_data = login_response.json()
    token = login_data['access_token']
    user_info = login_data['user']
    
    print(f"Login user info: {user_info}")
    
    # Decode JWT to see what user_id is in the token
    decoded = jwt_lib.decode(token, options={"verify_signature": False})
    print(f"JWT user_id: {decoded.get('user_id')}")
    
    # Test if the user exists by trying to get users list
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    users_response = requests.get(f"{api_url}/users", headers=headers, timeout=10)
    if users_response.status_code == 200:
        users = users_response.json()
        print(f"Found {len(users)} users in database:")
        for user in users:
            print(f"  - ID: {user['id']}, Username: {user['username']}, Role: {user['role']}")
            if user['id'] == decoded.get('user_id'):
                print(f"    ✅ This matches the JWT user_id!")
    
    # Now test a simple endpoint that uses get_current_user
    print(f"\nTesting an endpoint that uses get_current_user...")
    
    # Try creating a user (this should work if get_current_user works)
    test_user_data = {
        "username": f"debugtest_{json.dumps({})}",
        "password": "testpass123",
        "role": "employee"
    }
    
    create_response = requests.post(
        f"{api_url}/users",
        json=test_user_data,
        headers=headers,
        timeout=10
    )
    
    print(f"Create user status: {create_response.status_code}")
    if create_response.status_code != 200:
        print(f"Create user error: {create_response.text}")
    else:
        print("✅ get_current_user works for user creation endpoint")
        # Clean up
        created_user = create_response.json()
        requests.delete(f"{api_url}/users/{created_user['id']}", headers=headers, timeout=10)

else:
    print(f"Login failed: {login_response.text}")