#!/usr/bin/env python3

import requests
import sys
from datetime import datetime

class NewFeaturesTester:
    def __init__(self, base_url="https://bathhouse-admin.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.created_customer_id = None

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
        """Test login with admin credentials"""
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "admin", "password": "admin123"},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.token = data['access_token']
                    self.headers['Authorization'] = f'Bearer {self.token}'
                    return self.log_test("Admin Login", True, f"Token obtained")
                else:
                    return self.log_test("Admin Login", False, "Missing token")
            else:
                return self.log_test("Admin Login", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Admin Login", False, f"Exception: {str(e)}")

    def create_test_customer(self):
        """Create a test customer for testing"""
        unique_id = f"TESTPROFILE{datetime.now().strftime('%Y%m%d%H%M%S')}"
        customer_data = {
            "first_name": "Alice",
            "last_name": "Johnson",
            "id_number": unique_id,
            "date_of_birth": "1985-03-15",
            "id_expiration_date": "2026-01-01",
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
                self.created_customer_id = data['id']
                return self.log_test("Create Test Customer", True, f"ID: {data['id']}")
            else:
                return self.log_test("Create Test Customer", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Create Test Customer", False, f"Exception: {str(e)}")

    def test_customer_profile_endpoint(self):
        """Test GET /api/customers/{customer_id}/profile"""
        print("\n👤 Testing Customer Profile Endpoint...")
        
        if not self.created_customer_id:
            return self.log_test("Customer Profile Endpoint", False, "No customer ID")
        
        try:
            response = requests.get(
                f"{self.api_url}/customers/{self.created_customer_id}/profile",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['customer', 'last_visit', 'membership_expiration', 'visit_history', 'total_visits']
                has_all_fields = all(field in data for field in required_fields)
                
                # Check customer data
                customer_data = data.get('customer', {})
                has_customer_info = 'id' in customer_data and 'first_name' in customer_data
                has_overtime_fields = 'unpaid_overtime_hours' in customer_data and 'unpaid_overtime_amount' in customer_data
                
                success = has_all_fields and has_customer_info and has_overtime_fields
                details = f"Fields: {has_all_fields}, Customer: {has_customer_info}, Overtime: {has_overtime_fields}"
                return self.log_test("Customer Profile Endpoint", success, details)
            else:
                return self.log_test("Customer Profile Endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Customer Profile Endpoint", False, f"Exception: {str(e)}")

    def test_customer_notes_update(self):
        """Test PUT /api/customers/{customer_id}/notes"""
        print("\n📝 Testing Customer Notes Update...")
        
        if not self.created_customer_id:
            return self.log_test("Customer Notes Update", False, "No customer ID")
        
        all_success = True
        
        # Test 1: Update with regular notes
        test_notes = "VIP customer. Prefers deluxe rooms. Always pays with card."
        
        try:
            response = requests.put(
                f"{self.api_url}/customers/{self.created_customer_id}/notes",
                json={"notes": test_notes},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                has_message = 'message' in data
                has_notes = 'notes' in data
                correct_notes = data.get('notes') == test_notes
                
                success = has_message and has_notes and correct_notes
                details = f"Message: {has_message}, Notes returned: {has_notes}, Correct: {correct_notes}"
                self.log_test("Update Notes - Regular Text", success, details)
                if not success:
                    all_success = False
            else:
                self.log_test("Update Notes - Regular Text", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Update Notes - Regular Text", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 2: Update with empty notes
        try:
            response = requests.put(
                f"{self.api_url}/customers/{self.created_customer_id}/notes",
                json={"notes": ""},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('notes') == ""
                self.log_test("Update Notes - Empty", success, f"Empty notes accepted: {success}")
                if not success:
                    all_success = False
            else:
                self.log_test("Update Notes - Empty", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Update Notes - Empty", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_change_own_password(self):
        """Test PUT /api/users/me/password"""
        print("\n🔐 Testing Change Own Password...")
        
        all_success = True
        
        # Test 1: Wrong current password
        try:
            response = requests.put(
                f"{self.api_url}/users/me/password",
                json={
                    "current_password": "wrongpassword",
                    "new_password": "newpass123"
                },
                headers=self.headers,
                timeout=10
            )
            
            success = response.status_code == 400
            self.log_test("Change Password - Wrong Current", success, f"Status: {response.status_code}")
            if not success:
                all_success = False
                
        except Exception as e:
            self.log_test("Change Password - Wrong Current", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 2: Password too short
        try:
            response = requests.put(
                f"{self.api_url}/users/me/password",
                json={
                    "current_password": "admin123",
                    "new_password": "123"
                },
                headers=self.headers,
                timeout=10
            )
            
            success = response.status_code == 400
            self.log_test("Change Password - Too Short", success, f"Status: {response.status_code}")
            if not success:
                all_success = False
                
        except Exception as e:
            self.log_test("Change Password - Too Short", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_admin_reset_password(self):
        """Test PUT /api/users/{user_id}/password"""
        print("\n🔧 Testing Admin Reset Password...")
        
        # First create a test user
        test_user_id = None
        try:
            user_data = {
                "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
                "password": "testpass123",
                "role": "employee"
            }
            
            create_response = requests.post(
                f"{self.api_url}/users",
                json=user_data,
                headers=self.headers,
                timeout=10
            )
            
            if create_response.status_code == 200:
                test_user_id = create_response.json()['id']
                
                # Test password reset
                reset_response = requests.put(
                    f"{self.api_url}/users/{test_user_id}/password",
                    json={"new_password": "resetpass123"},
                    headers=self.headers,
                    timeout=10
                )
                
                if reset_response.status_code == 200:
                    data = reset_response.json()
                    success = 'message' in data
                    self.log_test("Admin Reset Password", success, f"Message: {data.get('message', '')}")
                    
                    # Clean up
                    requests.delete(f"{self.api_url}/users/{test_user_id}", headers=self.headers, timeout=10)
                    return success
                else:
                    self.log_test("Admin Reset Password", False, f"Status: {reset_response.status_code}")
                    return False
            else:
                self.log_test("Admin Reset Password", False, "Could not create test user")
                return False
                
        except Exception as e:
            self.log_test("Admin Reset Password", False, f"Exception: {str(e)}")
            return False

    def run_tests(self):
        """Run all new feature tests"""
        print("🚀 Testing New Customer Profile and Password Management Features...")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Login
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Create test customer
        if not self.create_test_customer():
            print("❌ Could not create test customer - stopping tests")
            return False
        
        # Test new features
        self.test_customer_profile_endpoint()
        self.test_customer_notes_update()
        self.test_change_own_password()
        self.test_admin_reset_password()
        
        # Summary
        print("\n" + "=" * 80)
        print(f"🏁 Testing Complete: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 85

def main():
    tester = NewFeaturesTester()
    success = tester.run_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())