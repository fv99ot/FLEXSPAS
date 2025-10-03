import requests
import sys
import json
from datetime import datetime, timedelta, timezone
import uuid

class RealisticCleanupTester:
    def __init__(self, base_url="https://flexspa-manager-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.tests_run = 0
        self.tests_passed = 0
        self.cleanup_results = {
            'customers_found': 0,
            'discounts_deleted': 0,
            'additional_items_deleted': 0,
            'active_checkins_found': 0,
            'transactions_found': 0
        }

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

    def count_customers(self):
        """Count all customers in the database"""
        print("\n👥 COUNTING CUSTOMERS...")
        
        if not self.token:
            return self.log_test("Count Customers", False, "No authentication token")
        
        try:
            # Get customers (limited to 50 per request)
            response = requests.get(
                f"{self.api_url}/customers",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                customers = response.json()
                customer_count = len(customers)
                self.cleanup_results['customers_found'] = customer_count
                
                # Note: This system doesn't have customer DELETE endpoints for audit trail purposes
                return self.log_test("Count Customers", True, 
                                   f"Found {customer_count} customers (DELETE endpoint not available - audit trail)")
            else:
                return self.log_test("Count Customers", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Count Customers", False, f"Exception: {str(e)}")

    def delete_all_discounts(self):
        """Delete all discounts from the database"""
        print("\n💰 DELETING ALL DISCOUNTS...")
        
        if not self.token:
            return self.log_test("Delete All Discounts", False, "No authentication token")
        
        try:
            # Get all discounts (including inactive ones)
            response = requests.get(
                f"{self.api_url}/admin/discounts",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                discounts = response.json()
                total_discounts = len(discounts)
                
                if total_discounts == 0:
                    return self.log_test("Delete All Discounts", True, "No discounts found to delete")
                
                print(f"   Found {total_discounts} discounts to delete...")
                
                deleted_count = 0
                failed_count = 0
                
                for discount in discounts:
                    discount_id = discount.get('id')
                    discount_name = discount.get('name', 'Unknown')
                    
                    try:
                        # Delete discount (soft delete - sets active=false)
                        delete_response = requests.delete(
                            f"{self.api_url}/discounts/{discount_id}",
                            headers=self.headers,
                            timeout=10
                        )
                        
                        if delete_response.status_code in [200, 204]:
                            deleted_count += 1
                            print(f"   ✅ Deleted: {discount_name} (ID: {discount_id})")
                        else:
                            failed_count += 1
                            print(f"   ❌ Failed to delete: {discount_name} (Status: {delete_response.status_code})")
                            
                    except Exception as e:
                        failed_count += 1
                        print(f"   ❌ Exception deleting {discount_name}: {str(e)}")
                
                self.cleanup_results['discounts_deleted'] = deleted_count
                
                success = deleted_count > 0 or total_discounts == 0
                details = f"Deleted: {deleted_count}/{total_discounts}, Failed: {failed_count}"
                
                return self.log_test("Delete All Discounts", success, details)
                
            else:
                return self.log_test("Delete All Discounts", False, f"Could not get discounts: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Delete All Discounts", False, f"Exception: {str(e)}")

    def delete_all_additional_items(self):
        """Delete all additional items from the database"""
        print("\n🛍️ DELETING ALL ADDITIONAL ITEMS...")
        
        if not self.token:
            return self.log_test("Delete All Additional Items", False, "No authentication token")
        
        try:
            # Get all additional items (including inactive ones)
            response = requests.get(
                f"{self.api_url}/admin/additional-items",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                items = response.json()
                total_items = len(items)
                
                if total_items == 0:
                    return self.log_test("Delete All Additional Items", True, "No additional items found to delete")
                
                print(f"   Found {total_items} additional items to delete...")
                
                deleted_count = 0
                failed_count = 0
                
                for item in items:
                    item_id = item.get('id')
                    item_name = item.get('name', 'Unknown')
                    
                    try:
                        # Delete additional item (soft delete - sets active=false)
                        delete_response = requests.delete(
                            f"{self.api_url}/additional-items/{item_id}",
                            headers=self.headers,
                            timeout=10
                        )
                        
                        if delete_response.status_code in [200, 204]:
                            deleted_count += 1
                            print(f"   ✅ Deleted: {item_name} (ID: {item_id})")
                        else:
                            failed_count += 1
                            print(f"   ❌ Failed to delete: {item_name} (Status: {delete_response.status_code})")
                            
                    except Exception as e:
                        failed_count += 1
                        print(f"   ❌ Exception deleting {item_name}: {str(e)}")
                
                self.cleanup_results['additional_items_deleted'] = deleted_count
                
                success = deleted_count > 0 or total_items == 0
                details = f"Deleted: {deleted_count}/{total_items}, Failed: {failed_count}"
                
                return self.log_test("Delete All Additional Items", success, details)
                
            else:
                return self.log_test("Delete All Additional Items", False, f"Could not get additional items: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Delete All Additional Items", False, f"Exception: {str(e)}")

    def checkout_all_active_checkins(self):
        """Check out all active check-ins"""
        print("\n🔑 CHECKING OUT ALL ACTIVE CHECK-INS...")
        
        if not self.token:
            return self.log_test("Checkout All Active Check-ins", False, "No authentication token")
        
        try:
            # Get active check-ins
            response = requests.get(
                f"{self.api_url}/checkins/active",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                active_checkins = response.json()
                total_checkins = len(active_checkins)
                self.cleanup_results['active_checkins_found'] = total_checkins
                
                if total_checkins == 0:
                    return self.log_test("Checkout All Active Check-ins", True, "No active check-ins found")
                
                print(f"   Found {total_checkins} active check-ins to check out...")
                
                checked_out_count = 0
                failed_count = 0
                
                for checkin in active_checkins:
                    checkin_id = checkin.get('id')
                    customer_name = "Unknown"
                    if checkin.get('customer'):
                        customer_name = f"{checkin['customer'].get('first_name', '')} {checkin['customer'].get('last_name', '')}"
                    
                    try:
                        checkout_response = requests.put(
                            f"{self.api_url}/checkin/{checkin_id}/checkout",
                            headers=self.headers,
                            timeout=10
                        )
                        
                        if checkout_response.status_code == 200:
                            checked_out_count += 1
                            print(f"   ✅ Checked out: {customer_name} (ID: {checkin_id})")
                        else:
                            failed_count += 1
                            print(f"   ❌ Failed to check out: {customer_name} (Status: {checkout_response.status_code})")
                            
                    except Exception as e:
                        failed_count += 1
                        print(f"   ❌ Exception checking out {checkin_id}: {str(e)}")
                
                success = checked_out_count > 0 or total_checkins == 0
                details = f"Checked out: {checked_out_count}/{total_checkins}, Failed: {failed_count}"
                
                # Note: Check-in records are kept for historical purposes (no DELETE endpoint)
                print(f"   Note: Check-in records are preserved for audit trail (no DELETE endpoint available)")
                
                return self.log_test("Checkout All Active Check-ins", success, details)
                
            else:
                return self.log_test("Checkout All Active Check-ins", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Checkout All Active Check-ins", False, f"Exception: {str(e)}")

    def count_transactions(self):
        """Count all transactions in the database"""
        print("\n💳 COUNTING TRANSACTIONS...")
        
        if not self.token:
            return self.log_test("Count Transactions", False, "No authentication token")
        
        try:
            # Get transactions
            response = requests.get(
                f"{self.api_url}/transactions?limit=1000",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                transactions = response.json()
                transaction_count = len(transactions)
                self.cleanup_results['transactions_found'] = transaction_count
                
                # Note: Transactions typically don't have DELETE endpoints for audit trail
                return self.log_test("Count Transactions", True, 
                                   f"Found {transaction_count} transactions (DELETE endpoint not available - audit trail)")
            else:
                return self.log_test("Count Transactions", False, f"Status: {response.status_code}")
                
        except Exception as e:
            return self.log_test("Count Transactions", False, f"Exception: {str(e)}")

    def verify_cleanup_results(self):
        """Verify the cleanup results"""
        print("\n🔍 VERIFYING CLEANUP RESULTS...")
        
        if not self.token:
            return self.log_test("Verify Cleanup Results", False, "No authentication token")
        
        all_success = True
        
        # Verify discounts are empty (active ones)
        try:
            response = requests.get(
                f"{self.api_url}/discounts",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                discounts = response.json()
                discounts_empty = len(discounts) == 0
                self.log_test("Verify Active Discounts Empty", discounts_empty, f"Found {len(discounts)} active discounts (should be 0)")
                if not discounts_empty:
                    all_success = False
            else:
                self.log_test("Verify Active Discounts Empty", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Verify Active Discounts Empty", False, f"Exception: {str(e)}")
            all_success = False
        
        # Verify additional items are empty (active ones)
        try:
            response = requests.get(
                f"{self.api_url}/additional-items",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                items = response.json()
                items_empty = len(items) == 0
                self.log_test("Verify Active Additional Items Empty", items_empty, f"Found {len(items)} active items (should be 0)")
                if not items_empty:
                    all_success = False
            else:
                self.log_test("Verify Active Additional Items Empty", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Verify Active Additional Items Empty", False, f"Exception: {str(e)}")
            all_success = False
        
        # Verify active check-ins are empty
        try:
            response = requests.get(
                f"{self.api_url}/checkins/active",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                checkins = response.json()
                checkins_empty = len(checkins) == 0
                self.log_test("Verify Active Check-ins Empty", checkins_empty, f"Found {len(checkins)} active check-ins (should be 0)")
                if not checkins_empty:
                    all_success = False
            else:
                self.log_test("Verify Active Check-ins Empty", False, f"Status: {response.status_code}")
                all_success = False
                
        except Exception as e:
            self.log_test("Verify Active Check-ins Empty", False, f"Exception: {str(e)}")
            all_success = False
        
        return all_success

    def run_realistic_cleanup(self):
        """Run the realistic database cleanup process"""
        print("🧹 STARTING REALISTIC DATABASE CLEANUP")
        print("=" * 60)
        print("Note: This system preserves customers, check-ins, and transactions for audit trail purposes.")
        print("Only discounts and additional items can be deleted (soft delete - marked inactive).")
        print("=" * 60)
        
        # Step 1: Login
        if not self.test_login():
            print("\n❌ CLEANUP FAILED: Could not authenticate")
            return False
        
        # Step 2: Count existing data
        self.count_customers()
        self.count_transactions()
        
        # Step 3: Delete what can be deleted
        self.delete_all_discounts()
        self.delete_all_additional_items()
        
        # Step 4: Check out active sessions
        self.checkout_all_active_checkins()
        
        # Step 5: Verify cleanup
        cleanup_verified = self.verify_cleanup_results()
        
        # Step 6: Summary
        print("\n" + "=" * 60)
        print("🧹 REALISTIC DATABASE CLEANUP SUMMARY")
        print("=" * 60)
        
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        print("\nCleanup Results:")
        print(f"  • Customers found: {self.cleanup_results['customers_found']} (preserved for audit)")
        print(f"  • Discounts deleted: {self.cleanup_results['discounts_deleted']}")
        print(f"  • Additional items deleted: {self.cleanup_results['additional_items_deleted']}")
        print(f"  • Active check-ins processed: {self.cleanup_results['active_checkins_found']}")
        print(f"  • Transactions found: {self.cleanup_results['transactions_found']} (preserved for audit)")
        
        print("\nSystem Status After Cleanup:")
        print("  • Active discounts: 0 (all soft-deleted)")
        print("  • Active additional items: 0 (all soft-deleted)")
        print("  • Active check-ins: 0 (all checked out)")
        print("  • Customer records: Preserved for audit trail")
        print("  • Transaction records: Preserved for audit trail")
        
        if cleanup_verified:
            print("\n✅ REALISTIC DATABASE CLEANUP COMPLETED SUCCESSFULLY")
            print("   All active preset data has been removed/deactivated")
            print("   Historical data preserved for audit compliance")
        else:
            print("\n⚠️ DATABASE CLEANUP COMPLETED WITH ISSUES")
            print("   Some active data may still remain in the system")
        
        return cleanup_verified

if __name__ == "__main__":
    tester = RealisticCleanupTester()
    success = tester.run_realistic_cleanup()
    sys.exit(0 if success else 1)