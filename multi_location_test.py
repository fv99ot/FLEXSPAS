import requests
import sys
import json
from datetime import datetime, timedelta, timezone
import uuid
import jwt
import time

class MultiLocationAPITester:
    def __init__(self, base_url="https://flexspa-manager-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.location_tokens = {}  # Store tokens for each location
        self.location_customers = {}  # Store created customers for each location
        
        # Test locations
        self.locations = ['los-angeles', 'atlanta', 'cleveland', 'phoenix']

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def test_locations_endpoint(self):
        """Test GET /api/locations endpoint"""
        print("\n🌍 TESTING LOCATIONS ENDPOINT...")
        print("   Testing GET /api/locations to verify all 4 locations are returned")
        
        try:
            response = requests.get(
                f"{self.api_url}/locations",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response has locations array
                if 'locations' in data and isinstance(data['locations'], list):
                    locations = data['locations']
                    
                    # Check if all 4 expected locations are present
                    expected_locations = {'los-angeles', 'atlanta', 'cleveland', 'phoenix'}
                    returned_location_ids = {loc.get('id') for loc in locations}
                    
                    all_locations_present = expected_locations.issubset(returned_location_ids)
                    
                    # Check if each location has required fields
                    required_fields = ['id', 'name', 'address', 'phone', 'db_name', 'status']
                    all_have_required_fields = all(
                        all(field in loc for field in required_fields) 
                        for loc in locations
                    )
                    
                    # Check database names
                    expected_db_names = {
                        'los-angeles': 'flexspa_losangeles',
                        'atlanta': 'flexspa_atlanta',
                        'cleveland': 'flexspa_cleveland',
                        'phoenix': 'flexspa_phoenix'
                    }
                    
                    correct_db_names = all(
                        loc.get('db_name') == expected_db_names.get(loc.get('id'))
                        for loc in locations
                        if loc.get('id') in expected_db_names
                    )
                    
                    success = all_locations_present and all_have_required_fields and correct_db_names
                    
                    details = f"Found {len(locations)} locations, All present: {all_locations_present}, Required fields: {all_have_required_fields}, Correct DB names: {correct_db_names}"
                    
                    return self.log_test("Locations Endpoint", success, details)
                else:
                    return self.log_test("Locations Endpoint", False, "Invalid response format - missing locations array")
            else:
                return self.log_test("Locations Endpoint", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Locations Endpoint", False, f"Exception: {str(e)}")

    def test_location_specific_login(self):
        """Test location-specific login with X-Location header"""
        print("\n🔐 TESTING LOCATION-SPECIFIC LOGIN...")
        print("   Testing POST /api/login with X-Location header for each location")
        
        all_success = True
        
        for location in self.locations:
            try:
                # Create headers with X-Location
                location_headers = self.headers.copy()
                location_headers['X-Location'] = location
                
                response = requests.post(
                    f"{self.api_url}/login",
                    json={"username": "admin", "password": "admin123"},
                    headers=location_headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check if response contains required fields
                    required_fields = ['access_token', 'token_type', 'user', 'location']
                    has_required_fields = all(field in data for field in required_fields)
                    
                    # Check if location matches what we sent
                    correct_location = data.get('location') == location
                    
                    # Check if user data is present
                    user_data = data.get('user', {})
                    has_user_data = all(field in user_data for field in ['id', 'username', 'role'])
                    
                    # Store token for later tests
                    if has_required_fields and correct_location:
                        self.location_tokens[location] = data['access_token']
                    
                    success = has_required_fields and correct_location and has_user_data
                    
                    details = f"Location: {data.get('location')}, User: {user_data.get('username')}, Role: {user_data.get('role')}"
                    
                    test_success = self.log_test(f"Login {location.title()}", success, details)
                    if not test_success:
                        all_success = False
                else:
                    self.log_test(f"Login {location.title()}", False, f"Status: {response.status_code}, Response: {response.text}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Login {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_admin_user_creation(self):
        """Test that admin users exist in all location databases"""
        print("\n👤 TESTING ADMIN USER CREATION...")
        print("   Verifying admin users were created in all 4 location databases")
        
        all_success = True
        
        for location in self.locations:
            if location not in self.location_tokens:
                self.log_test(f"Admin User {location.title()}", False, "No authentication token available")
                all_success = False
                continue
            
            try:
                # Create headers with location and auth token
                location_headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.location_tokens[location]}',
                    'X-Location': location
                }
                
                # Try to access a protected endpoint to verify admin user exists and works
                response = requests.get(
                    f"{self.api_url}/customers",
                    headers=location_headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    # Admin user exists and can access protected endpoints
                    self.log_test(f"Admin User {location.title()}", True, "Admin user authenticated successfully")
                elif response.status_code in [401, 403]:
                    self.log_test(f"Admin User {location.title()}", False, f"Authentication failed - Status: {response.status_code}")
                    all_success = False
                else:
                    self.log_test(f"Admin User {location.title()}", False, f"Unexpected status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Admin User {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_location_context_routing(self):
        """Test that API calls with X-Location header route to correct database"""
        print("\n🔄 TESTING LOCATION CONTEXT ROUTING...")
        print("   Testing that X-Location header routes API calls to correct database")
        
        all_success = True
        
        # Create unique customers in each location to test isolation
        for location in self.locations:
            if location not in self.location_tokens:
                self.log_test(f"Location Routing {location.title()}", False, "No authentication token available")
                all_success = False
                continue
            
            try:
                # Create headers with location and auth token
                location_headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.location_tokens[location]}',
                    'X-Location': location
                }
                
                # Create a unique customer for this location
                unique_id = f"{location.upper()}_TEST_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                customer_data = {
                    "first_name": f"{location.title()}",
                    "last_name": "TestCustomer",
                    "id_number": unique_id,
                    "date_of_birth": "1990-01-01",
                    "id_expiration_date": "2025-12-31",
                    "state_of_id": "CA"
                }
                
                response = requests.post(
                    f"{self.api_url}/customers",
                    json=customer_data,
                    headers=location_headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    customer = response.json()
                    self.location_customers[location] = customer
                    
                    # Verify customer was created with correct data
                    correct_data = (
                        customer.get('first_name') == location.title() and
                        customer.get('last_name') == 'TestCustomer' and
                        customer.get('id_number') == unique_id
                    )
                    
                    self.log_test(f"Location Routing {location.title()}", correct_data, 
                                f"Customer created: {customer.get('first_name')} {customer.get('last_name')} (ID: {customer.get('id')})")
                    
                    if not correct_data:
                        all_success = False
                else:
                    self.log_test(f"Location Routing {location.title()}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Location Routing {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_cross_location_isolation(self):
        """Test that data from one location doesn't appear in another location's database"""
        print("\n🔒 TESTING CROSS-LOCATION ISOLATION...")
        print("   Verifying data isolation between location databases")
        
        all_success = True
        
        # For each location, verify that customers from other locations don't appear
        for current_location in self.locations:
            if current_location not in self.location_tokens:
                continue
            
            try:
                # Create headers for current location
                location_headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.location_tokens[current_location]}',
                    'X-Location': current_location
                }
                
                # Get all customers in current location
                response = requests.get(
                    f"{self.api_url}/customers",
                    headers=location_headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    customers = response.json()
                    
                    # Check that customers from other locations don't appear here
                    isolation_maintained = True
                    cross_contamination_details = []
                    
                    for other_location in self.locations:
                        if other_location == current_location:
                            continue
                        
                        if other_location in self.location_customers:
                            other_customer = self.location_customers[other_location]
                            other_customer_id = other_customer.get('id')
                            
                            # Check if this other location's customer appears in current location
                            found_in_current = any(
                                customer.get('id') == other_customer_id 
                                for customer in customers
                            )
                            
                            if found_in_current:
                                isolation_maintained = False
                                cross_contamination_details.append(f"{other_location} customer found in {current_location}")
                    
                    # Also verify that current location's customer exists in current location
                    if current_location in self.location_customers:
                        current_customer = self.location_customers[current_location]
                        current_customer_id = current_customer.get('id')
                        
                        found_own_customer = any(
                            customer.get('id') == current_customer_id 
                            for customer in customers
                        )
                        
                        if not found_own_customer:
                            isolation_maintained = False
                            cross_contamination_details.append(f"{current_location} customer missing from own database")
                    
                    details = f"Customers: {len(customers)}, Isolation: {isolation_maintained}"
                    if cross_contamination_details:
                        details += f", Issues: {', '.join(cross_contamination_details)}"
                    
                    self.log_test(f"Isolation {current_location.title()}", isolation_maintained, details)
                    
                    if not isolation_maintained:
                        all_success = False
                else:
                    self.log_test(f"Isolation {current_location.title()}", False, 
                                f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Isolation {current_location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_multi_database_setup(self):
        """Test that each location has its own separate database"""
        print("\n🗄️ TESTING MULTI-DATABASE SETUP...")
        print("   Verifying separate databases for each location")
        
        all_success = True
        
        # Test by creating and retrieving data in each location
        for location in self.locations:
            if location not in self.location_tokens:
                continue
            
            try:
                # Create headers for location
                location_headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.location_tokens[location]}',
                    'X-Location': location
                }
                
                # Test database connectivity by getting customers
                response = requests.get(
                    f"{self.api_url}/customers",
                    headers=location_headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    customers = response.json()
                    
                    # Database is accessible and returns data
                    database_accessible = isinstance(customers, list)
                    
                    # Check if we can find our test customer (if created)
                    test_customer_found = False
                    if location in self.location_customers:
                        test_customer_id = self.location_customers[location].get('id')
                        test_customer_found = any(
                            customer.get('id') == test_customer_id 
                            for customer in customers
                        )
                    
                    success = database_accessible
                    details = f"Database accessible: {database_accessible}, Customers: {len(customers)}"
                    
                    if location in self.location_customers:
                        details += f", Test customer found: {test_customer_found}"
                        success = success and test_customer_found
                    
                    self.log_test(f"Database {location.title()}", success, details)
                    
                    if not success:
                        all_success = False
                else:
                    self.log_test(f"Database {location.title()}", False, 
                                f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Database {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_location_header_validation(self):
        """Test behavior with invalid or missing X-Location headers"""
        print("\n🔍 TESTING LOCATION HEADER VALIDATION...")
        print("   Testing behavior with invalid/missing X-Location headers")
        
        all_success = True
        
        # Test 1: No X-Location header (should default to los-angeles)
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "admin", "password": "admin123"},
                headers=self.headers,  # No X-Location header
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                default_location = data.get('location', '')
                
                # Should default to los-angeles
                defaults_correctly = default_location == 'los-angeles'
                
                self.log_test("No Location Header Default", defaults_correctly, 
                            f"Defaulted to: {default_location} (expected: los-angeles)")
                
                if not defaults_correctly:
                    all_success = False
            else:
                self.log_test("No Location Header Default", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("No Location Header Default", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 2: Invalid X-Location header (should default to los-angeles)
        try:
            invalid_headers = self.headers.copy()
            invalid_headers['X-Location'] = 'invalid-location'
            
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "admin", "password": "admin123"},
                headers=invalid_headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                fallback_location = data.get('location', '')
                
                # Should fallback to los-angeles for invalid location
                fallback_correct = fallback_location == 'los-angeles'
                
                self.log_test("Invalid Location Header Fallback", fallback_correct, 
                            f"Fallback to: {fallback_location} (expected: los-angeles)")
                
                if not fallback_correct:
                    all_success = False
            else:
                self.log_test("Invalid Location Header Fallback", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Invalid Location Header Fallback", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def run_all_tests(self):
        """Run all multi-location tests"""
        print("🚀 STARTING MULTI-LOCATION BACKEND ARCHITECTURE TESTING")
        print("=" * 80)
        
        # Test 1: Locations endpoint
        test1_success = self.test_locations_endpoint()
        
        # Test 2: Location-specific login
        test2_success = self.test_location_specific_login()
        
        # Test 3: Admin user creation
        test3_success = self.test_admin_user_creation()
        
        # Test 4: Location context routing
        test4_success = self.test_location_context_routing()
        
        # Test 5: Multi-database setup
        test5_success = self.test_multi_database_setup()
        
        # Test 6: Cross-location isolation
        test6_success = self.test_cross_location_isolation()
        
        # Test 7: Location header validation
        test7_success = self.test_location_header_validation()
        
        # Summary
        print("\n" + "=" * 80)
        print("🏁 MULTI-LOCATION TESTING SUMMARY")
        print("=" * 80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        overall_success = all([
            test1_success, test2_success, test3_success, test4_success,
            test5_success, test6_success, test7_success
        ])
        
        if overall_success:
            print("\n✅ ALL MULTI-LOCATION TESTS PASSED!")
            print("Multi-location backend architecture is working correctly.")
        else:
            print("\n❌ SOME MULTI-LOCATION TESTS FAILED!")
            print("Multi-location backend architecture has issues that need attention.")
        
        return overall_success

if __name__ == "__main__":
    tester = MultiLocationAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)