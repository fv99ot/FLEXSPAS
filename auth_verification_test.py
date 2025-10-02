import requests
import json

def test_auth_for_all_locations():
    """Test authentication with admin/admin123 for each location"""
    base_url = "https://spatracker-1.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    locations = ['los-angeles', 'atlanta', 'cleveland', 'phoenix']
    
    print("🔐 TESTING AUTHENTICATION FOR ALL LOCATIONS")
    print("=" * 60)
    
    for location in locations:
        try:
            headers = {
                'Content-Type': 'application/json',
                'X-Location': location
            }
            
            response = requests.post(
                f"{api_url}/login",
                json={"username": "admin", "password": "admin123"},
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {location.title()}: Login successful")
                print(f"   User: {data.get('user', {}).get('username')}")
                print(f"   Role: {data.get('user', {}).get('role')}")
                print(f"   Location: {data.get('location')}")
                print()
            else:
                print(f"❌ {location.title()}: Login failed - Status: {response.status_code}")
                print(f"   Response: {response.text}")
                print()
                
        except Exception as e:
            print(f"❌ {location.title()}: Exception - {str(e)}")
            print()

if __name__ == "__main__":
    test_auth_for_all_locations()