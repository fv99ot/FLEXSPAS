#!/usr/bin/env python3

import requests
import json

# Test the password endpoint step by step
base_url = "https://flexspa-dashboard.preview.emergentagent.com"
api_url = f"{base_url}/api"

# Step 1: Login
print("Step 1: Login...")
login_response = requests.post(
    f"{api_url}/login",
    json={"username": "admin", "password": "admin123"},
    headers={'Content-Type': 'application/json'},
    timeout=10
)

print(f"Login Status: {login_response.status_code}")
if login_response.status_code == 200:
    login_data = login_response.json()
    token = login_data['access_token']
    user_info = login_data['user']
    print(f"Token obtained: {token[:50]}...")
    print(f"User info: {user_info}")
    
    # Step 2: Test getting current user info (if such endpoint exists)
    print("\nStep 2: Test authentication...")
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    # Try to get users list to verify token works
    users_response = requests.get(f"{api_url}/users", headers=headers, timeout=10)
    print(f"Users endpoint status: {users_response.status_code}")
    
    # Step 3: Test password change endpoint
    print("\nStep 3: Test password change endpoint...")
    password_response = requests.put(
        f"{api_url}/users/me/password",
        json={
            "current_password": "wrongpassword",
            "new_password": "newpass123"
        },
        headers=headers,
        timeout=10
    )
    
    print(f"Password change status: {password_response.status_code}")
    print(f"Password change response: {password_response.text}")
    
    # Step 4: Check if the issue is with the JWT parsing
    print(f"\nStep 4: Debug JWT token...")
    import jwt as jwt_lib
    try:
        # Try to decode the JWT (we don't have the secret, but we can see the payload structure)
        decoded = jwt_lib.decode(token, options={"verify_signature": False})
        print(f"JWT payload: {decoded}")
    except Exception as e:
        print(f"JWT decode error: {e}")

else:
    print(f"Login failed: {login_response.text}")