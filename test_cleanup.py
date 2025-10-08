#!/usr/bin/env python3

import requests
import json
from datetime import datetime
import sys

class CleanupTester:
    def __init__(self, base_url="https://flex-enterprise-1.preview.emergentagent.com"):
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

    def test_comprehensive_database_cleanup(self):
        """Test comprehensive database cleanup for fresh deployment"""
        print("\n🗑️ TESTING COMPREHENSIVE DATABASE CLEANUP FOR FRESH DEPLOYMENT...")
        print("   Testing DELETE /api/admin/clear-all-locations-preset-data endpoint")
        print("   Verifying cleanup across all 4 locations (los-angeles, atlanta, cleveland, phoenix)")
        print("   Testing manager authentication requirement")
        print("   Checking detailed deletion counts from each location")
        print("   Verifying essential data preservation (users/employees, pricing config)")
        
        all_success = True
        locations = ['los-angeles', 'atlanta', 'cleveland', 'phoenix']
        location_tokens = {}
        
        # SETUP: Get authentication tokens for each location
        print("   SETUP: Getting authentication tokens for each location...")
        for location in locations:
            try:
                headers_with_location = {
                    'Content-Type': 'application/json',
                    'X-Location': location
                }
                
                response = requests.post(
                    f"{self.api_url}/login",
                    json={"username": "admin", "password": "admin123"},
                    headers=headers_with_location,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    location_tokens[location] = data['access_token']
                    print(f"      ✅ Got token for {location}")
                else:
                    print(f"      ❌ Failed to get token for {location}: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                print(f"      ❌ Exception getting token for {location}: {str(e)}")
                all_success = False
        
        # SETUP: Create some test data in each location to verify cleanup
        print("   SETUP: Creating test data in each location to verify cleanup...")
        unique_timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        created_data = {}
        
        for location, token in location_tokens.items():
            created_data[location] = {}
            
            try:
                headers_with_auth = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                # Create test customer
                customer_data = {
                    "first_name": "Cleanup",
                    "last_name": f"Test_{location.title()}",
                    "id_number": f"CLEANUP_TEST_{location.upper()}_{unique_timestamp}",
                    "date_of_birth": "1990-01-01",
                    "id_expiration_date": "2025-12-31",
                    "state_of_id": "CA"
                }
                
                customer_response = requests.post(
                    f"{self.api_url}/customers",
                    json=customer_data,
                    headers=headers_with_auth,
                    timeout=10
                )
                
                if customer_response.status_code == 200:
                    customer = customer_response.json()
                    created_data[location]['customer_id'] = customer['id']
                    print(f"      ✅ Created test customer in {location}: {customer['id']}")
                else:
                    print(f"      ⚠️ Could not create test customer in {location}: {customer_response.status_code}")
                
                # Create test discount
                discount_data = {
                    "name": f"Cleanup Test Discount {location.title()}",
                    "amount": 10.0,
                    "description": f"Test discount for cleanup verification in {location}",
                    "code": f"CLEANUP_{location.upper()}_{unique_timestamp}"
                }
                
                discount_response = requests.post(
                    f"{self.api_url}/discounts",
                    json=discount_data,
                    headers=headers_with_auth,
                    timeout=10
                )
                
                if discount_response.status_code == 200:
                    discount = discount_response.json()
                    created_data[location]['discount_id'] = discount['id']
                    print(f"      ✅ Created test discount in {location}: {discount['id']}")
                else:
                    print(f"      ⚠️ Could not create test discount in {location}: {discount_response.status_code}")
                
                # Create test additional item
                item_data = {
                    "name": f"Cleanup Test Item {location.title()}",
                    "price": 15.0,
                    "category": "test"
                }
                
                item_response = requests.post(
                    f"{self.api_url}/additional-items",
                    json=item_data,
                    headers=headers_with_auth,
                    timeout=10
                )
                
                if item_response.status_code == 200:
                    item = item_response.json()
                    created_data[location]['item_id'] = item['id']
                    print(f"      ✅ Created test additional item in {location}: {item['id']}")
                else:
                    print(f"      ⚠️ Could not create test additional item in {location}: {item_response.status_code}")
                    
            except Exception as e:
                print(f"      ❌ Exception creating test data for {location}: {str(e)}")
                all_success = False
        
        # TEST 1: Test authentication requirement
        print("   TEST 1: Authentication requirement...")
        try:
            # Test without authentication
            response = requests.delete(
                f"{self.api_url}/admin/clear-all-locations-preset-data",
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            auth_required = response.status_code in [401, 403]
            
            self.log_test("Authentication Required", auth_required, 
                        f"Status: {response.status_code} (should be 401 or 403)")
            
            if not auth_required:
                all_success = False
                
        except Exception as e:
            self.log_test("Authentication Required", False, f"Exception: {str(e)}")
            all_success = False
        
        # TEST 2: Test manager authentication
        print("   TEST 2: Manager authentication...")
        try:
            # Use manager token (admin/admin123 has manager role)
            response = requests.delete(
                f"{self.api_url}/admin/clear-all-locations-preset-data",
                headers=self.headers,  # Uses admin token
                timeout=15
            )
            
            print(f"      Response Status: {response.status_code}")
            print(f"      Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                cleanup_result = response.json()
                print(f"      Response Body: {json.dumps(cleanup_result, indent=2)}")
                
                # Verify response structure
                required_fields = ['message', 'locations_processed', 'results_by_location', 'total_deleted']
                has_required_fields = all(field in cleanup_result for field in required_fields)
                
                # Verify all locations were processed
                locations_processed = cleanup_result.get('locations_processed', [])
                all_locations_processed = all(loc in locations_processed for loc in locations)
                
                # Verify results structure
                results_by_location = cleanup_result.get('results_by_location', {})
                has_location_results = all(loc in results_by_location for loc in locations)
                
                # Verify total_deleted structure
                total_deleted = cleanup_result.get('total_deleted', {})
                expected_categories = ['customers', 'additional_items', 'discounts', 'checkins', 'transactions', 'waitlist']
                has_all_categories = all(cat in total_deleted for cat in expected_categories)
                
                manager_auth_success = (has_required_fields and all_locations_processed and 
                                      has_location_results and has_all_categories)
                
                details = f"Required fields: {has_required_fields}, All locations: {all_locations_processed}, Location results: {has_location_results}, Categories: {has_all_categories}"
                self.log_test("Manager Authentication & Cleanup", manager_auth_success, details)
                
                if not manager_auth_success:
                    all_success = False
                    
                # Store cleanup result for further analysis
                cleanup_response = cleanup_result
                
            else:
                print(f"      Error Response: {response.text}")
                self.log_test("Manager Authentication & Cleanup", False, f"Status: {response.status_code}")
                all_success = False
                cleanup_response = None
                
        except Exception as e:
            self.log_test("Manager Authentication & Cleanup", False, f"Exception: {str(e)}")
            all_success = False
            cleanup_response = None
        
        # TEST 3: Verify detailed deletion counts
        print("   TEST 3: Detailed deletion counts verification...")
        if cleanup_response:
            try:
                results_by_location = cleanup_response.get('results_by_location', {})
                total_deleted = cleanup_response.get('total_deleted', {})
                
                # Check each location has detailed counts
                location_details_valid = True
                for location in locations:
                    if location in results_by_location:
                        location_result = results_by_location[location]
                        if 'error' in location_result:
                            print(f"      ❌ Error in {location}: {location_result['error']}")
                            location_details_valid = False
                        else:
                            # Check that location has count data
                            expected_categories = ['customers', 'additional_items', 'discounts', 'checkins', 'transactions', 'waitlist']
                            location_has_categories = all(cat in location_result for cat in expected_categories)
                            if not location_has_categories:
                                location_details_valid = False
                            else:
                                print(f"      ✅ {location}: {location_result}")
                    else:
                        location_details_valid = False
                
                # Verify totals are sum of location counts
                totals_match = True
                for category in expected_categories:
                    calculated_total = sum(
                        results_by_location.get(loc, {}).get(category, 0) 
                        for loc in locations 
                        if 'error' not in results_by_location.get(loc, {})
                    )
                    reported_total = total_deleted.get(category, 0)
                    if calculated_total != reported_total:
                        totals_match = False
                        print(f"      ❌ Total mismatch for {category}: calculated={calculated_total}, reported={reported_total}")
                
                counts_verification_success = location_details_valid and totals_match
                
                details = f"Location details valid: {location_details_valid}, Totals match: {totals_match}, Total deleted: {total_deleted}"
                self.log_test("Detailed Deletion Counts", counts_verification_success, details)
                
                if not counts_verification_success:
                    all_success = False
                    
            except Exception as e:
                self.log_test("Detailed Deletion Counts", False, f"Exception: {str(e)}")
                all_success = False
        else:
            self.log_test("Detailed Deletion Counts", False, "No cleanup response available")
            all_success = False
        
        # TEST 4: Verify data was actually deleted from each location
        print("   TEST 4: Verify data deletion from each location...")
        for location, token in location_tokens.items():
            try:
                headers_with_auth = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                # Check customers were deleted
                customers_response = requests.get(
                    f"{self.api_url}/customers",
                    headers=headers_with_auth,
                    timeout=10
                )
                
                customers_deleted = True
                if customers_response.status_code == 200:
                    customers = customers_response.json()
                    # Check if our test customer was deleted
                    test_customer_id = created_data.get(location, {}).get('customer_id')
                    if test_customer_id:
                        customer_still_exists = any(c.get('id') == test_customer_id for c in customers)
                        customers_deleted = not customer_still_exists
                
                # Check discounts were deleted
                discounts_response = requests.get(
                    f"{self.api_url}/discounts",
                    headers=headers_with_auth,
                    timeout=10
                )
                
                discounts_deleted = True
                if discounts_response.status_code == 200:
                    discounts = discounts_response.json()
                    # Check if our test discount was deleted
                    test_discount_id = created_data.get(location, {}).get('discount_id')
                    if test_discount_id:
                        discount_still_exists = any(d.get('id') == test_discount_id for d in discounts)
                        discounts_deleted = not discount_still_exists
                
                # Check additional items were deleted
                items_response = requests.get(
                    f"{self.api_url}/additional-items",
                    headers=headers_with_auth,
                    timeout=10
                )
                
                items_deleted = True
                if items_response.status_code == 200:
                    items = items_response.json()
                    # Check if our test item was deleted
                    test_item_id = created_data.get(location, {}).get('item_id')
                    if test_item_id:
                        item_still_exists = any(i.get('id') == test_item_id for i in items)
                        items_deleted = not item_still_exists
                
                location_cleanup_success = customers_deleted and discounts_deleted and items_deleted
                
                details = f"Customers deleted: {customers_deleted}, Discounts deleted: {discounts_deleted}, Items deleted: {items_deleted}"
                self.log_test(f"Data Deletion {location.title()}", location_cleanup_success, details)
                
                if not location_cleanup_success:
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Data Deletion {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # TEST 5: Verify essential data is preserved (users/employees)
        print("   TEST 5: Verify essential data preservation...")
        for location, token in location_tokens.items():
            try:
                headers_with_auth = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                # Check that users/employees still exist
                users_response = requests.get(
                    f"{self.api_url}/users",
                    headers=headers_with_auth,
                    timeout=10
                )
                
                users_preserved = users_response.status_code == 200
                if users_preserved:
                    users = users_response.json()
                    # Should have at least the admin user
                    has_admin_user = any(u.get('username') == 'admin' for u in users)
                    users_preserved = has_admin_user and len(users) > 0
                
                # Check that we can still authenticate (user data intact)
                auth_response = requests.post(
                    f"{self.api_url}/login",
                    json={"username": "admin", "password": "admin123"},
                    headers={'Content-Type': 'application/json', 'X-Location': location},
                    timeout=10
                )
                
                auth_still_works = auth_response.status_code == 200
                
                essential_data_preserved = users_preserved and auth_still_works
                
                details = f"Users preserved: {users_preserved}, Auth works: {auth_still_works}"
                self.log_test(f"Essential Data Preserved {location.title()}", essential_data_preserved, details)
                
                if not essential_data_preserved:
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Essential Data Preserved {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # TEST 6: Test fresh deployment readiness
        print("   TEST 6: Fresh deployment readiness...")
        try:
            # Try to create new data after cleanup to ensure system is ready
            test_location = 'los-angeles'
            if test_location in location_tokens:
                headers_with_auth = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {location_tokens[test_location]}',
                    'X-Location': test_location
                }
                
                # Create a new customer to verify system is operational
                fresh_customer_data = {
                    "first_name": "Fresh",
                    "last_name": "Deployment",
                    "id_number": f"FRESH_DEPLOY_{unique_timestamp}",
                    "date_of_birth": "1990-01-01",
                    "id_expiration_date": "2025-12-31",
                    "state_of_id": "CA"
                }
                
                fresh_response = requests.post(
                    f"{self.api_url}/customers",
                    json=fresh_customer_data,
                    headers=headers_with_auth,
                    timeout=10
                )
                
                fresh_deployment_ready = fresh_response.status_code == 200
                
                if fresh_deployment_ready:
                    fresh_customer = fresh_response.json()
                    customer_created = 'id' in fresh_customer and fresh_customer.get('first_name') == 'Fresh'
                    fresh_deployment_ready = customer_created
                
                self.log_test("Fresh Deployment Readiness", fresh_deployment_ready, 
                            f"New customer creation: {fresh_deployment_ready}")
                
                if not fresh_deployment_ready:
                    all_success = False
            else:
                self.log_test("Fresh Deployment Readiness", False, "No token available for testing")
                all_success = False
                
        except Exception as e:
            self.log_test("Fresh Deployment Readiness", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def get_summary(self):
        """Get test summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print("\n" + "="*70)
        print("📊 COMPREHENSIVE DATABASE CLEANUP TEST SUMMARY")
        print("="*70)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate == 100:
            print("🎉 EXCELLENT - Comprehensive database cleanup is working perfectly!")
            print("📝 All preset data cleared from all 4 locations")
            print("📝 Essential data (users/employees) preserved")
            print("📝 System ready for fresh deployment")
        elif success_rate >= 80:
            print("✅ GOOD - Most cleanup functionality working")
            print("📝 Some minor issues found but core functionality operational")
        else:
            print("❌ ISSUES FOUND - Cleanup functionality has problems")
            print("📝 Multiple test failures indicate significant issues")
        
        return success_rate == 100

def main():
    """Main test execution"""
    print("🧪 COMPREHENSIVE DATABASE CLEANUP TESTING SUITE")
    print("🗑️ FOCUS: FRESH DEPLOYMENT DATABASE CLEANUP")
    print("=" * 70)
    
    tester = CleanupTester()
    
    # Test login first
    if not tester.test_login():
        print("❌ Login failed - cannot continue with cleanup tests")
        return 1
    
    # Run the comprehensive database cleanup test
    print(f"\n🚀 Running Comprehensive Database Cleanup Test...")
    
    try:
        success = tester.test_comprehensive_database_cleanup()
        tester.get_summary()
        
        if success:
            print(f"\n✅ COMPREHENSIVE DATABASE CLEANUP - ALL TESTS PASSED")
            print(f"📝 DATABASE CLEANUP IS WORKING CORRECTLY")
            return 0
        else:
            print(f"\n❌ COMPREHENSIVE DATABASE CLEANUP - ISSUES FOUND")
            print(f"📝 DATABASE CLEANUP PROBLEMS IDENTIFIED")
            return 1
    except Exception as e:
        print(f"💥 COMPREHENSIVE DATABASE CLEANUP - EXCEPTION: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())