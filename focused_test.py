#!/usr/bin/env python3
"""
Focused tests for the specific fixes implemented in Flex Spa Los Angeles
Testing the 4 critical areas mentioned in the review request
"""

import requests
import sys
import json
from datetime import datetime

class FlexSpaFixedFeaturesTest:
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

    def login_as_admin(self):
        """Login as admin to get authentication token"""
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
                return True
            return False
        except Exception as e:
            print(f"Login failed: {e}")
            return False

    def test_1_qr_membership_form_public_endpoint(self):
        """
        TEST 1: QR Membership Form - Public endpoint /customers/public
        Should work without authentication
        """
        print("\n🔍 TEST 1: QR Membership Form Authentication Fix")
        
        # Generate unique test data
        unique_id = f"QR_TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        customer_data = {
            "first_name": "Michael",
            "last_name": "TestUser",
            "id_number": unique_id,
            "date_of_birth": "1990-01-01",
            "id_expiration_date": "2025-12-31",
            "state_of_id": "CA"
        }
        
        try:
            # Test WITHOUT authentication (should work now)
            response = requests.post(
                f"{self.api_url}/customers/public",
                json=customer_data,
                headers={'Content-Type': 'application/json'},  # No auth header
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data['first_name'] == 'Michael':
                    self.created_customer_id = data['id']
                    return self.log_test("QR Form Public Endpoint", True, 
                                       f"Customer created without auth: {data['first_name']} {data['last_name']}")
                else:
                    return self.log_test("QR Form Public Endpoint", False, "Invalid response data")
            else:
                return self.log_test("QR Form Public Endpoint", False, 
                                   f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("QR Form Public Endpoint", False, f"Exception: {str(e)}")

    def test_2_sales_report_generation(self):
        """
        TEST 2: Sales Report - Fixed error handling and data parsing
        Should generate report without errors
        """
        print("\n📊 TEST 2: Sales Report Generation Fix")
        
        if not self.token:
            return self.log_test("Sales Report Generation", False, "No authentication token")
        
        try:
            # Test sales report for today
            today = datetime.now().strftime('%Y-%m-%d')
            response = requests.get(
                f"{self.api_url}/reports/daily-sales?date={today}",
                headers=self.headers,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required fields
                required_fields = ['date', 'total_revenue', 'total_checkins', 'average_per_checkin']
                has_required = all(field in data for field in required_fields)
                
                if has_required:
                    return self.log_test("Sales Report Generation", True, 
                                       f"Revenue: ${data['total_revenue']}, Check-ins: {data['total_checkins']}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    return self.log_test("Sales Report Generation", False, f"Missing fields: {missing}")
            else:
                return self.log_test("Sales Report Generation", False, 
                                   f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Sales Report Generation", False, f"Exception: {str(e)}")

    def test_3_room_map_colors_logic(self):
        """
        TEST 3: Room Map Colors - Fixed logic for Green=Available, Red=Occupied
        Should return proper availability status
        """
        print("\n🗺️ TEST 3: Room Map Colors Logic Fix")
        
        if not self.token:
            return self.log_test("Room Map Colors Logic", False, "No authentication token")
        
        try:
            # Get active check-ins to see occupied rooms
            active_response = requests.get(
                f"{self.api_url}/checkins/active",
                headers=self.headers,
                timeout=10
            )
            
            if active_response.status_code != 200:
                return self.log_test("Room Map Colors Logic", False, "Could not get active check-ins")
            
            active_checkins = active_response.json()
            occupied_rooms = [(c['room_number'], c['room_type']) for c in active_checkins]
            
            # Test room availability for lockers
            rooms_response = requests.get(
                f"{self.api_url}/rooms/available/locker",
                headers=self.headers,
                timeout=10
            )
            
            if rooms_response.status_code == 200:
                data = rooms_response.json()
                available_rooms = data.get('available_rooms', [])
                
                # Logic check: occupied rooms should NOT be in available list
                conflicts = []
                for room_num, room_type in occupied_rooms:
                    if room_type == 'locker' and room_num in available_rooms:
                        conflicts.append(room_num)
                
                if not conflicts:
                    return self.log_test("Room Map Colors Logic", True, 
                                       f"Available: {len(available_rooms)}, Occupied: {len([r for r in occupied_rooms if r[1] == 'locker'])}")
                else:
                    return self.log_test("Room Map Colors Logic", False, 
                                       f"Conflicts found - rooms {conflicts} are both occupied and available")
            else:
                return self.log_test("Room Map Colors Logic", False, f"Status: {rooms_response.status_code}")
                
        except Exception as e:
            return self.log_test("Room Map Colors Logic", False, f"Exception: {str(e)}")

    def test_4_additional_items_management(self):
        """
        TEST 4: Additional Items Management - Backend endpoints for managers
        Should allow managers to add/remove transaction items
        """
        print("\n🛍️ TEST 4: Additional Items Management Fix")
        
        if not self.token:
            return self.log_test("Additional Items Management", False, "No authentication token")
        
        all_success = True
        
        # Test GET additional items
        try:
            response = requests.get(
                f"{self.api_url}/additional-items",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                items = response.json()
                self.log_test("Get Additional Items", True, f"Found {len(items)} items")
            else:
                self.log_test("Get Additional Items", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Get Additional Items", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test POST additional item (create)
        test_item = {
            "name": f"Test Item {datetime.now().strftime('%H%M%S')}",
            "price": 15.99,
            "category": "test"
        }
        
        created_item_id = None
        try:
            response = requests.post(
                f"{self.api_url}/additional-items",
                json=test_item,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data['name'] == test_item['name']:
                    created_item_id = data['id']
                    self.log_test("Create Additional Item", True, f"Created: {data['name']} - ${data['price']}")
                else:
                    self.log_test("Create Additional Item", False, "Invalid response data")
                    all_success = False
            else:
                self.log_test("Create Additional Item", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Create Additional Item", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test DELETE additional item (remove)
        if created_item_id:
            try:
                response = requests.delete(
                    f"{self.api_url}/additional-items/{created_item_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log_test("Delete Additional Item", True, "Item deleted successfully")
                else:
                    self.log_test("Delete Additional Item", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test("Delete Additional Item", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_5_enhanced_checkin_debugging(self):
        """
        TEST 5: Enhanced Check-in Debugging - Comprehensive logging
        Test the check-in flow with a Michael customer
        """
        print("\n🔑 TEST 5: Enhanced Check-in Flow (Michael Customer)")
        
        if not self.token or not self.created_customer_id:
            return self.log_test("Enhanced Check-in Flow", False, "No token or customer ID")
        
        try:
            # Get available rooms first
            rooms_response = requests.get(
                f"{self.api_url}/rooms/available/locker",
                headers=self.headers,
                timeout=10
            )
            
            if rooms_response.status_code != 200:
                return self.log_test("Enhanced Check-in Flow", False, "Could not get available rooms")
            
            available_rooms = rooms_response.json()['available_rooms']
            if not available_rooms:
                return self.log_test("Enhanced Check-in Flow", False, "No available rooms")
            
            # Perform check-in with comprehensive data
            checkin_data = {
                "customer_id": self.created_customer_id,
                "membership_type": "1_day",
                "room_type": "locker",
                "room_number": available_rooms[0]
            }
            
            print(f"🚀 Attempting check-in with data: {json.dumps(checkin_data, indent=2)}")
            
            response = requests.post(
                f"{self.api_url}/checkin",
                json=checkin_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'customer_id', 'room_number', 'total_amount', 'check_in_time']
                has_required = all(field in data for field in required_fields)
                
                if has_required:
                    return self.log_test("Enhanced Check-in Flow", True, 
                                       f"Check-in ID: {data['id']}, Room: {data['room_number']}, Amount: ${data['total_amount']}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    return self.log_test("Enhanced Check-in Flow", False, f"Missing fields: {missing}")
            else:
                return self.log_test("Enhanced Check-in Flow", False, 
                                   f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Enhanced Check-in Flow", False, f"Exception: {str(e)}")

    def run_focused_tests(self):
        """Run all focused tests for the fixed features"""
        print("🎯 FOCUSED TESTS: Flex Spa Los Angeles - Fixed Features")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Login first (needed for most tests)
        if not self.login_as_admin():
            print("❌ Could not login as admin - stopping tests")
            return False
        
        # Run the 4 critical tests
        self.test_1_qr_membership_form_public_endpoint()
        self.test_2_sales_report_generation()
        self.test_3_room_map_colors_logic()
        self.test_4_additional_items_management()
        self.test_5_enhanced_checkin_debugging()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 FOCUSED TEST SUMMARY:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL FIXES WORKING CORRECTLY!")
        else:
            print("⚠️ Some fixes need attention")
        
        return self.tests_passed == self.tests_run

def main():
    tester = FlexSpaFixedFeaturesTest()
    success = tester.run_focused_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())