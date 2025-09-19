#!/usr/bin/env python3
"""
Test customer rejection functionality
"""

import requests
import json
from datetime import datetime

def test_rejection():
    base_url = "https://flexspa-dashboard.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Login
    response = requests.post(
        f"{api_url}/login",
        json={"username": "admin", "password": "admin123"},
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    
    if response.status_code != 200:
        print("❌ Login failed")
        return False
    
    token = response.json()['access_token']
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    print("✅ Logged in successfully")
    
    # Create a pending customer
    customer_data = {
        "first_name": "Reject",
        "last_name": "TestCustomer",
        "id_number": f"REJECT{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "date_of_birth": "1990-01-01",
        "id_expiration_date": "2026-01-01",
        "state_of_id": "CA"
    }
    
    response = requests.post(
        f"{api_url}/customers/public",
        json=customer_data,
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    
    if response.status_code != 200:
        print("❌ Failed to create pending customer")
        return False
    
    pending_id = response.json().get('id')
    print(f"✅ Created pending customer: {pending_id}")
    
    # Test rejection
    response = requests.delete(
        f"{api_url}/pending-customers/{pending_id}",
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        print("✅ Customer rejection successful")
        
        # Verify customer is no longer in pending list
        response = requests.get(
            f"{api_url}/pending-customers",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            pending_customers = response.json()
            still_pending = any(c.get('id') == pending_id for c in pending_customers)
            if not still_pending:
                print("✅ Customer successfully removed from pending list")
                return True
            else:
                print("❌ Customer still in pending list after rejection")
                return False
        else:
            print("❌ Could not verify pending list")
            return False
    else:
        print(f"❌ Customer rejection failed: {response.status_code} - {response.text}")
        return False

if __name__ == "__main__":
    success = test_rejection()
    print(f"\n📊 Rejection Test: {'PASSED' if success else 'FAILED'}")
    exit(0 if success else 1)