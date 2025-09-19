#!/usr/bin/env python3
"""
Focused test for the customer approval system to identify any potential issues
"""

import requests
import json
from datetime import datetime
import uuid

class FocusedApprovalTester:
    def __init__(self):
        self.base_url = "https://flexspa-manager.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}

    def login(self):
        """Login as admin"""
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
            print(f"✅ Logged in as {data['user']['username']} ({data['user']['role']})")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False

    def test_multiple_approval_scenarios(self):
        """Test multiple approval scenarios to identify any patterns"""
        print("\n🔍 Testing Multiple Approval Scenarios...")
        
        scenarios = [
            {
                "name": "Scenario 1: Standard Customer",
                "data": {
                    "first_name": "Alice",
                    "last_name": "Johnson",
                    "id_number": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}A",
                    "date_of_birth": "1988-04-12",
                    "id_expiration_date": "2026-08-15",
                    "state_of_id": "CA"
                }
            },
            {
                "name": "Scenario 2: Customer with Special Characters",
                "data": {
                    "first_name": "José",
                    "last_name": "García-López",
                    "id_number": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}B",
                    "date_of_birth": "1995-12-03",
                    "id_expiration_date": "2027-01-20",
                    "state_of_id": "TX"
                }
            },
            {
                "name": "Scenario 3: Customer with Long Names",
                "data": {
                    "first_name": "Christopher",
                    "last_name": "Williamson-Henderson",
                    "id_number": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}C",
                    "date_of_birth": "1982-07-28",
                    "id_expiration_date": "2025-11-30",
                    "state_of_id": "NY"
                }
            }
        ]
        
        for scenario in scenarios:
            print(f"\n   {scenario['name']}:")
            success = self.test_single_approval_flow(scenario['data'])
            if not success:
                print(f"   ❌ {scenario['name']} FAILED")
                return False
            else:
                print(f"   ✅ {scenario['name']} PASSED")
        
        return True

    def test_single_approval_flow(self, customer_data):
        """Test a single approval flow"""
        try:
            # Step 1: Submit QR form
            response = requests.post(
                f"{self.api_url}/customers/public",
                json=customer_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"      QR Form submission failed: {response.status_code} - {response.text}")
                return False
            
            pending_data = response.json()
            pending_id = pending_data.get('id')
            print(f"      QR Form submitted: {pending_id}")
            
            # Step 2: Get pending customers
            response = requests.get(
                f"{self.api_url}/pending-customers",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"      Get pending failed: {response.status_code}")
                return False
            
            pending_customers = response.json()
            found = any(c.get('id') == pending_id for c in pending_customers)
            if not found:
                print(f"      Pending customer not found in list")
                return False
            
            print(f"      Found in pending list: {len(pending_customers)} total")
            
            # Step 3: Approve customer
            response = requests.post(
                f"{self.api_url}/pending-customers/{pending_id}/approve",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"      Approval failed: {response.status_code} - {response.text}")
                return False
            
            approved_data = response.json()
            approved_id = approved_data.get('id')
            print(f"      Approved successfully: {approved_id}")
            
            # Step 4: Verify in main customers
            response = requests.get(
                f"{self.api_url}/customers?q={customer_data['first_name']}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"      Customer search failed: {response.status_code}")
                return False
            
            customers = response.json()
            found_approved = any(
                c.get('first_name') == customer_data['first_name'] and 
                c.get('last_name') == customer_data['last_name'] 
                for c in customers
            )
            
            if not found_approved:
                print(f"      Approved customer not found in main list")
                return False
            
            print(f"      Verified in main customers list")
            return True
            
        except Exception as e:
            print(f"      Exception: {str(e)}")
            return False

    def test_edge_cases(self):
        """Test edge cases that might cause issues"""
        print("\n🧪 Testing Edge Cases...")
        
        # Test 1: Try to approve non-existent customer
        fake_id = str(uuid.uuid4())
        response = requests.post(
            f"{self.api_url}/pending-customers/{fake_id}/approve",
            headers=self.headers,
            timeout=10
        )
        
        if response.status_code == 404:
            print("   ✅ Non-existent customer approval correctly rejected")
        else:
            print(f"   ❌ Non-existent customer approval: Expected 404, got {response.status_code}")
            return False
        
        # Test 2: Try to approve without authentication
        response = requests.post(
            f"{self.api_url}/pending-customers/{fake_id}/approve",
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 403:
            print("   ✅ Unauthenticated approval correctly rejected")
        else:
            print(f"   ❌ Unauthenticated approval: Expected 403, got {response.status_code}")
            return False
        
        # Test 3: Try to get pending customers without auth
        response = requests.get(
            f"{self.api_url}/pending-customers",
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 403:
            print("   ✅ Unauthenticated pending list access correctly rejected")
        else:
            print(f"   ❌ Unauthenticated pending list: Expected 403, got {response.status_code}")
            return False
        
        return True

    def test_concurrent_approvals(self):
        """Test what happens with rapid successive approvals"""
        print("\n⚡ Testing Rapid Successive Operations...")
        
        # Create multiple pending customers quickly
        pending_ids = []
        
        for i in range(3):
            customer_data = {
                "first_name": f"Rapid{i}",
                "last_name": "Test",
                "id_number": f"RAPID{datetime.now().strftime('%Y%m%d%H%M%S')}{i}",
                "date_of_birth": "1990-01-01",
                "id_expiration_date": "2026-01-01",
                "state_of_id": "CA"
            }
            
            response = requests.post(
                f"{self.api_url}/customers/public",
                json=customer_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                pending_ids.append(response.json().get('id'))
                print(f"   Created pending customer {i+1}: {pending_ids[-1]}")
            else:
                print(f"   ❌ Failed to create pending customer {i+1}")
                return False
        
        # Now approve them rapidly
        approved_count = 0
        for i, pending_id in enumerate(pending_ids):
            response = requests.post(
                f"{self.api_url}/pending-customers/{pending_id}/approve",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                approved_count += 1
                print(f"   ✅ Approved customer {i+1}")
            else:
                print(f"   ❌ Failed to approve customer {i+1}: {response.status_code}")
        
        success = approved_count == len(pending_ids)
        print(f"   Approved {approved_count}/{len(pending_ids)} customers")
        return success

    def run_focused_tests(self):
        """Run all focused tests"""
        print("🎯 Starting Focused Customer Approval Tests...")
        
        if not self.login():
            return False
        
        tests = [
            ("Multiple Approval Scenarios", self.test_multiple_approval_scenarios),
            ("Edge Cases", self.test_edge_cases),
            ("Rapid Successive Operations", self.test_concurrent_approvals)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    print(f"✅ {test_name} - PASSED")
                    passed += 1
                else:
                    print(f"❌ {test_name} - FAILED")
            except Exception as e:
                print(f"❌ {test_name} - EXCEPTION: {str(e)}")
        
        print(f"\n📊 Focused Test Results: {passed}/{total} passed ({(passed/total)*100:.1f}%)")
        return passed == total

if __name__ == "__main__":
    tester = FocusedApprovalTester()
    success = tester.run_focused_tests()
    exit(0 if success else 1)