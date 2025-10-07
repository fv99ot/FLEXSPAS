#!/usr/bin/env python3

import requests
import json
from datetime import datetime

class ShiftLimitTester:
    def __init__(self):
        self.base_url = "https://flex-enterprise-1.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        
    def login(self):
        """Login with admin credentials"""
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "admin", "password": "admin123"},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data['access_token']
                self.headers['Authorization'] = f'Bearer {self.token}'
                print("✅ Login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def create_test_customer(self):
        """Create a test customer for shift limit testing"""
        unique_id = f"SHIFT{datetime.now().strftime('%Y%m%d%H%M%S')}"
        customer_data = {
            "first_name": "ShiftLimit",
            "last_name": "TestCustomer",
            "id_number": unique_id,
            "date_of_birth": "1990-01-01",
            "id_expiration_date": "2025-12-31",
            "state_of_id": "CA"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/customers",
                json=customer_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                customer_id = response.json()['id']
                print(f"✅ Created test customer: {customer_id}")
                return customer_id
            else:
                print(f"❌ Customer creation failed: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Customer creation error: {str(e)}")
            return None
    
    def get_available_room(self):
        """Get an available locker"""
        try:
            response = requests.get(
                f"{self.api_url}/rooms/available/locker",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                available_rooms = response.json()['available_rooms']
                if available_rooms:
                    return available_rooms[0]
            return None
        except Exception as e:
            print(f"❌ Room query error: {str(e)}")
            return None
    
    def check_in_customer(self, customer_id, room_number):
        """Check in a customer"""
        checkin_data = {
            "customer_id": customer_id,
            "membership_type": "1_day",
            "room_type": "locker",
            "room_number": room_number
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/checkin",
                json=checkin_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                checkin_id = response.json()['id']
                print(f"✅ Check-in successful: {checkin_id}")
                return checkin_id
            else:
                print(f"❌ Check-in failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Check-in error: {str(e)}")
            return None
    
    def renew_session(self, checkin_id):
        """Renew a session"""
        try:
            response = requests.put(
                f"{self.api_url}/checkin/{checkin_id}/renew",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                renewal_count = data.get('renewal_count', 0)
                total_shifts = data.get('total_shifts_today', 0)
                remaining_shifts = data.get('remaining_shifts', 0)
                print(f"✅ Renewal successful: Count={renewal_count}, Total={total_shifts}, Remaining={remaining_shifts}")
                return True
            else:
                print(f"❌ Renewal failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Renewal error: {str(e)}")
            return False
    
    def checkout_customer(self, checkin_id):
        """Check out a customer"""
        try:
            response = requests.put(
                f"{self.api_url}/checkin/{checkin_id}/checkout",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                print("✅ Checkout successful")
                return True
            else:
                print(f"❌ Checkout failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Checkout error: {str(e)}")
            return False
    
    def test_3_shift_limit(self):
        """Test the complete 3-shift limit system"""
        print("🚦 Testing 3-Shift Limit System...")
        print("=" * 50)
        
        # Login
        if not self.login():
            return False
        
        # Create test customer
        customer_id = self.create_test_customer()
        if not customer_id:
            return False
        
        # Get available room
        room_number = self.get_available_room()
        if not room_number:
            print("❌ No available rooms")
            return False
        
        print(f"📍 Using room: {room_number}")
        
        # Test 1: Initial check-in (1st shift)
        print("\n1️⃣ Testing initial check-in (1st shift)...")
        checkin_id = self.check_in_customer(customer_id, room_number)
        if not checkin_id:
            return False
        
        # Test 2: First renewal (2nd shift)
        print("\n2️⃣ Testing first renewal (2nd shift)...")
        if not self.renew_session(checkin_id):
            return False
        
        # Test 3: Second renewal (3rd shift - at limit)
        print("\n3️⃣ Testing second renewal (3rd shift - at limit)...")
        if not self.renew_session(checkin_id):
            return False
        
        # Test 4: Third renewal attempt (should be blocked)
        print("\n4️⃣ Testing third renewal attempt (should be blocked)...")
        try:
            response = requests.put(
                f"{self.api_url}/checkin/{checkin_id}/renew",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 400:
                error_message = response.text
                if "3 shifts" in error_message or "daily limit" in error_message:
                    print("✅ Third renewal correctly blocked with proper error message")
                else:
                    print(f"⚠️ Third renewal blocked but error message unclear: {error_message}")
            else:
                print(f"❌ Third renewal should have been blocked but got status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Third renewal test error: {str(e)}")
            return False
        
        # Test 5: Check out customer
        print("\n5️⃣ Testing checkout after 3 shifts...")
        if not self.checkout_customer(checkin_id):
            return False
        
        # Test 6: Try to check in again (should be blocked for 24 hours)
        print("\n6️⃣ Testing check-in after completing 3 shifts (should be blocked)...")
        new_room = self.get_available_room()
        if new_room:
            try:
                response = requests.post(
                    f"{self.api_url}/checkin",
                    json={
                        "customer_id": customer_id,
                        "membership_type": "1_day",
                        "room_type": "locker",
                        "room_number": new_room
                    },
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 400:
                    error_message = response.text
                    if "3 shifts" in error_message or "24 hours" in error_message:
                        print("✅ Check-in after 3 shifts correctly blocked with proper error message")
                    else:
                        print(f"⚠️ Check-in blocked but error message unclear: {error_message}")
                else:
                    print(f"❌ Check-in after 3 shifts should have been blocked but got status: {response.status_code}")
                    return False
            except Exception as e:
                print(f"❌ Check-in after 3 shifts test error: {str(e)}")
                return False
        
        print("\n🎉 All 3-shift limit tests passed!")
        return True

if __name__ == "__main__":
    tester = ShiftLimitTester()
    success = tester.test_3_shift_limit()
    
    if success:
        print("\n✅ 3-SHIFT LIMIT SYSTEM WORKING CORRECTLY")
    else:
        print("\n❌ 3-SHIFT LIMIT SYSTEM HAS ISSUES")