import requests
import sys
import json
from datetime import datetime, timedelta
import jwt
import time

class AdminLoginTester:
    def __init__(self, base_url="https://flex-enterprise-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user_info = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def test_admin_login_success(self):
        """Test successful admin login with correct credentials"""
        print("\n🔐 Testing Admin Login - SUCCESS CASE...")
        
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "admin", "password": "admin123"},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                has_token = 'access_token' in data
                has_user = 'user' in data
                has_token_type = 'token_type' in data
                
                if has_token and has_user and has_token_type:
                    self.token = data['access_token']
                    self.admin_user_info = data['user']
                    self.headers['Authorization'] = f'Bearer {self.token}'
                    
                    # Verify user information
                    user = data['user']
                    correct_username = user.get('username') == 'admin'
                    correct_role = user.get('role') == 'manager'
                    has_user_id = 'id' in user
                    
                    success = correct_username and correct_role and has_user_id
                    details = f"Username: {user.get('username')}, Role: {user.get('role')}, ID: {user.get('id')}"
                    return self.log_test("Admin Login Success", success, details)
                else:
                    missing_fields = []
                    if not has_token: missing_fields.append('access_token')
                    if not has_user: missing_fields.append('user')
                    if not has_token_type: missing_fields.append('token_type')
                    return self.log_test("Admin Login Success", False, f"Missing fields: {missing_fields}")
            else:
                return self.log_test("Admin Login Success", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Admin Login Success", False, f"Exception: {str(e)}")

    def test_admin_login_wrong_password(self):
        """Test admin login with correct username but wrong password"""
        print("\n🔐 Testing Admin Login - WRONG PASSWORD...")
        
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "admin", "password": "wrongpassword"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 401 Unauthorized
            success = response.status_code == 401
            details = f"Status: {response.status_code}"
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'No detail')}"
                except:
                    details += f", Response: {response.text}"
            
            return self.log_test("Wrong Password Rejection", success, details)
            
        except Exception as e:
            return self.log_test("Wrong Password Rejection", False, f"Exception: {str(e)}")

    def test_admin_login_wrong_username(self):
        """Test admin login with wrong username"""
        print("\n🔐 Testing Admin Login - WRONG USERNAME...")
        
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "wronguser", "password": "admin123"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 401 Unauthorized
            success = response.status_code == 401
            details = f"Status: {response.status_code}"
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'No detail')}"
                except:
                    details += f", Response: {response.text}"
            
            return self.log_test("Wrong Username Rejection", success, details)
            
        except Exception as e:
            return self.log_test("Wrong Username Rejection", False, f"Exception: {str(e)}")

    def test_admin_login_invalid_credentials(self):
        """Test admin login with completely invalid credentials"""
        print("\n🔐 Testing Admin Login - INVALID CREDENTIALS...")
        
        try:
            response = requests.post(
                f"{self.api_url}/login",
                json={"username": "invalid", "password": "invalid"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 401 Unauthorized
            success = response.status_code == 401
            details = f"Status: {response.status_code}"
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'No detail')}"
                except:
                    details += f", Response: {response.text}"
            
            return self.log_test("Invalid Credentials Rejection", success, details)
            
        except Exception as e:
            return self.log_test("Invalid Credentials Rejection", False, f"Exception: {str(e)}")

    def test_token_format_and_expiration(self):
        """Test JWT token format and expiration"""
        print("\n🔐 Testing Token Format and Expiration...")
        
        if not self.token:
            return self.log_test("Token Format Test", False, "No token available")
        
        try:
            # Decode JWT token without verification to check structure
            decoded = jwt.decode(self.token, options={"verify_signature": False})
            
            # Check required fields
            has_user_id = 'user_id' in decoded
            has_role = 'role' in decoded
            has_exp = 'exp' in decoded
            
            if has_user_id and has_role and has_exp:
                user_id = decoded['user_id']
                role = decoded['role']
                exp_timestamp = decoded['exp']
                
                # Check if token is not expired
                current_time = time.time()
                is_not_expired = exp_timestamp > current_time
                
                # Check if expiration is reasonable (should be 8 hours from now, give or take)
                exp_datetime = datetime.fromtimestamp(exp_timestamp)
                time_diff = exp_datetime - datetime.now()
                reasonable_expiration = timedelta(hours=7) < time_diff < timedelta(hours=9)
                
                success = is_not_expired and reasonable_expiration and role == 'manager'
                details = f"User ID: {user_id}, Role: {role}, Expires: {exp_datetime}, Valid: {is_not_expired}"
                return self.log_test("Token Format and Expiration", success, details)
            else:
                missing_fields = []
                if not has_user_id: missing_fields.append('user_id')
                if not has_role: missing_fields.append('role')
                if not has_exp: missing_fields.append('exp')
                return self.log_test("Token Format and Expiration", False, f"Missing JWT fields: {missing_fields}")
                
        except Exception as e:
            return self.log_test("Token Format and Expiration", False, f"Exception: {str(e)}")

    def test_token_authentication_protected_endpoint(self):
        """Test using the token to access a protected endpoint"""
        print("\n🔐 Testing Token Authentication on Protected Endpoint...")
        
        if not self.token:
            return self.log_test("Token Authentication", False, "No token available")
        
        try:
            # Test accessing a protected endpoint that requires authentication
            response = requests.get(
                f"{self.api_url}/users",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Should find the admin user in the list
                    admin_found = any(user.get('username') == 'admin' for user in data)
                    return self.log_test("Token Authentication", admin_found, f"Found {len(data)} users, admin found: {admin_found}")
                else:
                    return self.log_test("Token Authentication", False, "Invalid response format")
            else:
                return self.log_test("Token Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Token Authentication", False, f"Exception: {str(e)}")

    def test_role_based_access_manager(self):
        """Test manager role access to manager-only endpoints"""
        print("\n🔐 Testing Manager Role Access...")
        
        if not self.token:
            return self.log_test("Manager Role Access", False, "No token available")
        
        try:
            # Test accessing manager-only endpoint (create user)
            test_user_data = {
                "username": f"testemployee_{datetime.now().strftime('%H%M%S')}",
                "password": "testpass123",
                "role": "employee"
            }
            
            response = requests.post(
                f"{self.api_url}/users",
                json=test_user_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                created_user_id = data.get('id')
                
                # Clean up - delete the test user
                if created_user_id:
                    delete_response = requests.delete(
                        f"{self.api_url}/users/{created_user_id}",
                        headers=self.headers,
                        timeout=10
                    )
                    cleanup_success = delete_response.status_code == 200
                else:
                    cleanup_success = False
                
                success = created_user_id is not None and cleanup_success
                details = f"Created user: {data.get('username')}, Cleanup: {cleanup_success}"
                return self.log_test("Manager Role Access", success, details)
            else:
                return self.log_test("Manager Role Access", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("Manager Role Access", False, f"Exception: {str(e)}")

    def test_token_without_bearer_prefix(self):
        """Test token authentication without Bearer prefix (should fail)"""
        print("\n🔐 Testing Token Without Bearer Prefix...")
        
        if not self.token:
            return self.log_test("Token Without Bearer", False, "No token available")
        
        try:
            # Test with token but without Bearer prefix
            headers_no_bearer = {
                'Content-Type': 'application/json',
                'Authorization': self.token  # Missing "Bearer " prefix
            }
            
            response = requests.get(
                f"{self.api_url}/users",
                headers=headers_no_bearer,
                timeout=10
            )
            
            # Should fail with 401 or 403
            success = response.status_code in [401, 403]
            details = f"Status: {response.status_code} (should be 401/403 without Bearer prefix)"
            return self.log_test("Token Without Bearer Prefix", success, details)
            
        except Exception as e:
            return self.log_test("Token Without Bearer Prefix", False, f"Exception: {str(e)}")

    def test_invalid_token_access(self):
        """Test access with invalid token"""
        print("\n🔐 Testing Invalid Token Access...")
        
        try:
            # Test with completely invalid token
            headers_invalid = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token_here'
            }
            
            response = requests.get(
                f"{self.api_url}/users",
                headers=headers_invalid,
                timeout=10
            )
            
            # Should fail with 401
            success = response.status_code == 401
            details = f"Status: {response.status_code} (should be 401 for invalid token)"
            return self.log_test("Invalid Token Rejection", success, details)
            
        except Exception as e:
            return self.log_test("Invalid Token Rejection", False, f"Exception: {str(e)}")

    def test_admin_user_exists_in_database(self):
        """Test that admin user exists and has correct properties"""
        print("\n🔐 Testing Admin User Database Existence...")
        
        if not self.token or not self.admin_user_info:
            return self.log_test("Admin User Database Check", False, "No token or admin info available")
        
        try:
            # Get all users and verify admin exists
            response = requests.get(
                f"{self.api_url}/users",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                users = response.json()
                
                # Find admin user
                admin_user = None
                for user in users:
                    if user.get('username') == 'admin':
                        admin_user = user
                        break
                
                if admin_user:
                    # Verify admin properties
                    correct_role = admin_user.get('role') == 'manager'
                    has_id = 'id' in admin_user
                    has_created_at = 'created_at' in admin_user
                    no_password_field = 'password' not in admin_user  # Password should not be returned
                    
                    success = correct_role and has_id and has_created_at and no_password_field
                    details = f"Role: {admin_user.get('role')}, ID: {admin_user.get('id')}, No password exposed: {no_password_field}"
                    return self.log_test("Admin User Database Check", success, details)
                else:
                    return self.log_test("Admin User Database Check", False, "Admin user not found in database")
            else:
                return self.log_test("Admin User Database Check", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Admin User Database Check", False, f"Exception: {str(e)}")

    def test_password_hashing_verification(self):
        """Test that password is properly hashed and verified"""
        print("\n🔐 Testing Password Hashing and Verification...")
        
        # This test verifies that the login system properly handles password hashing
        # by testing multiple login attempts with slight variations
        
        test_cases = [
            ("admin", "admin123", True, "Correct credentials"),
            ("admin", "admin124", False, "Wrong password (off by one)"),
            ("admin", "Admin123", False, "Wrong case"),
            ("admin", "admin123 ", False, "Extra space"),
            ("admin", " admin123", False, "Leading space"),
            ("Admin", "admin123", False, "Wrong username case"),
        ]
        
        all_success = True
        
        for username, password, should_succeed, description in test_cases:
            try:
                response = requests.post(
                    f"{self.api_url}/login",
                    json={"username": username, "password": password},
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if should_succeed:
                    success = response.status_code == 200
                    expected_status = "200 (success)"
                else:
                    success = response.status_code == 401
                    expected_status = "401 (unauthorized)"
                
                details = f"{description} - Status: {response.status_code} (expected {expected_status})"
                test_result = self.log_test(f"Password Hash Test: {description}", success, details)
                
                if not test_result:
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Password Hash Test: {description}", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def run_all_tests(self):
        """Run all admin login tests"""
        print("🚀 Starting Comprehensive Admin Login Testing...")
        print("=" * 60)
        
        # Test 1: Successful admin login
        self.test_admin_login_success()
        
        # Test 2: Token format and expiration
        self.test_token_format_and_expiration()
        
        # Test 3: Token authentication on protected endpoint
        self.test_token_authentication_protected_endpoint()
        
        # Test 4: Manager role access
        self.test_role_based_access_manager()
        
        # Test 5: Admin user exists in database
        self.test_admin_user_exists_in_database()
        
        # Test 6: Password hashing verification
        self.test_password_hashing_verification()
        
        # Test 7: Wrong password
        self.test_admin_login_wrong_password()
        
        # Test 8: Wrong username
        self.test_admin_login_wrong_username()
        
        # Test 9: Invalid credentials
        self.test_admin_login_invalid_credentials()
        
        # Test 10: Token without Bearer prefix
        self.test_token_without_bearer_prefix()
        
        # Test 11: Invalid token access
        self.test_invalid_token_access()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"🏁 ADMIN LOGIN TESTING COMPLETE")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL ADMIN LOGIN TESTS PASSED!")
            return True
        else:
            print("⚠️  SOME ADMIN LOGIN TESTS FAILED!")
            return False

if __name__ == "__main__":
    tester = AdminLoginTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)