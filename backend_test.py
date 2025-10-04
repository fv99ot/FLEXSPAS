import requests
import sys
import json
from datetime import datetime, timedelta, timezone
import uuid
import jwt
import time

class BathhouseAPITester:
    def __init__(self, base_url="https://flexspa-manager-1.preview.emergentagent.com"):
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

    def test_qr_code_generation_and_redirect(self):
        """Test QR Code Generation & Redirect Fix as requested in review"""
        print("\n📱 TESTING QR CODE GENERATION & REDIRECT FIX...")
        print("   Testing GET /api/qr/membership-form endpoint")
        print("   Verifying QR codes redirect to /membership (customer registration) NOT admin login")
        print("   Checking QR code contains correct membership form URL")
        
        all_success = True
        
        # TEST 1: Test QR code generation endpoint
        print("   TEST 1: QR code generation endpoint...")
        try:
            response = requests.get(
                f"{self.api_url}/qr/membership-form",
                headers={'Content-Type': 'application/json'},  # No auth required for QR generation
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields in response
                has_qr_code = 'qr_code_url' in data
                has_form_url = 'membership_form_url' in data
                
                # Check QR code format (should be data URL)
                qr_code_url = data.get('qr_code_url', '')
                is_data_url = qr_code_url.startswith('data:image/png;base64,')
                
                # Check membership form URL points to correct endpoint
                form_url = data.get('membership_form_url', '')
                correct_endpoint = '/membership' in form_url and 'admin' not in form_url.lower()
                
                # Check URL uses correct domain
                expected_domain = 'flexspa-manager-1.preview.emergentagent.com'
                correct_domain = expected_domain in form_url
                
                qr_generation_success = has_qr_code and has_form_url and is_data_url and correct_endpoint and correct_domain
                
                details = f"QR code: {has_qr_code}, Form URL: {has_form_url}, Data URL: {is_data_url}, Correct endpoint: {correct_endpoint}, Domain: {correct_domain}"
                self.log_test("QR Code Generation", qr_generation_success, details)
                
                if not qr_generation_success:
                    all_success = False
                    
                # Additional check: QR code size (should be substantial base64 string)
                if is_data_url:
                    base64_part = qr_code_url.split(',')[1] if ',' in qr_code_url else ''
                    substantial_size = len(base64_part) > 1000  # QR codes should be reasonably large
                    
                    self.log_test("QR Code Size", substantial_size, f"Base64 length: {len(base64_part)} characters")
                    
                    if not substantial_size:
                        all_success = False
                
            else:
                self.log_test("QR Code Generation", False, f"Status: {response.status_code}, Response: {response.text}")
                all_success = False
                
        except Exception as e:
            self.log_test("QR Code Generation", False, f"Exception: {str(e)}")
            all_success = False
        
        # TEST 2: Verify QR code URL content
        print("   TEST 2: QR code URL content verification...")
        try:
            response = requests.get(
                f"{self.api_url}/qr/membership-form",
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                form_url = data.get('membership_form_url', '')
                
                # Verify URL structure
                url_checks = {
                    'has_https': form_url.startswith('https://'),
                    'has_membership_path': '/membership' in form_url,
                    'no_admin_reference': 'admin' not in form_url.lower(),
                    'no_login_reference': 'login' not in form_url.lower(),
                    'correct_domain': 'flexspa-manager-1.preview.emergentagent.com' in form_url
                }
                
                all_url_checks_pass = all(url_checks.values())
                
                details = f"URL: {form_url}, Checks: {url_checks}"
                self.log_test("QR Code URL Content", all_url_checks_pass, details)
                
                if not all_url_checks_pass:
                    all_success = False
            else:
                self.log_test("QR Code URL Content", False, f"Could not get QR code data: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("QR Code URL Content", False, f"Exception: {str(e)}")
            all_success = False
        
        # TEST 3: Test QR code accessibility (no authentication required)
        print("   TEST 3: QR code accessibility (no auth required)...")
        try:
            # Test without any authentication headers
            response = requests.get(
                f"{self.api_url}/qr/membership-form",
                timeout=10
            )
            
            accessible_without_auth = response.status_code == 200
            
            self.log_test("QR Code Public Access", accessible_without_auth, 
                        f"Status: {response.status_code} (should be 200 without auth)")
            
            if not accessible_without_auth:
                all_success = False
                
        except Exception as e:
            self.log_test("QR Code Public Access", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_multi_location_authentication(self):
        """Test multi-location authentication system for login functionality as requested in review"""
        print("\n🌍 TESTING MULTI-LOCATION AUTHENTICATION SYSTEM...")
        print("   Testing location-specific login functionality for all 4 locations")
        print("   Verifying admin/admin123 credentials work for each location database")
        print("   Testing JWT token generation with location context")
        
        all_success = True
        locations = ['los-angeles', 'atlanta', 'cleveland', 'phoenix']
        
        # Test 1: Test GET /api/locations endpoint first
        print("   TEST 1: Get available locations...")
        try:
            response = requests.get(
                f"{self.api_url}/locations",
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'locations' in data and isinstance(data['locations'], list):
                    returned_locations = [loc['id'] for loc in data['locations']]
                    has_all_locations = all(loc in returned_locations for loc in locations)
                    
                    self.log_test("Get Locations Endpoint", has_all_locations, 
                                f"Returned {len(returned_locations)} locations: {returned_locations}")
                    
                    if not has_all_locations:
                        all_success = False
                else:
                    self.log_test("Get Locations Endpoint", False, "Invalid response format")
                    all_success = False
            else:
                self.log_test("Get Locations Endpoint", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Get Locations Endpoint", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 2: Test location-specific login for each location
        print("   TEST 2: Location-specific login for all 4 locations...")
        location_tokens = {}
        
        for location in locations:
            print(f"      Testing login for {location}...")
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
                    
                    # Verify response contains required fields
                    required_fields = ['access_token', 'token_type', 'user', 'location']
                    has_required_fields = all(field in data for field in required_fields)
                    
                    # Verify location context is correct
                    correct_location = data.get('location') == location
                    
                    # Verify user data
                    user_data = data.get('user', {})
                    correct_user = (user_data.get('username') == 'admin' and 
                                  user_data.get('role') == 'manager')
                    
                    # Verify JWT token is valid
                    token = data.get('access_token')
                    valid_token = token and len(token) > 50  # JWT tokens are typically long
                    
                    login_success = (has_required_fields and correct_location and 
                                   correct_user and valid_token)
                    
                    if login_success:
                        location_tokens[location] = token
                    
                    details = f"Location: {data.get('location')}, User: {user_data.get('username')}, Role: {user_data.get('role')}, Token length: {len(token) if token else 0}"
                    
                    self.log_test(f"Login {location.title()}", login_success, details)
                    
                    if not login_success:
                        all_success = False
                else:
                    self.log_test(f"Login {location.title()}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Login {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # Test 3: Test JWT token validation for each location
        print("   TEST 3: JWT token validation for each location...")
        for location, token in location_tokens.items():
            print(f"      Testing JWT token for {location}...")
            try:
                headers_with_auth = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                # Test token by accessing a protected endpoint (customers)
                response = requests.get(
                    f"{self.api_url}/customers",
                    headers=headers_with_auth,
                    timeout=10
                )
                
                token_valid = response.status_code == 200
                
                self.log_test(f"JWT Token Validation {location.title()}", token_valid, 
                            f"Protected endpoint access: {response.status_code}")
                
                if not token_valid:
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"JWT Token Validation {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # Test 4: Test location context routing (create customer in specific location)
        print("   TEST 4: Location context routing (database isolation)...")
        test_customers = {}
        unique_timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        for location, token in location_tokens.items():
            print(f"      Testing customer creation in {location}...")
            try:
                headers_with_auth = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                customer_data = {
                    "first_name": f"Location",
                    "last_name": f"Test_{location.title()}",
                    "id_number": f"LOC_TEST_{location.upper()}_{unique_timestamp}",
                    "date_of_birth": "1990-01-01",
                    "id_expiration_date": "2025-12-31",
                    "state_of_id": "CA"
                }
                
                response = requests.post(
                    f"{self.api_url}/customers",
                    json=customer_data,
                    headers=headers_with_auth,
                    timeout=10
                )
                
                if response.status_code == 200:
                    customer = response.json()
                    test_customers[location] = customer['id']
                    
                    self.log_test(f"Create Customer {location.title()}", True, 
                                f"Customer ID: {customer['id']}, Name: {customer['first_name']} {customer['last_name']}")
                else:
                    self.log_test(f"Create Customer {location.title()}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Create Customer {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # Test 5: Test cross-location data isolation
        print("   TEST 5: Cross-location data isolation...")
        for location, token in location_tokens.items():
            print(f"      Testing data isolation for {location}...")
            try:
                headers_with_auth = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                # Get customers for this location
                response = requests.get(
                    f"{self.api_url}/customers",
                    headers=headers_with_auth,
                    timeout=10
                )
                
                if response.status_code == 200:
                    customers = response.json()
                    
                    # Check that this location's customer exists
                    location_customer_exists = any(
                        customer['id'] == test_customers.get(location) 
                        for customer in customers
                    ) if location in test_customers else True
                    
                    # Check that other locations' customers don't exist here
                    other_customers_isolated = True
                    for other_location, other_customer_id in test_customers.items():
                        if other_location != location:
                            customer_found = any(
                                customer['id'] == other_customer_id 
                                for customer in customers
                            )
                            if customer_found:
                                other_customers_isolated = False
                                break
                    
                    isolation_success = location_customer_exists and other_customers_isolated
                    
                    details = f"Own customer exists: {location_customer_exists}, Other customers isolated: {other_customers_isolated}, Total customers: {len(customers)}"
                    
                    self.log_test(f"Data Isolation {location.title()}", isolation_success, details)
                    
                    if not isolation_success:
                        all_success = False
                else:
                    self.log_test(f"Data Isolation {location.title()}", False, 
                                f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Data Isolation {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_super_admin_authentication(self):
        """Test Super Admin Authentication as requested in review"""
        print("\n👑 TESTING SUPER ADMIN AUTHENTICATION...")
        print("   Testing POST /api/login for super admin access")
        print("   Verifying super admin credentials and cross-location access")
        
        all_success = True
        
        # Super admin credentials to test
        super_admin_accounts = [
            {"username": "admin1", "password": "admin1123"},
            {"username": "admin2", "password": "admin2123"},
            {"username": "admin3", "password": "admin3123"}
        ]
        
        # TEST 1: Test super admin login
        print("   TEST 1: Super admin login...")
        super_admin_tokens = {}
        
        for admin in super_admin_accounts:
            try:
                response = requests.post(
                    f"{self.api_url}/login",
                    json={"username": admin["username"], "password": admin["password"]},
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verify super admin response structure
                    required_fields = ['access_token', 'token_type', 'user']
                    has_required_fields = all(field in data for field in required_fields)
                    
                    # Verify user role
                    user_data = data.get('user', {})
                    is_super_admin = user_data.get('role') == 'super_admin'
                    correct_username = user_data.get('username') == admin["username"]
                    
                    # Verify super admin capabilities
                    can_see_all_locations = user_data.get('can_see_all_locations', False)
                    can_manage_users = user_data.get('can_manage_users', False)
                    
                    login_success = (has_required_fields and is_super_admin and 
                                   correct_username and can_see_all_locations and can_manage_users)
                    
                    if login_success:
                        super_admin_tokens[admin["username"]] = data['access_token']
                    
                    details = f"Role: {user_data.get('role')}, All locations: {can_see_all_locations}, Manage users: {can_manage_users}"
                    self.log_test(f"Super Admin Login {admin['username']}", login_success, details)
                    
                    if not login_success:
                        all_success = False
                else:
                    self.log_test(f"Super Admin Login {admin['username']}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Super Admin Login {admin['username']}", False, f"Exception: {str(e)}")
                all_success = False
        
        # TEST 2: Test super admin cross-location access
        print("   TEST 2: Super admin cross-location access...")
        if super_admin_tokens:
            sample_admin = list(super_admin_tokens.keys())[0]
            sample_token = super_admin_tokens[sample_admin]
            
            locations = ['los-angeles', 'atlanta', 'cleveland', 'phoenix']
            
            for location in locations:
                try:
                    headers_with_location = {
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {sample_token}',
                        'X-Location': location
                    }
                    
                    # Test access to location-specific data
                    response = requests.get(
                        f"{self.api_url}/customers",
                        headers=headers_with_location,
                        timeout=10
                    )
                    
                    cross_location_access = response.status_code == 200
                    
                    self.log_test(f"Super Admin Access {location.title()}", cross_location_access, 
                                f"Status: {response.status_code}")
                    
                    if not cross_location_access:
                        all_success = False
                        
                except Exception as e:
                    self.log_test(f"Super Admin Access {location.title()}", False, f"Exception: {str(e)}")
                    all_success = False
        else:
            self.log_test("Super Admin Cross-Location Access", False, "No super admin tokens available")
            all_success = False
        
        # TEST 3: Test invalid super admin credentials
        print("   TEST 3: Invalid super admin credentials...")
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "admin1", "password": "wrongpassword"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            invalid_rejected = response.status_code == 401
            
            self.log_test("Invalid Super Admin Rejected", invalid_rejected, 
                        f"Status: {response.status_code} (should be 401)")
            
            if not invalid_rejected:
                all_success = False
                
        except Exception as e:
            self.log_test("Invalid Super Admin Rejected", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_membership_form_access(self):
        """Test Membership Form Access as requested in review"""
        print("\n📝 TESTING MEMBERSHIP FORM ACCESS...")
        print("   Testing /api/customers/public endpoint (used by QR code forms)")
        print("   Verifying endpoint works without authentication and creates pending customers")
        
        all_success = True
        unique_timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # TEST 1: Test public customer creation endpoint
        print("   TEST 1: Public customer creation endpoint...")
        try:
            customer_data = {
                "first_name": "QR",
                "last_name": "TestCustomer",
                "id_number": f"QR_TEST_{unique_timestamp}",
                "date_of_birth": "1990-01-01",
                "id_expiration_date": "2025-12-31",
                "state_of_id": "CA"
            }
            
            # Test without authentication (public endpoint)
            response = requests.post(
                f"{self.api_url}/customers/public",
                json=customer_data,
                headers={'Content-Type': 'application/json'},  # No auth header
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ['id', 'first_name', 'last_name', 'id_number', 'status']
                has_required_fields = all(field in data for field in required_fields)
                
                # Verify status is pending
                is_pending = data.get('status') == 'pending'
                
                # Verify customer data matches
                data_matches = (data.get('first_name') == 'QR' and 
                              data.get('last_name') == 'TestCustomer' and
                              data.get('id_number') == f"QR_TEST_{unique_timestamp}")
                
                public_creation_success = has_required_fields and is_pending and data_matches
                
                details = f"Required fields: {has_required_fields}, Pending status: {is_pending}, Data matches: {data_matches}"
                self.log_test("Public Customer Creation", public_creation_success, details)
                
                if not public_creation_success:
                    all_success = False
                    
                # Store created customer ID for later tests
                created_pending_id = data.get('id')
                
            else:
                self.log_test("Public Customer Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                all_success = False
                created_pending_id = None
                
        except Exception as e:
            self.log_test("Public Customer Creation", False, f"Exception: {str(e)}")
            all_success = False
            created_pending_id = None
        
        # TEST 2: Test duplicate ID prevention
        print("   TEST 2: Duplicate ID prevention...")
        try:
            # Try to create another customer with same ID
            duplicate_data = {
                "first_name": "Duplicate",
                "last_name": "Customer",
                "id_number": f"QR_TEST_{unique_timestamp}",  # Same ID as before
                "date_of_birth": "1985-05-15",
                "id_expiration_date": "2026-12-31",
                "state_of_id": "NY"
            }
            
            response = requests.post(
                f"{self.api_url}/customers/public",
                json=duplicate_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should fail with 400 status
            duplicate_prevented = response.status_code == 400
            error_message = response.text if response.status_code != 200 else ""
            
            self.log_test("Duplicate ID Prevention", duplicate_prevented, 
                        f"Status: {response.status_code} (should be 400), Error: {error_message}")
            
            if not duplicate_prevented:
                all_success = False
                
        except Exception as e:
            self.log_test("Duplicate ID Prevention", False, f"Exception: {str(e)}")
            all_success = False
        
        # TEST 3: Test pending customer visibility (requires auth)
        print("   TEST 3: Pending customer visibility (admin access)...")
        if self.token and created_pending_id:
            try:
                response = requests.get(
                    f"{self.api_url}/pending-customers",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    pending_customers = response.json()
                    
                    # Find our created pending customer
                    found_pending = any(
                        customer.get('id') == created_pending_id 
                        for customer in pending_customers
                    )
                    
                    self.log_test("Pending Customer Visibility", found_pending, 
                                f"Found {len(pending_customers)} pending customers, Our customer found: {found_pending}")
                    
                    if not found_pending:
                        all_success = False
                else:
                    self.log_test("Pending Customer Visibility", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test("Pending Customer Visibility", False, f"Exception: {str(e)}")
                all_success = False
        else:
            self.log_test("Pending Customer Visibility", False, "No auth token or pending customer ID")
            all_success = False
        
        # TEST 4: Test customer approval process
        print("   TEST 4: Customer approval process...")
        if self.token and created_pending_id:
            try:
                response = requests.post(
                    f"{self.api_url}/pending-customers/{created_pending_id}/approve",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    approved_customer = response.json()
                    
                    # Verify approved customer structure
                    required_fields = ['id', 'first_name', 'last_name', 'id_number']
                    has_required_fields = all(field in approved_customer for field in required_fields)
                    
                    # Verify data integrity
                    data_preserved = (approved_customer.get('first_name') == 'QR' and 
                                    approved_customer.get('last_name') == 'TestCustomer')
                    
                    approval_success = has_required_fields and data_preserved
                    
                    self.log_test("Customer Approval", approval_success, 
                                f"Required fields: {has_required_fields}, Data preserved: {data_preserved}")
                    
                    if not approval_success:
                        all_success = False
                        
                    # Store approved customer ID for verification
                    approved_customer_id = approved_customer.get('id')
                    
                else:
                    self.log_test("Customer Approval", False, f"Status: {response.status_code}, Response: {response.text}")
                    all_success = False
                    approved_customer_id = None
                    
            except Exception as e:
                self.log_test("Customer Approval", False, f"Exception: {str(e)}")
                all_success = False
                approved_customer_id = None
        else:
            self.log_test("Customer Approval", False, "No auth token or pending customer ID")
            all_success = False
            approved_customer_id = None
        
        # TEST 5: Test approved customer appears in main customer list
        print("   TEST 5: Approved customer integration...")
        if self.token and approved_customer_id:
            try:
                response = requests.get(
                    f"{self.api_url}/customers?q=QR",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    customers = response.json()
                    
                    # Find our approved customer
                    found_approved = any(
                        customer.get('id') == approved_customer_id 
                        for customer in customers
                    )
                    
                    self.log_test("Approved Customer Integration", found_approved, 
                                f"Customer appears in main list: {found_approved}")
                    
                    if not found_approved:
                        all_success = False
                else:
                    self.log_test("Approved Customer Integration", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test("Approved Customer Integration", False, f"Exception: {str(e)}")
                all_success = False
        else:
            self.log_test("Approved Customer Integration", False, "No auth token or approved customer ID")
            all_success = False
        
        return all_success

    def test_transaction_completion_with_location_headers(self):
        """Test Transaction Completion API with Location Headers as requested in review"""
        print("\n💳 TESTING TRANSACTION COMPLETION API WITH LOCATION HEADERS...")
        print("   Testing POST /api/transactions endpoint with proper X-Location header")
        print("   Testing complete check-in flow with location headers")
        print("   Testing multi-location transaction isolation")
        print("   Testing payment methods (cash and card)")
        print("   Testing error handling for missing/invalid location headers")
        
        all_success = True
        locations = ['los-angeles', 'atlanta', 'cleveland', 'phoenix']
        location_tokens = {}
        location_customers = {}
        unique_timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # SETUP: Get tokens for each location
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
        
        # SETUP: Create test customers in each location
        print("   SETUP: Creating test customers in each location...")
        for location, token in location_tokens.items():
            try:
                headers_with_auth = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                customer_data = {
                    "first_name": "Transaction",
                    "last_name": f"Test_{location.title()}",
                    "id_number": f"TXN_TEST_{location.upper()}_{unique_timestamp}",
                    "date_of_birth": "1990-01-01",
                    "id_expiration_date": "2025-12-31",
                    "state_of_id": "CA"
                }
                
                response = requests.post(
                    f"{self.api_url}/customers",
                    json=customer_data,
                    headers=headers_with_auth,
                    timeout=10
                )
                
                if response.status_code == 200:
                    customer = response.json()
                    location_customers[location] = customer['id']
                    print(f"      ✅ Created customer for {location}: {customer['id']}")
                else:
                    print(f"      ❌ Failed to create customer for {location}: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                print(f"      ❌ Exception creating customer for {location}: {str(e)}")
                all_success = False
        
        # TEST 1: Transaction API with Location Headers
        print("   TEST 1: Transaction API with Location Headers...")
        transaction_ids = {}
        
        for location, token in location_tokens.items():
            if location not in location_customers:
                continue
                
            try:
                headers_with_location = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                transaction_data = {
                    "customer_id": location_customers[location],
                    "customer_name": f"Transaction Test_{location.title()}",
                    "transaction_type": "standalone",
                    "items": [
                        {"name": "Test Service", "price": 50.0, "quantity": 1}
                    ],
                    "subtotal": 50.0,
                    "discount_amount": 0.0,
                    "total_amount": 50.0,
                    "payment_method": "cash",
                    "notes": f"Test transaction for {location}"
                }
                
                response = requests.post(
                    f"{self.api_url}/transactions",
                    json=transaction_data,
                    headers=headers_with_location,
                    timeout=10
                )
                
                if response.status_code == 200:
                    transaction = response.json()
                    transaction_ids[location] = transaction.get('id')
                    
                    # Verify transaction structure
                    required_fields = ['id', 'customer_id', 'transaction_type', 'total_amount', 'payment_method']
                    has_required_fields = all(field in transaction for field in required_fields)
                    
                    # Verify data integrity
                    correct_customer = transaction.get('customer_id') == location_customers[location]
                    correct_amount = transaction.get('total_amount') == 50.0
                    correct_payment = transaction.get('payment_method') == 'cash'
                    
                    transaction_success = has_required_fields and correct_customer and correct_amount and correct_payment
                    
                    details = f"Required fields: {has_required_fields}, Customer: {correct_customer}, Amount: {correct_amount}, Payment: {correct_payment}"
                    self.log_test(f"Transaction API {location.title()}", transaction_success, details)
                    
                    if not transaction_success:
                        all_success = False
                else:
                    self.log_test(f"Transaction API {location.title()}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Transaction API {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # TEST 2: Check-in Complete Transaction Flow
        print("   TEST 2: Check-in Complete Transaction Flow...")
        checkin_ids = {}
        
        for location, token in location_tokens.items():
            if location not in location_customers:
                continue
                
            try:
                headers_with_location = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                # Step 1: Prepare check-in
                prepare_data = {
                    "customer_id": location_customers[location],
                    "membership_type": "1_day",
                    "room_type": "locker",
                    "room_number": 100 + locations.index(location)  # Different room for each location
                }
                
                prepare_response = requests.post(
                    f"{self.api_url}/checkin/prepare",
                    json=prepare_data,
                    headers=headers_with_location,
                    timeout=10
                )
                
                if prepare_response.status_code == 200:
                    prepare_data_response = prepare_response.json()
                    pending_checkin_id = prepare_data_response.get('pending_checkin_id')
                    
                    # Step 2: Complete check-in
                    complete_data = {
                        "pending_checkin_id": pending_checkin_id
                    }
                    
                    complete_response = requests.post(
                        f"{self.api_url}/checkin/complete",
                        json=complete_data,
                        headers=headers_with_location,
                        timeout=10
                    )
                    
                    if complete_response.status_code == 200:
                        complete_data_response = complete_response.json()
                        checkin_id = complete_data_response.get('id')
                        checkin_ids[location] = checkin_id
                        
                        # Step 3: Create transaction with location header
                        transaction_data = {
                            "customer_id": location_customers[location],
                            "customer_name": f"Transaction Test_{location.title()}",
                            "transaction_type": "checkin",
                            "items": [
                                {"name": "1-Day Membership", "price": 25.0, "quantity": 1}
                            ],
                            "subtotal": 25.0,
                            "discount_amount": 0.0,
                            "total_amount": 25.0,
                            "payment_method": "card",
                            "checkin_id": checkin_id,
                            "membership_type": "1_day",
                            "notes": f"Check-in transaction for {location}"
                        }
                        
                        transaction_response = requests.post(
                            f"{self.api_url}/transactions",
                            json=transaction_data,
                            headers=headers_with_location,
                            timeout=10
                        )
                        
                        if transaction_response.status_code == 200:
                            transaction = transaction_response.json()
                            
                            # Verify complete flow success
                            has_checkin_id = transaction.get('checkin_id') == checkin_id
                            correct_membership = transaction.get('membership_type') == '1_day'
                            correct_type = transaction.get('transaction_type') == 'checkin'
                            
                            flow_success = has_checkin_id and correct_membership and correct_type
                            
                            details = f"Checkin ID: {has_checkin_id}, Membership: {correct_membership}, Type: {correct_type}"
                            self.log_test(f"Complete Flow {location.title()}", flow_success, details)
                            
                            if not flow_success:
                                all_success = False
                        else:
                            self.log_test(f"Complete Flow {location.title()}", False, 
                                        f"Transaction failed: {transaction_response.status_code}")
                            all_success = False
                    else:
                        self.log_test(f"Complete Flow {location.title()}", False, 
                                    f"Complete failed: {complete_response.status_code}")
                        all_success = False
                else:
                    self.log_test(f"Complete Flow {location.title()}", False, 
                                f"Prepare failed: {prepare_response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Complete Flow {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # TEST 3: Multi-Location Transaction Isolation
        print("   TEST 3: Multi-Location Transaction Isolation...")
        for location, token in location_tokens.items():
            try:
                headers_with_location = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Location': location
                }
                
                # Get transactions for this location
                response = requests.get(
                    f"{self.api_url}/transactions",
                    headers=headers_with_location,
                    timeout=10
                )
                
                if response.status_code == 200:
                    transactions = response.json()
                    
                    # Check that this location's transactions exist
                    location_transaction_exists = any(
                        txn.get('id') == transaction_ids.get(location) 
                        for txn in transactions
                    ) if location in transaction_ids else True
                    
                    # Check that other locations' transactions don't exist here
                    other_transactions_isolated = True
                    for other_location, other_txn_id in transaction_ids.items():
                        if other_location != location and other_txn_id:
                            transaction_found = any(
                                txn.get('id') == other_txn_id 
                                for txn in transactions
                            )
                            if transaction_found:
                                other_transactions_isolated = False
                                break
                    
                    isolation_success = location_transaction_exists and other_transactions_isolated
                    
                    details = f"Own transaction exists: {location_transaction_exists}, Other transactions isolated: {other_transactions_isolated}, Total transactions: {len(transactions)}"
                    
                    self.log_test(f"Transaction Isolation {location.title()}", isolation_success, details)
                    
                    if not isolation_success:
                        all_success = False
                else:
                    self.log_test(f"Transaction Isolation {location.title()}", False, 
                                f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Transaction Isolation {location.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # TEST 4: Payment Methods (Cash and Card)
        print("   TEST 4: Payment Methods (Cash and Card)...")
        payment_methods = ['cash', 'card']
        
        for payment_method in payment_methods:
            # Use Los Angeles for payment method testing
            location = 'los-angeles'
            if location not in location_tokens or location not in location_customers:
                continue
                
            try:
                headers_with_location = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {location_tokens[location]}',
                    'X-Location': location
                }
                
                transaction_data = {
                    "customer_id": location_customers[location],
                    "customer_name": f"Transaction Test_{location.title()}",
                    "transaction_type": "standalone",
                    "items": [
                        {"name": f"Test {payment_method.title()} Payment", "price": 30.0, "quantity": 1}
                    ],
                    "subtotal": 30.0,
                    "discount_amount": 0.0,
                    "total_amount": 30.0,
                    "payment_method": payment_method,
                    "notes": f"Test {payment_method} payment method"
                }
                
                response = requests.post(
                    f"{self.api_url}/transactions",
                    json=transaction_data,
                    headers=headers_with_location,
                    timeout=10
                )
                
                if response.status_code == 200:
                    transaction = response.json()
                    
                    # Verify payment method is correctly stored
                    correct_payment_method = transaction.get('payment_method') == payment_method
                    has_transaction_id = 'id' in transaction
                    correct_amount = transaction.get('total_amount') == 30.0
                    
                    payment_success = correct_payment_method and has_transaction_id and correct_amount
                    
                    details = f"Payment method: {transaction.get('payment_method')}, Amount: {transaction.get('total_amount')}, ID: {has_transaction_id}"
                    self.log_test(f"Payment Method {payment_method.title()}", payment_success, details)
                    
                    if not payment_success:
                        all_success = False
                else:
                    self.log_test(f"Payment Method {payment_method.title()}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Payment Method {payment_method.title()}", False, f"Exception: {str(e)}")
                all_success = False
        
        # TEST 5: Error Handling - Missing X-Location Header
        print("   TEST 5: Error Handling - Missing X-Location Header...")
        try:
            headers_no_location = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.token}'  # Use default token without location
            }
            
            transaction_data = {
                "customer_id": location_customers.get('los-angeles', 'test-id'),
                "customer_name": "Test Customer",
                "transaction_type": "standalone",
                "items": [
                    {"name": "Test Service", "price": 25.0, "quantity": 1}
                ],
                "subtotal": 25.0,
                "discount_amount": 0.0,
                "total_amount": 25.0,
                "payment_method": "cash",
                "notes": "Test missing location header"
            }
            
            response = requests.post(
                f"{self.api_url}/transactions",
                json=transaction_data,
                headers=headers_no_location,
                timeout=10
            )
            
            # Should default to los-angeles location and work
            missing_header_handled = response.status_code == 200
            
            self.log_test("Missing X-Location Header", missing_header_handled, 
                        f"Status: {response.status_code} (should default to los-angeles)")
            
            if not missing_header_handled:
                all_success = False
                
        except Exception as e:
            self.log_test("Missing X-Location Header", False, f"Exception: {str(e)}")
            all_success = False
        
        # TEST 6: Error Handling - Invalid X-Location Header
        print("   TEST 6: Error Handling - Invalid X-Location Header...")
        try:
            headers_invalid_location = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.token}',
                'X-Location': 'invalid-location'
            }
            
            transaction_data = {
                "customer_id": location_customers.get('los-angeles', 'test-id'),
                "customer_name": "Test Customer",
                "transaction_type": "standalone",
                "items": [
                    {"name": "Test Service", "price": 25.0, "quantity": 1}
                ],
                "subtotal": 25.0,
                "discount_amount": 0.0,
                "total_amount": 25.0,
                "payment_method": "cash",
                "notes": "Test invalid location header"
            }
            
            response = requests.post(
                f"{self.api_url}/transactions",
                json=transaction_data,
                headers=headers_invalid_location,
                timeout=10
            )
            
            # Should default to los-angeles location and work
            invalid_header_handled = response.status_code == 200
            
            self.log_test("Invalid X-Location Header", invalid_header_handled, 
                        f"Status: {response.status_code} (should default to los-angeles)")
            
            if not invalid_header_handled:
                all_success = False
                
        except Exception as e:
            self.log_test("Invalid X-Location Header", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def get_summary(self):
        """Get test summary"""
        return {
            'tests_run': self.tests_run,
            'tests_passed': self.tests_passed,
            'success_rate': (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        }

    def run_all_tests(self):
        """Run all tests and return summary"""
        print("🚀 Starting Spa Management System API Tests...")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        
        # Authentication tests
        if not self.test_login():
            print("❌ Authentication failed - skipping remaining tests")
            return self.get_summary()
        
        # PRIORITY TESTS FROM REVIEW REQUEST
        print("\n" + "="*80)
        print("🎯 PRIORITY TESTS FROM REVIEW REQUEST")
        print("="*80)
        
        # MAIN FOCUS: Transaction Completion API with Location Headers
        self.test_transaction_completion_with_location_headers()
        
        # Additional tests from previous reviews
        # 1. QR Code Generation & Redirect Fix
        self.test_qr_code_generation_and_redirect()
        
        # 2. Authentication System Verification
        self.test_multi_location_authentication()
        self.test_super_admin_authentication()
        
        # 3. Multi-Location Database Isolation (already covered in multi-location auth test)
        
        # 4. Membership Form Access
        self.test_membership_form_access()
        
        return self.get_summary()

def main():
    """Main function"""
    tester = BathhouseAPITester()
    summary = tester.run_all_tests()
    
    print("\n" + "="*80)
    print("🏁 TESTING COMPLETE")
    print("="*80)
    print(f"📊 Results: {summary['tests_passed']}/{summary['tests_run']} tests passed")
    print(f"📈 Success Rate: {summary['success_rate']:.1f}%")
    
    if summary['tests_passed'] == summary['tests_run']:
        print("🎉 ALL TESTS PASSED! 🎉")
        return 0
    else:
        failed_count = summary['tests_run'] - summary['tests_passed']
        print(f"⚠️  {failed_count} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())