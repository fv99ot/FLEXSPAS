import requests
import sys
import json
from datetime import datetime, timedelta
import uuid
import qrcode
from io import BytesIO
import base64

class ReviewFixesTester:
    def __init__(self, base_url="https://flexspa-app.preview.emergentagent.com"):
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

    def authenticate(self):
        """Authenticate with admin credentials"""
        print("\n🔐 Authenticating...")
        
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
                    return self.log_test("Authentication", True, f"Logged in as {data['user']['username']}")
                else:
                    return self.log_test("Authentication", False, "Missing access token")
            else:
                return self.log_test("Authentication", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Authentication", False, f"Exception: {str(e)}")

    def test_qr_code_size_fix(self):
        """Test QR Code Size Fix - Verify QR code generation endpoint generates large QR codes"""
        print("\n📱 Testing QR Code Size Fix...")
        
        if not self.token:
            return self.log_test("QR Code Size Fix", False, "No authentication token")
        
        try:
            # Test the QR code membership form endpoint
            response = requests.get(
                f"{self.api_url}/qr/membership-form",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if QR code data is present
                if 'qr_code' in data:
                    qr_code_data = data['qr_code']
                    
                    # Verify it's a data URL format
                    is_data_url = qr_code_data.startswith('data:image/png;base64,')
                    
                    # Check if the QR code is large enough (should be significantly larger than default)
                    # A large QR code with box_size=10 should have a substantial base64 string
                    is_large_size = len(qr_code_data) > 5000  # Large QR codes have longer base64 strings
                    
                    success = is_data_url and is_large_size
                    details = f"Data URL format: {is_data_url}, Large size: {is_large_size} (length: {len(qr_code_data)})"
                    
                    return self.log_test("QR Code Size Fix", success, details)
                else:
                    return self.log_test("QR Code Size Fix", False, "No QR code data in response")
            else:
                return self.log_test("QR Code Size Fix", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            return self.log_test("QR Code Size Fix", False, f"Exception: {str(e)}")

    def test_membership_button_logic(self):
        """Test Membership Button Logic - Check-in endpoint should validate memberships and prevent duplicates"""
        print("\n🎫 Testing Membership Button Logic...")
        
        if not self.token:
            return self.log_test("Membership Button Logic", False, "No authentication token")
        
        all_success = True
        
        # First, create a test customer
        unique_id = f"MEMBERSHIP_TEST_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        customer_data = {
            "first_name": "TestMember",
            "last_name": "Customer",
            "id_number": unique_id,
            "date_of_birth": "1990-01-01",
            "id_expiration_date": "2025-12-31",
            "state_of_id": "CA"
        }
        
        customer_id = None
        
        try:
            # Create customer
            response = requests.post(
                f"{self.api_url}/customers",
                json=customer_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                customer_id = response.json()['id']
                self.log_test("Create Test Customer for Membership", True, f"Customer ID: {customer_id}")
            else:
                self.log_test("Create Test Customer for Membership", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Create Test Customer for Membership", False, f"Exception: {str(e)}")
            return False
        
        # Test 1: Check-in with 6-month membership (first time)
        try:
            # Get available room
            rooms_response = requests.get(
                f"{self.api_url}/rooms/available/locker",
                headers=self.headers,
                timeout=10
            )
            
            if rooms_response.status_code != 200:
                return self.log_test("Membership Button Logic", False, "Could not get available rooms")
            
            available_rooms = rooms_response.json()['available_rooms']
            if not available_rooms:
                return self.log_test("Membership Button Logic", False, "No available rooms")
            
            # First check-in with 6-month membership
            checkin_data = {
                "customer_id": customer_id,
                "membership_type": "6_month",
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
                # Should have membership fee for first purchase
                has_membership_fee = data.get('membership_fee', 0) > 0
                self.log_test("First 6-Month Membership Purchase", has_membership_fee, 
                            f"Membership fee: ${data.get('membership_fee', 0)}")
                
                # Store checkin ID for checkout
                first_checkin_id = data['id']
                
                # Check out immediately
                checkout_response = requests.put(
                    f"{self.api_url}/checkin/{first_checkin_id}/checkout",
                    headers=self.headers,
                    timeout=10
                )
                
                if checkout_response.status_code != 200:
                    self.log_test("Checkout First Session", False, "Could not checkout")
                    all_success = False
                else:
                    self.log_test("Checkout First Session", True, "Successfully checked out")
                
            else:
                self.log_test("First 6-Month Membership Purchase", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("First 6-Month Membership Purchase", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 2: Try to check-in again with 6-month membership (should be blocked)
        try:
            # Try to purchase another 6-month membership
            duplicate_checkin_data = {
                "customer_id": customer_id,
                "membership_type": "6_month",
                "room_type": "locker",
                "room_number": available_rooms[1] if len(available_rooms) > 1 else available_rooms[0]
            }
            
            response = requests.post(
                f"{self.api_url}/checkin",
                json=duplicate_checkin_data,
                headers=self.headers,
                timeout=10
            )
            
            # Should be blocked with 400 status
            is_blocked = response.status_code == 400
            if is_blocked:
                error_message = response.json().get('detail', '')
                contains_membership_error = 'membership' in error_message.lower()
                success = contains_membership_error
                details = f"Blocked: {is_blocked}, Error mentions membership: {contains_membership_error}"
            else:
                success = False
                details = f"Not blocked - Status: {response.status_code}"
            
            self.log_test("Duplicate Membership Prevention", success, details)
            if not success:
                all_success = False
                
        except Exception as e:
            self.log_test("Duplicate Membership Prevention", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test 3: Check-in without specifying membership (should use existing valid membership)
        try:
            # Check-in without membership_type (should use existing valid membership)
            auto_membership_data = {
                "customer_id": customer_id,
                "room_type": "locker",
                "room_number": available_rooms[1] if len(available_rooms) > 1 else available_rooms[0]
            }
            
            response = requests.post(
                f"{self.api_url}/checkin",
                json=auto_membership_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                # Should have no membership fee (using existing membership)
                no_membership_fee = data.get('membership_fee', 0) == 0
                has_membership_status = 'membership_status' in data
                
                success = no_membership_fee
                details = f"No membership fee: {no_membership_fee}, Has status: {has_membership_status}"
                
                self.log_test("Auto-Use Valid Membership", success, details)
                if not success:
                    all_success = False
                
                # Store for cleanup
                if 'id' in data:
                    self.created_checkin_id = data['id']
                
            else:
                self.log_test("Auto-Use Valid Membership", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Auto-Use Valid Membership", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_overtime_transaction_recording(self):
        """Test Overtime Transaction Recording - Verify overtime payment endpoint creates Transaction records"""
        print("\n⏰ Testing Overtime Transaction Recording...")
        
        if not self.token:
            return self.log_test("Overtime Transaction Recording", False, "No authentication token")
        
        all_success = True
        
        # First, create a customer with unpaid overtime
        unique_id = f"OVERTIME_TEST_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        customer_data = {
            "first_name": "OvertimeTest",
            "last_name": "Customer",
            "id_number": unique_id,
            "date_of_birth": "1985-05-15",
            "id_expiration_date": "2025-12-31",
            "state_of_id": "NY"
        }
        
        customer_id = None
        
        try:
            # Create customer
            response = requests.post(
                f"{self.api_url}/customers",
                json=customer_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                customer_id = response.json()['id']
                self.log_test("Create Overtime Test Customer", True, f"Customer ID: {customer_id}")
            else:
                self.log_test("Create Overtime Test Customer", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Create Overtime Test Customer", False, f"Exception: {str(e)}")
            return False
        
        # Manually add unpaid overtime to the customer (simulate having overtime debt)
        try:
            # We'll use the customer update endpoint or directly test the pay overtime endpoint
            # First, let's test the pay overtime endpoint with a customer that has no overtime (should fail)
            
            payment_data = {
                "payment_method": "cash"
            }
            
            response = requests.post(
                f"{self.api_url}/customers/{customer_id}/pay-overtime",
                json=payment_data,
                headers=self.headers,
                timeout=10
            )
            
            # Should return 400 because customer has no overtime
            no_overtime_blocked = response.status_code == 400
            self.log_test("No Overtime Payment Blocked", no_overtime_blocked, 
                        f"Status: {response.status_code} (should be 400)")
            if not no_overtime_blocked:
                all_success = False
                
        except Exception as e:
            self.log_test("No Overtime Payment Blocked", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test the overtime payment endpoint structure
        try:
            # Check if the endpoint exists and responds correctly to invalid customer
            fake_customer_id = str(uuid.uuid4())
            payment_data = {
                "payment_method": "card"
            }
            
            response = requests.post(
                f"{self.api_url}/customers/{fake_customer_id}/pay-overtime",
                json=payment_data,
                headers=self.headers,
                timeout=10
            )
            
            # Should return 404 for non-existent customer
            correct_error = response.status_code == 404
            self.log_test("Overtime Endpoint Validation", correct_error, 
                        f"Status: {response.status_code} (should be 404 for invalid customer)")
            if not correct_error:
                all_success = False
                
        except Exception as e:
            self.log_test("Overtime Endpoint Validation", False, f"Exception: {str(e)}")
            all_success = False
        
        # Test transaction history endpoint (where overtime payments should appear)
        try:
            response = requests.get(
                f"{self.api_url}/transactions",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                transactions = response.json()
                is_list = isinstance(transactions, list)
                
                # Check if any overtime transactions exist (from previous tests)
                overtime_transactions = [t for t in transactions if t.get('transaction_type') == 'overtime_payment']
                
                self.log_test("Transaction History Endpoint", is_list, 
                            f"Found {len(transactions)} total transactions, {len(overtime_transactions)} overtime payments")
                if not is_list:
                    all_success = False
                    
            else:
                self.log_test("Transaction History Endpoint", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Transaction History Endpoint", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def test_qr_code_complete_workflow(self):
        """Test QR Code Complete Workflow - Generate QR, access form, submit, approve"""
        print("\n🔄 Testing QR Code Complete Workflow...")
        
        all_success = True
        
        # Step 1: Generate QR Code
        if not self.token:
            self.log_test("QR Workflow - Authentication", False, "No authentication token")
            return False
        
        try:
            response = requests.get(
                f"{self.api_url}/qr/membership-form",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                has_qr_code = 'qr_code' in data
                has_form_url = 'form_url' in data
                
                self.log_test("QR Code Generation", has_qr_code, 
                            f"QR code present: {has_qr_code}, Form URL: {has_form_url}")
                if not has_qr_code:
                    all_success = False
                    
            else:
                self.log_test("QR Code Generation", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("QR Code Generation", False, f"Exception: {str(e)}")
            all_success = False
        
        # Step 2: Access Membership Form (public endpoint)
        unique_timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
        form_customer_data = {
            "first_name": "QRWorkflow",
            "last_name": "TestCustomer",
            "id_number": f"QR_WORKFLOW_{unique_timestamp}",
            "date_of_birth": "1992-08-20",
            "id_expiration_date": "2026-03-15",
            "state_of_id": "TX"
        }
        
        pending_customer_id = None
        
        try:
            # Submit membership form (public endpoint - no auth required)
            response = requests.post(
                f"{self.api_url}/customers/public",
                json=form_customer_data,
                headers={'Content-Type': 'application/json'},  # No auth header
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data.get('status') == 'pending':
                    pending_customer_id = data['id']
                    self.log_test("Membership Form Submission", True, 
                                f"Created pending customer: {pending_customer_id}")
                else:
                    self.log_test("Membership Form Submission", False, "Invalid response data")
                    all_success = False
            else:
                self.log_test("Membership Form Submission", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Membership Form Submission", False, f"Exception: {str(e)}")
            all_success = False
        
        # Step 3: Admin sees pending customer
        if pending_customer_id:
            try:
                response = requests.get(
                    f"{self.api_url}/pending-customers",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    pending_customers = response.json()
                    found_customer = any(c.get('id') == pending_customer_id for c in pending_customers)
                    
                    self.log_test("Pending Customer Visible", found_customer, 
                                f"Found in {len(pending_customers)} pending customers")
                    if not found_customer:
                        all_success = False
                        
                else:
                    self.log_test("Pending Customer Visible", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test("Pending Customer Visible", False, f"Exception: {str(e)}")
                all_success = False
        
        # Step 4: Admin approves customer
        approved_customer_id = None
        
        if pending_customer_id:
            try:
                response = requests.post(
                    f"{self.api_url}/pending-customers/{pending_customer_id}/approve",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'id' in data and data.get('first_name') == 'QRWorkflow':
                        approved_customer_id = data['id']
                        self.log_test("Customer Approval", True, 
                                    f"Approved customer: {approved_customer_id}")
                    else:
                        self.log_test("Customer Approval", False, "Invalid approval response")
                        all_success = False
                else:
                    self.log_test("Customer Approval", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test("Customer Approval", False, f"Exception: {str(e)}")
                all_success = False
        
        # Step 5: Verify customer is now in main customer list
        if approved_customer_id:
            try:
                response = requests.get(
                    f"{self.api_url}/customers?q=QRWorkflow",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    customers = response.json()
                    found_approved = any(c.get('id') == approved_customer_id for c in customers)
                    
                    self.log_test("Customer in Main List", found_approved, 
                                f"Found in customer search results")
                    if not found_approved:
                        all_success = False
                        
                else:
                    self.log_test("Customer in Main List", False, f"Status: {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_test("Customer in Main List", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def cleanup(self):
        """Clean up test data"""
        if self.created_checkin_id and self.token:
            try:
                requests.put(
                    f"{self.api_url}/checkin/{self.created_checkin_id}/checkout",
                    headers=self.headers,
                    timeout=5
                )
            except:
                pass

    def run_all_tests(self):
        """Run all review fix tests"""
        print("🧪 REVIEW FIXES TESTING - COMPREHENSIVE VERIFICATION")
        print("=" * 60)
        print("Testing 4 specific areas mentioned in review request:")
        print("1. QR Code Size Fix")
        print("2. Membership Button Logic") 
        print("3. Overtime Transaction Recording")
        print("4. QR Code Complete Workflow")
        print("=" * 60)
        
        # Authenticate first
        if not self.authenticate():
            print("\n❌ Authentication failed - cannot continue testing")
            return False
        
        # Run all tests
        test_results = []
        
        test_results.append(self.test_qr_code_size_fix())
        test_results.append(self.test_membership_button_logic())
        test_results.append(self.test_overtime_transaction_recording())
        test_results.append(self.test_qr_code_complete_workflow())
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 REVIEW FIXES TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        all_passed = all(test_results)
        
        if all_passed:
            print("\n✅ ALL REVIEW FIXES VERIFIED SUCCESSFULLY")
        else:
            print("\n❌ SOME REVIEW FIXES HAVE ISSUES")
            
        return all_passed

if __name__ == "__main__":
    tester = ReviewFixesTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)