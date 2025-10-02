#!/usr/bin/env python3
import requests
import sys

def create_michael_customer():
    """Create a test customer named Michael Johnson for frontend testing"""
    
    base_url = "https://spatracker-1.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Login first
    print("🔐 Logging in as admin...")
    login_response = requests.post(
        f"{api_url}/login",
        json={"username": "admin", "password": "admin123"},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json()['access_token']
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    # Create Michael Johnson customer
    print("👤 Creating Michael Johnson customer...")
    customer_data = {
        "first_name": "Michael",
        "last_name": "Johnson", 
        "id_number": "MICHAEL123456",
        "date_of_birth": "1985-03-15",
        "id_expiration_date": "2026-03-15",
        "state_of_id": "CA"
    }
    
    response = requests.post(
        f"{api_url}/customers",
        json=customer_data,
        headers=headers
    )
    
    if response.status_code == 200:
        customer = response.json()
        print(f"✅ Created customer: {customer['first_name']} {customer['last_name']} (ID: {customer['id']})")
        return True
    elif response.status_code == 400 and "already exists" in response.text:
        print("✅ Michael Johnson customer already exists")
        return True
    else:
        print(f"❌ Failed to create customer: {response.status_code} - {response.text}")
        return False

if __name__ == "__main__":
    success = create_michael_customer()
    sys.exit(0 if success else 1)