#!/usr/bin/env python3
"""
Direct test of the membership form public endpoint
This bypasses the UI routing issue and tests the backend directly
"""

import requests
import json
from datetime import datetime

def test_membership_form_backend():
    """Test the public membership form endpoint directly"""
    
    base_url = "https://flexspa-manager-1.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🔍 Testing QR Membership Form Backend Directly")
    print(f"🌐 Testing against: {base_url}")
    
    # Generate unique test data
    unique_id = f"QR_DIRECT_TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    customer_data = {
        "first_name": "Michael",
        "last_name": "DirectTest",
        "id_number": unique_id,
        "date_of_birth": "1990-01-01",
        "id_expiration_date": "2025-12-31",
        "state_of_id": "CA"
    }
    
    try:
        # Test the public endpoint (should work without authentication)
        response = requests.post(
            f"{api_url}/customers/public",
            json=customer_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: QR Membership Form Backend Working!")
            print(f"   Customer Created: {data['first_name']} {data['last_name']}")
            print(f"   Customer ID: {data['id']}")
            print(f"   ID Number: {data['id_number']}")
            return True
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_cors_headers():
    """Test CORS headers for the membership endpoint"""
    
    base_url = "https://flexspa-manager-1.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("\n🔍 Testing CORS Headers for Public Endpoint")
    
    try:
        # Test OPTIONS request (preflight)
        response = requests.options(
            f"{api_url}/customers/public",
            headers={
                'Origin': 'https://flexspa-manager-1.preview.emergentagent.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            },
            timeout=10
        )
        
        print(f"OPTIONS Response Status: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        if response.status_code in [200, 204]:
            print("✅ CORS preflight successful")
            return True
        else:
            print(f"❌ CORS preflight failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("QR MEMBERSHIP FORM - DIRECT BACKEND TEST")
    print("=" * 60)
    
    backend_success = test_membership_form_backend()
    cors_success = test_cors_headers()
    
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print(f"Backend Endpoint: {'✅ WORKING' if backend_success else '❌ FAILED'}")
    print(f"CORS Configuration: {'✅ WORKING' if cors_success else '❌ FAILED'}")
    
    if backend_success:
        print("\n🎉 The QR Membership Form backend is working correctly!")
        print("   The issue is likely in the frontend routing, not the backend.")
    else:
        print("\n⚠️ The QR Membership Form backend has issues that need fixing.")