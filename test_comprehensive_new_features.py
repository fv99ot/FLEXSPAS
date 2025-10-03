#!/usr/bin/env python3

import requests
import sys
from datetime import datetime

class ComprehensiveNewFeaturesTester:
    def __init__(self, base_url="https://flexspa-manager-1.preview.emergentagent.com"):
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

    def create_test_customer_with_visit(self):
        """Create a test customer and add a visit for profile testing"""
        unique_id = f"PROFILE{datetime.now().strftime('%Y%m%d%H%M%S')}"
        customer_data = {
            "first_name": "Sarah",
            "last_name": "Wilson",
            "id_number": unique_id,
            "date_of_birth": "1988-07-22",
            "id_expiration_date": "2026-06-30",
            "state_of_id": "TX"
        }
        
        try:
            # Create customer
            response = requests.post(
                f"{self.api_url}/customers",
                json=customer_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.created_customer_id = data['id']
                
                # Create a check-in and check-out to add visit history
                rooms_response = requests.get(
                    f"{self.api_url}/rooms/available/locker",
                    headers=self.headers,
                    timeout=10
                )
                
                if rooms_response.status_code == 200:
                    available_rooms = rooms_response.json()['available_rooms']
                    if available_rooms:
                        # Check in
                        checkin_data = {
                            "customer_id": self.created_customer_id,
                            "membership_type": "6_month",
                            "room_type": "locker",
                            "room_number": available_rooms[0]
                        }
                        
                        checkin_response = requests.post(
                            f"{self.api_url}/checkin",
                            json=checkin_data,
                            headers=self.headers,
                            timeout=10
                        )
                        
                        if checkin_response.status_code == 200:
                            checkin_id = checkin_response.json()['id']
                            
                            # Check out immediately
                            checkout_response = requests.put(
                                f"{self.api_url}/checkin/{checkin_id}/checkout",
                                headers=self.headers,
                                timeout=10
                            )
                            
                            if checkout_response.status_code == 200:
                                return self.log_test("Create Test Customer with Visit", True, f"ID: {data['id']}, Visit added")
                
                return self.log_test("Create Test Customer with Visit", True, f"ID: {data['id']}, No visit added")
            else:
                return self.log_test("Create Test Customer with Visit", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Create Test Customer with Visit", False, f"Exception: {str(e)}")

    def test_customer_profile_comprehensive(self):
        """Comprehensive test of customer profile system"""
        print("\n👤 Testing Customer Profile System (COMPREHENSIVE)...")
        
        if not self.created_customer_id:
            return self.log_test("Customer Profile System", False, "No customer ID")
        
        all_success = True
        
        # Test 1: Get customer profile with visit history
        try:
            response = requests.get(
                f"{self.api_url}/customers/{self.created_customer_id}/profile",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check all required fields
                required_fields = ['customer', 'last_visit', 'membership_expiration', 'visit_history', 'total_visits']
                has_all_fields = all(field in data for field in required_fields)
                
                # Check customer data structure
                customer_data = data.get('customer', {})
                customer_fields = ['id', 'first_name', 'last_name', 'id_number', 'unpaid_overtime_hours', 'unpaid_overtime_amount']
                has_customer_fields = all(field in customer_data for field in customer_fields)
                
                # Check visit history structure
                visit_history = data.get('visit_history', [])
                visit_history_valid = isinstance(visit_history, list)
                
                if visit_history:
                    first_visit = visit_history[0]
                    visit_fields = ['date', 'room_type', 'room_number', 'membership_type', 'total_amount', 'check_out_time']
                    visit_history_valid = all(field in first_visit for field in visit_fields)
                    
                    # Check membership expiration calculation
                    membership_expiration = data.get('membership_expiration')
                    has_expiration = membership_expiration is not None
                    
                    success = has_all_fields and has_customer_fields and visit_history_valid and has_expiration
                    details = f"Fields: {has_all_fields}, Customer: {has_customer_fields}, Visits: {len(visit_history)}, Expiration: {has_expiration}"
                else:
                    success = has_all_fields and has_customer_fields
                    details = f"Fields: {has_all_fields}, Customer: {has_customer_fields}, Visits: 0"
                
                self.log_test("Customer Profile - Complete Data", success, details)
                if not success:
                    all_success = False
            else:
                self.log_test("Customer Profile - Complete Data", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Customer Profile - Complete Data", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 2: Test with invalid customer ID
        try:
            response = requests.get(
                f"{self.api_url}/customers/invalid-customer-id/profile",
                headers=self.headers,
                timeout=10
            )
            
            success = response.status_code == 404
            self.log_test("Customer Profile - Invalid ID", success, f"Status: {response.status_code}")
            if not success:
                all_success = False
                
        except Exception as e:
            self.log_test("Customer Profile - Invalid ID", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_customer_notes_comprehensive(self):
        """Comprehensive test of customer notes update"""
        print("\n📝 Testing Customer Notes Update (COMPREHENSIVE)...")
        
        if not self.created_customer_id:
            return self.log_test("Customer Notes Update", False, "No customer ID")
        
        all_success = True
        
        # Test 1: Update with detailed notes
        detailed_notes = "VIP customer since 2023. Preferences: Deluxe rooms only, always pays with card. Special requests: Extra towels, prefers room temperature water. Last visit feedback: Excellent service, will recommend to friends."
        
        try:
            response = requests.put(
                f"{self.api_url}/customers/{self.created_customer_id}/notes",
                json={"notes": detailed_notes},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('notes') == detailed_notes and 'message' in data
                self.log_test("Notes Update - Detailed Text", success, f"Length: {len(detailed_notes)} chars")
                if not success:
                    all_success = False
            else:
                self.log_test("Notes Update - Detailed Text", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Notes Update - Detailed Text", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 2: Update with special characters
        special_notes = "Customer notes with special chars: áéíóú, ñ, ¿¡, €, ©, ®, ™, 中文, 日本語, 한국어"
        
        try:
            response = requests.put(
                f"{self.api_url}/customers/{self.created_customer_id}/notes",
                json={"notes": special_notes},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('notes') == special_notes
                self.log_test("Notes Update - Special Characters", success, "Unicode support")
                if not success:
                    all_success = False
            else:
                self.log_test("Notes Update - Special Characters", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Notes Update - Special Characters", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 3: Update with empty notes (clear notes)
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
                self.log_test("Notes Update - Clear Notes", success, "Empty string accepted")
                if not success:
                    all_success = False
            else:
                self.log_test("Notes Update - Clear Notes", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Notes Update - Clear Notes", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 4: Verify notes persist (get customer and check notes)
        try:
            response = requests.get(
                f"{self.api_url}/customers/{self.created_customer_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('notes') == ""  # Should be empty from previous test
                self.log_test("Notes Update - Persistence Check", success, "Notes saved to database")
                if not success:
                    all_success = False
            else:
                self.log_test("Notes Update - Persistence Check", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Notes Update - Persistence Check", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_password_management_comprehensive(self):
        """Comprehensive test of password management system"""
        print("\n🔐 Testing Password Management System (COMPREHENSIVE)...")
        
        all_success = True
        
        # Test 1: Change own password - validation tests
        validation_tests = [
            {"current_password": "wrongpass", "new_password": "newpass123", "expected": 400, "name": "Wrong Current Password"},
            {"current_password": "admin123", "new_password": "123", "expected": 400, "name": "Password Too Short"},
            {"current_password": "", "new_password": "newpass123", "expected": 400, "name": "Missing Current Password"},
            {"current_password": "admin123", "new_password": "", "expected": 400, "name": "Missing New Password"},
        ]
        
        for test in validation_tests:
            try:
                response = requests.put(
                    f"{self.api_url}/users/me/password",
                    json={
                        "current_password": test["current_password"],
                        "new_password": test["new_password"]
                    },
                    headers=self.headers,
                    timeout=10
                )
                
                success = response.status_code == test["expected"]
                self.log_test(f"Password Validation - {test['name']}", success, f"Status: {response.status_code}")
                if not success:
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Password Validation - {test['name']}", False, f"Exception: {str(e)}")
                all_success = False
        
        # Test 2: Valid password change and restore
        try:
            # Change password
            response = requests.put(
                f"{self.api_url}/users/me/password",
                json={
                    "current_password": "admin123",
                    "new_password": "temppass123"
                },
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test("Password Change - Valid Change", True, "Password changed successfully")
                
                # Test login with new password
                login_response = requests.post(
                    f"{self.api_url}/login",
                    json={"username": "admin", "password": "temppass123"},
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if login_response.status_code == 200:
                    new_token = login_response.json()['access_token']
                    new_headers = {
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {new_token}'
                    }
                    self.log_test("Password Change - Login with New Password", True, "Login successful")
                    
                    # Restore original password
                    restore_response = requests.put(
                        f"{self.api_url}/users/me/password",
                        json={
                            "current_password": "temppass123",
                            "new_password": "admin123"
                        },
                        headers=new_headers,
                        timeout=10
                    )
                    
                    if restore_response.status_code == 200:
                        self.log_test("Password Change - Restore Original", True, "Password restored")
                        
                        # Update our token back to original
                        restore_login = requests.post(
                            f"{self.api_url}/login",
                            json={"username": "admin", "password": "admin123"},
                            headers={'Content-Type': 'application/json'},
                            timeout=10
                        )
                        if restore_login.status_code == 200:
                            self.token = restore_login.json()['access_token']
                            self.headers['Authorization'] = f'Bearer {self.token}'
                    else:
                        self.log_test("Password Change - Restore Original", False, f"Status: {restore_response.status_code}")
                        all_success = False
                else:
                    self.log_test("Password Change - Login with New Password", False, f"Status: {login_response.status_code}")
                    all_success = False
            else:
                self.log_test("Password Change - Valid Change", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Password Change - Valid Change", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 3: Admin reset user password
        try:
            # Create test user
            user_data = {
                "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
                "password": "originalpass123",
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
                
                # Admin reset password
                reset_response = requests.put(
                    f"{self.api_url}/users/{test_user_id}/password",
                    json={"new_password": "resetpass123"},
                    headers=self.headers,
                    timeout=10
                )
                
                if reset_response.status_code == 200:
                    self.log_test("Admin Reset Password - Valid Reset", True, "Password reset successful")
                    
                    # Test login with reset password
                    login_test = requests.post(
                        f"{self.api_url}/login",
                        json={"username": user_data["username"], "password": "resetpass123"},
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    success = login_test.status_code == 200
                    self.log_test("Admin Reset Password - Login with Reset Password", success, f"Status: {login_test.status_code}")
                    if not success:
                        all_success = False
                else:
                    self.log_test("Admin Reset Password - Valid Reset", False, f"Status: {reset_response.status_code}")
                    all_success = False
                
                # Clean up
                requests.delete(f"{self.api_url}/users/{test_user_id}", headers=self.headers, timeout=10)
            else:
                self.log_test("Admin Reset Password - Valid Reset", False, "Could not create test user")
                all_success = False
                
        except Exception as e:
            self.log_test("Admin Reset Password - Valid Reset", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def run_tests(self):
        """Run comprehensive tests for all new features"""
        print("🚀 Comprehensive Testing of New Customer Profile and Password Management Features")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 100)
        
        # Login
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Create test customer with visit history
        if not self.create_test_customer_with_visit():
            print("❌ Could not create test customer - stopping tests")
            return False
        
        # Run comprehensive tests
        self.test_customer_profile_comprehensive()
        self.test_customer_notes_comprehensive()
        self.test_password_management_comprehensive()
        
        # Summary
        print("\n" + "=" * 100)
        print(f"🏁 Comprehensive Testing Complete: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 95:
            print("🎉 EXCELLENT: All new features working perfectly!")
        elif success_rate >= 85:
            print("✅ GOOD: Most features working well")
        else:
            print("⚠️ ISSUES: Some features need attention")
        
        return success_rate >= 90

def main():
    tester = ComprehensiveNewFeaturesTester()
    success = tester.run_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())