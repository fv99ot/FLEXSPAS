#!/usr/bin/env python3

import requests
import json
from datetime import datetime

class ComprehensiveShiftLimitTester:
    def __init__(self):
        self.base_url = "https://flexspa-manager.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
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
                self.token = data['access_token']
                self.headers['Authorization'] = f'Bearer {self.token}'
                return self.log_test("Admin Login", True, f"Role: {data['user']['role']}")
            else:
                return self.log_test("Admin Login", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Admin Login", False, f"Exception: {str(e)}")
    
    def create_test_customer(self, suffix=""):
        """Create a test customer"""
        unique_id = f"SHIFT{datetime.now().strftime('%Y%m%d%H%M%S')}{suffix}"
        customer_data = {
            "first_name": f"ShiftTest{suffix}",
            "last_name": "Customer",
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
                return response.json()['id']
            return None
        except Exception as e:
            return None
    
    def get_available_room(self, room_type="locker"):
        """Get an available room"""
        try:
            response = requests.get(
                f"{self.api_url}/rooms/available/{room_type}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                available_rooms = response.json()['available_rooms']
                if available_rooms:
                    return available_rooms[0]
            return None
        except Exception as e:
            return None
    
    def test_checkin_shift_limit_enforcement(self):
        """Test check-in shift limit enforcement"""
        print("\n🔑 Testing Check-in Shift Limit Enforcement...")
        
        all_success = True
        
        # Test 1: Customer with 0 shifts can check in
        customer_id = self.create_test_customer("_0shifts")
        if customer_id:
            room_number = self.get_available_room()
            if room_number:
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
                    
                    success = response.status_code == 200
                    self.log_test("Check-in with 0 shifts", success, f"Status: {response.status_code}")
                    if not success:
                        all_success = False
                    else:
                        # Clean up - checkout
                        checkin_id = response.json()['id']
                        requests.put(f"{self.api_url}/checkin/{checkin_id}/checkout", headers=self.headers, timeout=10)
                        
                except Exception as e:
                    self.log_test("Check-in with 0 shifts", False, f"Exception: {str(e)}")
                    all_success = False
            else:
                self.log_test("Check-in with 0 shifts", False, "No available rooms")
                all_success = False
        else:
            self.log_test("Check-in with 0 shifts", False, "Could not create customer")
            all_success = False
        
        return all_success
    
    def test_renewal_shift_limit_enforcement(self):
        """Test renewal shift limit enforcement"""
        print("\n🔄 Testing Renewal Shift Limit Enforcement...")
        
        all_success = True
        
        # Create customer and check in
        customer_id = self.create_test_customer("_renewal")
        if not customer_id:
            self.log_test("Renewal Test Setup", False, "Could not create customer")
            return False
        
        room_number = self.get_available_room()
        if not room_number:
            self.log_test("Renewal Test Setup", False, "No available rooms")
            return False
        
        # Initial check-in
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
            
            if response.status_code != 200:
                self.log_test("Renewal Test Setup", False, "Initial check-in failed")
                return False
            
            checkin_id = response.json()['id']
            
            # Test 1: First renewal (should work - 2 shifts total)
            try:
                response = requests.put(
                    f"{self.api_url}/checkin/{checkin_id}/renew",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    renewal_count = data.get('renewal_count', 0)
                    success = renewal_count == 1
                    self.log_test("First Renewal (2 shifts)", success, f"Renewal count: {renewal_count}")
                    if not success:
                        all_success = False
                else:
                    self.log_test("First Renewal (2 shifts)", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test("First Renewal (2 shifts)", False, f"Exception: {str(e)}")
                all_success = False
            
            # Test 2: Second renewal (should work - 3 shifts total)
            try:
                response = requests.put(
                    f"{self.api_url}/checkin/{checkin_id}/renew",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    renewal_count = data.get('renewal_count', 0)
                    remaining_shifts = data.get('remaining_shifts', -1)
                    success = renewal_count == 2 and remaining_shifts == 0
                    self.log_test("Second Renewal (3 shifts)", success, f"Renewal count: {renewal_count}, Remaining: {remaining_shifts}")
                    if not success:
                        all_success = False
                else:
                    self.log_test("Second Renewal (3 shifts)", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test("Second Renewal (3 shifts)", False, f"Exception: {str(e)}")
                all_success = False
            
            # Test 3: Third renewal (should be blocked)
            try:
                response = requests.put(
                    f"{self.api_url}/checkin/{checkin_id}/renew",
                    headers=self.headers,
                    timeout=10
                )
                
                blocked = response.status_code == 400
                error_message = response.text if blocked else ""
                has_limit_message = "3 shifts" in error_message or "daily limit" in error_message
                success = blocked and has_limit_message
                self.log_test("Third Renewal Blocked", success, f"Status: {response.status_code}, Has limit message: {has_limit_message}")
                if not success:
                    all_success = False
                    
            except Exception as e:
                self.log_test("Third Renewal Blocked", False, f"Exception: {str(e)}")
                all_success = False
            
            # Clean up - checkout
            requests.put(f"{self.api_url}/checkin/{checkin_id}/checkout", headers=self.headers, timeout=10)
            
        except Exception as e:
            self.log_test("Renewal Test Setup", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success
    
    def test_business_logic_scenarios(self):
        """Test business logic scenarios"""
        print("\n🎯 Testing Business Logic Scenarios...")
        
        all_success = True
        
        # Scenario 1: Customer checks in → renews twice → tries to renew 3rd time (should be blocked)
        customer_id = self.create_test_customer("_scenario1")
        if customer_id:
            room_number = self.get_available_room()
            if room_number:
                try:
                    # Check in
                    checkin_response = requests.post(
                        f"{self.api_url}/checkin",
                        json={
                            "customer_id": customer_id,
                            "membership_type": "1_day",
                            "room_type": "locker",
                            "room_number": room_number
                        },
                        headers=self.headers,
                        timeout=10
                    )
                    
                    if checkin_response.status_code == 200:
                        checkin_id = checkin_response.json()['id']
                        
                        # First renewal
                        renewal1 = requests.put(f"{self.api_url}/checkin/{checkin_id}/renew", headers=self.headers, timeout=10)
                        # Second renewal
                        renewal2 = requests.put(f"{self.api_url}/checkin/{checkin_id}/renew", headers=self.headers, timeout=10)
                        # Third renewal attempt (should fail)
                        renewal3 = requests.put(f"{self.api_url}/checkin/{checkin_id}/renew", headers=self.headers, timeout=10)
                        
                        scenario_success = (renewal1.status_code == 200 and 
                                          renewal2.status_code == 200 and 
                                          renewal3.status_code == 400)
                        
                        self.log_test("Scenario: Check-in → 2 renewals → blocked", scenario_success, 
                                    f"Renewals: {renewal1.status_code}, {renewal2.status_code}, {renewal3.status_code}")
                        
                        if not scenario_success:
                            all_success = False
                        
                        # Clean up
                        requests.put(f"{self.api_url}/checkin/{checkin_id}/checkout", headers=self.headers, timeout=10)
                    else:
                        self.log_test("Scenario: Check-in → 2 renewals → blocked", False, "Initial check-in failed")
                        all_success = False
                        
                except Exception as e:
                    self.log_test("Scenario: Check-in → 2 renewals → blocked", False, f"Exception: {str(e)}")
                    all_success = False
            else:
                self.log_test("Scenario: Check-in → 2 renewals → blocked", False, "No available rooms")
                all_success = False
        else:
            self.log_test("Scenario: Check-in → 2 renewals → blocked", False, "Could not create customer")
            all_success = False
        
        return all_success
    
    def test_integration_with_room_types(self):
        """Test shift limits work with different room types"""
        print("\n🏠 Testing Integration with Different Room Types...")
        
        all_success = True
        room_types = ["locker", "small_room", "regular_room", "deluxe_room"]
        
        for room_type in room_types:
            customer_id = self.create_test_customer(f"_{room_type}")
            if customer_id:
                room_number = self.get_available_room(room_type)
                if room_number:
                    try:
                        # Test check-in with this room type
                        checkin_response = requests.post(
                            f"{self.api_url}/checkin",
                            json={
                                "customer_id": customer_id,
                                "membership_type": "1_day",
                                "room_type": room_type,
                                "room_number": room_number
                            },
                            headers=self.headers,
                            timeout=10
                        )
                        
                        if checkin_response.status_code == 200:
                            checkin_id = checkin_response.json()['id']
                            
                            # Test renewal
                            renewal_response = requests.put(
                                f"{self.api_url}/checkin/{checkin_id}/renew",
                                headers=self.headers,
                                timeout=10
                            )
                            
                            success = renewal_response.status_code == 200
                            self.log_test(f"Shift Limits with {room_type.replace('_', ' ').title()}", success, 
                                        f"Check-in: {checkin_response.status_code}, Renewal: {renewal_response.status_code}")
                            
                            if not success:
                                all_success = False
                            
                            # Clean up
                            requests.put(f"{self.api_url}/checkin/{checkin_id}/checkout", headers=self.headers, timeout=10)
                        else:
                            self.log_test(f"Shift Limits with {room_type.replace('_', ' ').title()}", False, 
                                        f"Check-in failed: {checkin_response.status_code}")
                            all_success = False
                            
                    except Exception as e:
                        self.log_test(f"Shift Limits with {room_type.replace('_', ' ').title()}", False, f"Exception: {str(e)}")
                        all_success = False
                else:
                    self.log_test(f"Shift Limits with {room_type.replace('_', ' ').title()}", True, "No available rooms (skipped)")
            else:
                self.log_test(f"Shift Limits with {room_type.replace('_', ' ').title()}", False, "Could not create customer")
                all_success = False
        
        return all_success
    
    def test_integration_with_membership_types(self):
        """Test shift limits work with different membership types"""
        print("\n🎫 Testing Integration with Different Membership Types...")
        
        all_success = True
        membership_types = ["1_day", "6_month"]
        
        for membership_type in membership_types:
            customer_id = self.create_test_customer(f"_{membership_type}")
            if customer_id:
                room_number = self.get_available_room()
                if room_number:
                    try:
                        # Test check-in with this membership type
                        checkin_response = requests.post(
                            f"{self.api_url}/checkin",
                            json={
                                "customer_id": customer_id,
                                "membership_type": membership_type,
                                "room_type": "locker",
                                "room_number": room_number
                            },
                            headers=self.headers,
                            timeout=10
                        )
                        
                        if checkin_response.status_code == 200:
                            checkin_id = checkin_response.json()['id']
                            
                            # Test renewal
                            renewal_response = requests.put(
                                f"{self.api_url}/checkin/{checkin_id}/renew",
                                headers=self.headers,
                                timeout=10
                            )
                            
                            success = renewal_response.status_code == 200
                            self.log_test(f"Shift Limits with {membership_type} Membership", success, 
                                        f"Check-in: {checkin_response.status_code}, Renewal: {renewal_response.status_code}")
                            
                            if not success:
                                all_success = False
                            
                            # Clean up
                            requests.put(f"{self.api_url}/checkin/{checkin_id}/checkout", headers=self.headers, timeout=10)
                        else:
                            self.log_test(f"Shift Limits with {membership_type} Membership", False, 
                                        f"Check-in failed: {checkin_response.status_code}")
                            all_success = False
                            
                    except Exception as e:
                        self.log_test(f"Shift Limits with {membership_type} Membership", False, f"Exception: {str(e)}")
                        all_success = False
                else:
                    self.log_test(f"Shift Limits with {membership_type} Membership", False, "No available rooms")
                    all_success = False
            else:
                self.log_test(f"Shift Limits with {membership_type} Membership", False, "Could not create customer")
                all_success = False
        
        return all_success
    
    def run_comprehensive_tests(self):
        """Run all comprehensive 3-shift limit tests"""
        print("🚦 COMPREHENSIVE 3-SHIFT LIMIT SYSTEM TESTING")
        print("=" * 60)
        
        if not self.login():
            return False
        
        # Run all test categories
        self.test_checkin_shift_limit_enforcement()
        self.test_renewal_shift_limit_enforcement()
        self.test_business_logic_scenarios()
        self.test_integration_with_room_types()
        self.test_integration_with_membership_types()
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 COMPREHENSIVE TESTING COMPLETE")
        print(f"📊 Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return True
        else:
            failed = self.tests_run - self.tests_passed
            print(f"⚠️  {failed} TESTS FAILED")
            return False

if __name__ == "__main__":
    tester = ComprehensiveShiftLimitTester()
    success = tester.run_comprehensive_tests()
    
    if success:
        print("\n✅ 3-SHIFT LIMIT SYSTEM FULLY FUNCTIONAL")
    else:
        print("\n❌ 3-SHIFT LIMIT SYSTEM HAS ISSUES")