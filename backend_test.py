import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class BathhouseAPITester:
    def __init__(self, base_url="https://spa-manager.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.created_customer_id = None
        self.created_checkin_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def test_login(self):
        """Test login with default admin credentials"""
        print("\n🔐 Testing Authentication...")
        
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "admin", "password": "admin123"},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data:
                    self.token = data['access_token']
                    self.headers['Authorization'] = f'Bearer {self.token}'
                    user_info = f"(User: {data['user']['username']}, Role: {data['user']['role']})"
                    return self.log_test("Admin Login", True, user_info)
                else:
                    return self.log_test("Admin Login", False, "Missing token or user data")
            else:
                return self.log_test("Admin Login", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Admin Login", False, f"Exception: {str(e)}")

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "invalid", "password": "wrong"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 401
            return self.log_test("Invalid Login Rejection", success, f"Status: {response.status_code}")
            
        except Exception as e:
            return self.log_test("Invalid Login Rejection", False, f"Exception: {str(e)}")

    def test_create_customer(self):
        """Test creating a new customer"""
        print("\n👥 Testing Customer Management...")
        
        if not self.token:
            return self.log_test("Create Customer", False, "No authentication token")
        
        # Generate unique ID number
        unique_id = f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        customer_data = {
            "first_name": "John",
            "last_name": "Doe", 
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
                data = response.json()
                if 'id' in data and data['first_name'] == 'John':
                    self.created_customer_id = data['id']
                    return self.log_test("Create Customer", True, f"ID: {data['id']}")
                else:
                    return self.log_test("Create Customer", False, "Invalid response data")
            else:
                return self.log_test("Create Customer", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Create Customer", False, f"Exception: {str(e)}")

    def test_search_customers(self):
        """Test customer search functionality"""
        if not self.token:
            return self.log_test("Search Customers", False, "No authentication token")
        
        try:
            # Test search by first name
            response = requests.get(
                f"{self.api_url}/customers?q=John",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                found_customer = any(customer.get('first_name') == 'John' for customer in data)
                return self.log_test("Search Customers", found_customer, f"Found {len(data)} customers")
            else:
                return self.log_test("Search Customers", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Search Customers", False, f"Exception: {str(e)}")

    def test_get_customer(self):
        """Test getting a specific customer"""
        if not self.token or not self.created_customer_id:
            return self.log_test("Get Customer", False, "No token or customer ID")
        
        try:
            response = requests.get(
                f"{self.api_url}/customers/{self.created_customer_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('id') == self.created_customer_id
                return self.log_test("Get Customer", success, f"Retrieved customer: {data.get('first_name')} {data.get('last_name')}")
            else:
                return self.log_test("Get Customer", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Get Customer", False, f"Exception: {str(e)}")

    def test_available_rooms(self):
        """Test getting available rooms for different room types"""
        print("\n🏠 Testing Room Management...")
        
        if not self.token:
            return self.log_test("Available Rooms", False, "No authentication token")
        
        room_types = ["locker", "small_room", "regular_room", "deluxe_room"]
        all_success = True
        
        for room_type in room_types:
            try:
                response = requests.get(
                    f"{self.api_url}/rooms/available/{room_type}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'available_rooms' in data and isinstance(data['available_rooms'], list):
                        self.log_test(f"Available {room_type.replace('_', ' ').title()} Rooms", True, f"Found {len(data['available_rooms'])} rooms")
                    else:
                        self.log_test(f"Available {room_type.replace('_', ' ').title()} Rooms", False, "Invalid response format")
                        all_success = False
                else:
                    self.log_test(f"Available {room_type.replace('_', ' ').title()} Rooms", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Available {room_type.replace('_', ' ').title()} Rooms", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_checkin(self):
        """Test customer check-in process"""
        print("\n🔑 Testing Check-in System...")
        
        if not self.token or not self.created_customer_id:
            return self.log_test("Customer Check-in", False, "No token or customer ID")
        
        # First get available rooms
        try:
            rooms_response = requests.get(
                f"{self.api_url}/rooms/available/locker",
                headers=self.headers,
                timeout=10
            )
            
            if rooms_response.status_code != 200:
                return self.log_test("Customer Check-in", False, "Could not get available rooms")
            
            available_rooms = rooms_response.json()['available_rooms']
            if not available_rooms:
                return self.log_test("Customer Check-in", False, "No available rooms")
            
            # Perform check-in
            checkin_data = {
                "customer_id": self.created_customer_id,
                "membership_type": "1_day",
                "room_type": "locker",
                "room_number": available_rooms[0]
            }
            
            response = requests.post(
                f"{self.api_url}/checkin",
                json=checkin_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'total_amount' in data:
                    self.created_checkin_id = data['id']
                    return self.log_test("Customer Check-in", True, f"Room: {data['room_number']}, Amount: ${data['total_amount']}")
                else:
                    return self.log_test("Customer Check-in", False, "Invalid response data")
            else:
                return self.log_test("Customer Check-in", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Customer Check-in", False, f"Exception: {str(e)}")

    def test_active_checkins(self):
        """Test getting active check-ins"""
        if not self.token:
            return self.log_test("Active Check-ins", False, "No authentication token")
        
        try:
            response = requests.get(
                f"{self.api_url}/checkins/active",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created check-in is in the list
                    found_checkin = any(checkin.get('id') == self.created_checkin_id for checkin in data) if self.created_checkin_id else True
                    return self.log_test("Active Check-ins", found_checkin, f"Found {len(data)} active check-ins")
                else:
                    return self.log_test("Active Check-ins", False, "Invalid response format")
            else:
                return self.log_test("Active Check-ins", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Active Check-ins", False, f"Exception: {str(e)}")

    def test_checkout(self):
        """Test customer check-out process"""
        if not self.token or not self.created_checkin_id:
            return self.log_test("Customer Check-out", False, "No token or check-in ID")
        
        try:
            response = requests.put(
                f"{self.api_url}/checkin/{self.created_checkin_id}/checkout",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                success = 'message' in data and 'checkout_time' in data
                return self.log_test("Customer Check-out", success, f"Message: {data.get('message', '')}")
            else:
                return self.log_test("Customer Check-out", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Customer Check-out", False, f"Exception: {str(e)}")

    def test_business_rules(self):
        """Test business rules like duplicate ID prevention"""
        print("\n📋 Testing Business Rules...")
        
        if not self.token:
            return self.log_test("Business Rules", False, "No authentication token")
        
        # Test duplicate customer ID prevention
        duplicate_customer = {
            "first_name": "Jane",
            "last_name": "Smith",
            "id_number": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}",  # Same ID as before
            "date_of_birth": "1985-05-15",
            "id_expiration_date": "2025-12-31",
            "state_of_id": "NY"
        }
        
        try:
            # First create a customer
            response1 = requests.post(
                f"{self.api_url}/customers",
                json=duplicate_customer,
                headers=self.headers,
                timeout=10
            )
            
            if response1.status_code != 200:
                return self.log_test("Duplicate ID Prevention", False, "Could not create first customer")
            
            # Try to create another with same ID
            response2 = requests.post(
                f"{self.api_url}/customers",
                json=duplicate_customer,
                headers=self.headers,
                timeout=10
            )
            
            # Should fail with 400 status
            success = response2.status_code == 400
            return self.log_test("Duplicate ID Prevention", success, f"Status: {response2.status_code}")
            
        except Exception as e:
            return self.log_test("Duplicate ID Prevention", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🧪 Starting FLEX_LA Bathhouse API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Authentication tests
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        self.test_invalid_login()
        
        # Customer management tests
        self.test_create_customer()
        self.test_search_customers()
        self.test_get_customer()
        
        # Room management tests
        self.test_available_rooms()
        
        # Check-in/out tests
        self.test_checkin()
        self.test_active_checkins()
        self.test_checkout()
        
        # Business rules tests
        self.test_business_rules()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BathhouseAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())