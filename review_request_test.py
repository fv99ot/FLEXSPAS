#!/usr/bin/env python3
"""
Focused test for the 3 critical issues mentioned in the review request:
1. Add Customer Authentication
2. Sales Report Generation  
3. Session Count/Shift Display
"""

import requests
import json
from datetime import datetime
import uuid

class ReviewRequestTester:
    def __init__(self, base_url="https://flexspa-manager-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

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
                if 'access_token' in data:
                    self.token = data['access_token']
                    self.headers['Authorization'] = f'Bearer {self.token}'
                    return self.log_test("Admin Login", True, f"Role: {data['user']['role']}")
                else:
                    return self.log_test("Admin Login", False, "Missing token")
            else:
                return self.log_test("Admin Login", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Admin Login", False, f"Exception: {str(e)}")

    def test_customer_authentication(self):
        """CRITICAL FIX 1: Test Add Customer Authentication"""
        print("\n🔐 CRITICAL FIX 1: Add Customer Authentication")
        
        if not self.token:
            return self.log_test("Customer Authentication", False, "No authentication token")
        
        all_success = True
        
        # Generate unique customer data
        unique_id = f"AUTH_TEST_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        customer_data = {
            "first_name": "AuthTest",
            "last_name": "Customer",
            "id_number": unique_id,
            "date_of_birth": "1990-05-15",
            "id_expiration_date": "2025-12-31",
            "state_of_id": "CA"
        }
        
        # Test 1: POST /api/customers WITH authentication headers
        try:
            response = requests.post(
                f"{self.api_url}/customers",
                json=customer_data,
                headers=self.headers,  # Contains Authorization: Bearer token
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data['first_name'] == 'AuthTest':
                    self.log_test("Customer Creation WITH Auth", True, f"Created customer ID: {data['id']}")
                else:
                    self.log_test("Customer Creation WITH Auth", False, "Invalid response data")
                    all_success = False
            else:
                self.log_test("Customer Creation WITH Auth", False, f"Status: {response.status_code}, Response: {response.text}")
                all_success = False
                
        except Exception as e:
            self.log_test("Customer Creation WITH Auth", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 2: POST /api/customers WITHOUT authentication (should fail)
        try:
            response = requests.post(
                f"{self.api_url}/customers",
                json=customer_data,
                headers={'Content-Type': 'application/json'},  # No auth header
                timeout=10
            )
            
            auth_required = response.status_code == 401
            self.log_test("Customer Creation Requires Auth", auth_required, f"Unauthenticated request status: {response.status_code}")
            if not auth_required:
                all_success = False
                
        except Exception as e:
            self.log_test("Customer Creation Requires Auth", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_sales_report_generation(self):
        """CRITICAL FIX 2: Test Sales Report Generation"""
        print("\n📊 CRITICAL FIX 2: Sales Report Generation")
        
        if not self.token:
            return self.log_test("Sales Report Generation", False, "No authentication token")
        
        try:
            # Test /api/reports/daily-sales with today's date
            today = datetime.now().strftime('%Y-%m-%d')
            response = requests.get(
                f"{self.api_url}/reports/daily-sales?date={today}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   📋 Sales Report Response: {json.dumps(data, indent=2)}")
                
                # Check for proper sales data structure
                required_fields = ['date', 'total_revenue', 'total_checkins', 'average_per_checkin', 
                                 'room_breakdown', 'membership_breakdown', 'employee_breakdown']
                
                has_all_fields = all(field in data for field in required_fields)
                if has_all_fields:
                    # Verify data types and structure
                    structure_valid = (
                        isinstance(data['total_revenue'], (int, float)) and
                        isinstance(data['total_checkins'], int) and
                        isinstance(data['room_breakdown'], dict) and
                        isinstance(data['membership_breakdown'], dict) and
                        isinstance(data['employee_breakdown'], dict)
                    )
                    
                    if structure_valid:
                        details = f"Revenue: ${data['total_revenue']}, Check-ins: {data['total_checkins']}, Date: {data['date']}"
                        return self.log_test("Sales Report Generation", True, details)
                    else:
                        return self.log_test("Sales Report Generation", False, "Invalid data structure in response")
                else:
                    missing = [f for f in required_fields if f not in data]
                    return self.log_test("Sales Report Generation", False, f"Missing required fields: {missing}")
            else:
                return self.log_test("Sales Report Generation", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Sales Report Generation", False, f"Exception: {str(e)}")

    def test_session_count_shift_display(self):
        """CRITICAL FIX 3: Test Session Count/Shift Display"""
        print("\n🔢 CRITICAL FIX 3: Session Count/Shift Display")
        
        if not self.token:
            return self.log_test("Session Count/Shift Display", False, "No authentication token")
        
        try:
            # Test /api/checkins/active for session_count or shift information
            response = requests.get(
                f"{self.api_url}/checkins/active",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   📋 Active Check-ins Response: {json.dumps(data, indent=2)}")
                
                if isinstance(data, list):
                    # Check if response contains session_count or shift-related fields
                    session_fields_found = []
                    
                    if len(data) > 0:
                        # Check first active check-in for session/shift fields
                        first_checkin = data[0]
                        session_related_fields = ['session_count', 'shift_count', 'renewal_count', 'remaining_hours']
                        
                        for field in session_related_fields:
                            if field in first_checkin:
                                session_fields_found.append(field)
                    
                    # Test passes if endpoint works (even with no active check-ins)
                    endpoint_works = True
                    details = f"Found {len(data)} active check-ins"
                    
                    if len(data) > 0:
                        details += f", Session fields: {session_fields_found}" if session_fields_found else ", No session fields found"
                        
                        # Check specifically for session_count field
                        first_checkin = data[0]
                        has_session_count = 'session_count' in first_checkin
                        self.log_test("Session Count Field Present", has_session_count, 
                                    f"session_count field in check-in: {has_session_count}")
                        
                        if has_session_count:
                            session_count_value = first_checkin['session_count']
                            self.log_test("Session Count Value", True, f"session_count = {session_count_value}")
                        
                        return has_session_count
                    else:
                        return self.log_test("Active Check-ins Endpoint", True, "No active check-ins (endpoint working)")
                    
                else:
                    return self.log_test("Session Count/Shift Display", False, "Invalid response format - not a list")
            else:
                return self.log_test("Session Count/Shift Display", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Session Count/Shift Display", False, f"Exception: {str(e)}")

    def run_review_tests(self):
        """Run the 3 critical tests from review request"""
        print("🔥 REVIEW REQUEST CRITICAL FIXES TESTING")
        print("=" * 60)
        print("Testing 3 critical issues that were just fixed:")
        print("1. Add Customer Authentication")
        print("2. Sales Report Generation")
        print("3. Session Count/Shift Display")
        print("=" * 60)
        
        # Login first
        if not self.login():
            print("❌ Cannot continue - authentication failed")
            return False
        
        # Run the 3 critical tests
        test1_result = self.test_customer_authentication()
        test2_result = self.test_sales_report_generation()
        test3_result = self.test_session_count_shift_display()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"🏁 REVIEW REQUEST TESTING COMPLETE")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL CRITICAL FIXES ARE WORKING!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} critical issues still need attention")
            return False

if __name__ == "__main__":
    tester = ReviewRequestTester()
    tester.run_review_tests()