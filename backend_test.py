#!/usr/bin/env python3
"""
Academic Project Marketplace Backend API Tests
Tests all backend endpoints for authentication, projects, payments, and user data.
"""

import requests
import json
import os
import sys
from datetime import datetime, timedelta

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://academicshop.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_auth_signup(self):
        """Test user registration"""
        test_name = "POST /api/auth/signup"
        
        # Use realistic test data
        signup_data = {
            "name": "Sarah Johnson",
            "email": f"sarah.johnson.{datetime.now().strftime('%Y%m%d%H%M%S')}@university.edu",
            "password": "SecurePassword123!"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/signup", json=signup_data)
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                self.auth_token = data.get('token')
                self.user_data = data.get('user')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log_test(test_name, True, f"User created successfully: {self.user_data['name']}")
                return True
            else:
                self.log_test(test_name, False, f"Signup failed: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_auth_login(self):
        """Test user login with existing credentials"""
        test_name = "POST /api/auth/login"
        
        if not self.user_data:
            self.log_test(test_name, False, "No user data available for login test")
            return False
        
        login_data = {
            "email": self.user_data['email'],
            "password": "SecurePassword123!"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                token = data.get('token')
                if token:
                    self.auth_token = token
                    self.session.headers.update({'Authorization': f'Bearer {token}'})
                self.log_test(test_name, True, f"Login successful for: {data['user']['name']}")
                return True
            else:
                self.log_test(test_name, False, f"Login failed: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_auth_verify(self):
        """Test JWT token verification"""
        test_name = "GET /api/auth/verify"
        
        if not self.auth_token:
            self.log_test(test_name, False, "No auth token available for verification")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/auth/verify")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                user = data.get('user')
                self.log_test(test_name, True, f"Token verified for user: {user['name']}")
                return True
            else:
                self.log_test(test_name, False, f"Token verification failed: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_get_projects(self):
        """Test getting all projects"""
        test_name = "GET /api/projects"
        
        try:
            response = self.session.get(f"{API_BASE}/projects")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                projects = data.get('projects', [])
                self.log_test(test_name, True, f"Retrieved {len(projects)} projects")
                return True
            else:
                self.log_test(test_name, False, f"Failed to get projects: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_get_project_by_id(self):
        """Test getting specific project by ID"""
        test_name = "GET /api/projects/:id"
        
        # Test with existing project ID from sample data
        project_id = "1"
        
        try:
            response = self.session.get(f"{API_BASE}/projects/{project_id}")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                project = data.get('project')
                self.log_test(test_name, True, f"Retrieved project: {project['title']}")
                return True
            else:
                self.log_test(test_name, False, f"Failed to get project: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_get_project_not_found(self):
        """Test getting non-existent project"""
        test_name = "GET /api/projects/:id (not found)"
        
        # Test with non-existent project ID
        project_id = "999"
        
        try:
            response = self.session.get(f"{API_BASE}/projects/{project_id}")
            data = response.json()
            
            if response.status_code == 404 and not data.get('success'):
                self.log_test(test_name, True, "Correctly returned 404 for non-existent project")
                return True
            else:
                self.log_test(test_name, False, f"Expected 404 but got {response.status_code}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_create_checkout_session(self):
        """Test creating Stripe checkout session"""
        test_name = "POST /api/payments/checkout/session"
        
        if not self.auth_token:
            self.log_test(test_name, False, "Authentication required for checkout session")
            return False
        
        checkout_data = {
            "amount": 89.99,
            "currency": "usd",
            "success_url": f"{BASE_URL}/success",
            "cancel_url": f"{BASE_URL}/cancel",
            "metadata": {
                "project_id": "1",
                "product_name": "E-Commerce Website with Admin Panel"
            }
        }
        
        try:
            response = self.session.post(f"{API_BASE}/payments/checkout/session", json=checkout_data)
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                session_id = data.get('session_id')
                checkout_url = data.get('url')
                self.log_test(test_name, True, f"Checkout session created: {session_id}")
                return session_id
            else:
                self.log_test(test_name, False, f"Failed to create checkout session: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_payment_status(self, session_id):
        """Test checking payment status"""
        test_name = "GET /api/payments/checkout/status/:sessionId"
        
        if not session_id:
            self.log_test(test_name, False, "No session ID available for status check")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/payments/checkout/status/{session_id}")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                status = data.get('status')
                payment_status = data.get('payment_status')
                self.log_test(test_name, True, f"Payment status retrieved: {status}/{payment_status}")
                return True
            else:
                self.log_test(test_name, False, f"Failed to get payment status: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_custom_project_request(self):
        """Test submitting custom project request"""
        test_name = "POST /api/projects/custom-request"
        
        if not self.auth_token:
            self.log_test(test_name, False, "Authentication required for custom request")
            return False
        
        request_data = {
            "title": "Machine Learning Stock Prediction System",
            "category": "ai",
            "description": "Build a comprehensive ML system that analyzes stock market data and provides predictions using various algorithms including LSTM, Random Forest, and sentiment analysis from news data.",
            "technologies": ["Python", "TensorFlow", "Pandas", "NumPy", "Flask", "PostgreSQL"],
            "budget": 250,
            "deadline": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        try:
            response = self.session.post(f"{API_BASE}/projects/custom-request", json=request_data)
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                request_info = data.get('request')
                self.log_test(test_name, True, f"Custom request submitted: {request_info['title']}")
                return True
            else:
                self.log_test(test_name, False, f"Failed to submit custom request: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_get_user_requests(self):
        """Test getting user's custom requests"""
        test_name = "GET /api/user/requests"
        
        if not self.auth_token:
            self.log_test(test_name, False, "Authentication required for user requests")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/user/requests")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                requests = data.get('requests', [])
                self.log_test(test_name, True, f"Retrieved {len(requests)} user requests")
                return True
            else:
                self.log_test(test_name, False, f"Failed to get user requests: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_get_user_purchases(self):
        """Test getting user's purchases"""
        test_name = "GET /api/user/purchases"
        
        if not self.auth_token:
            self.log_test(test_name, False, "Authentication required for user purchases")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/user/purchases")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                purchases = data.get('purchases', [])
                self.log_test(test_name, True, f"Retrieved {len(purchases)} user purchases")
                return True
            else:
                self.log_test(test_name, False, f"Failed to get user purchases: {data.get('message', 'Unknown error')}", data)
                return False
                
        except Exception as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_unauthenticated_requests(self):
        """Test endpoints that should require authentication"""
        test_name = "Unauthenticated Access Tests"
        
        # Temporarily remove auth header
        original_headers = self.session.headers.copy()
        if 'Authorization' in self.session.headers:
            del self.session.headers['Authorization']
        
        protected_endpoints = [
            ("/api/auth/verify", "GET"),
            ("/api/user/purchases", "GET"),
            ("/api/user/requests", "GET"),
            ("/api/payments/checkout/session", "POST")
        ]
        
        all_passed = True
        for endpoint, method in protected_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{BASE_URL}{endpoint}")
                else:
                    response = self.session.post(f"{BASE_URL}{endpoint}", json={})
                
                if response.status_code == 401:
                    print(f"   ✅ {endpoint} correctly requires authentication")
                else:
                    print(f"   ❌ {endpoint} should require authentication but returned {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                print(f"   ❌ {endpoint} test failed: {str(e)}")
                all_passed = False
        
        # Restore auth headers
        self.session.headers.update(original_headers)
        
        self.log_test(test_name, all_passed, "Authentication protection verified" if all_passed else "Some endpoints lack proper authentication")
        return all_passed
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"\n🚀 Starting Academic Project Marketplace Backend API Tests")
        print(f"📍 Testing against: {API_BASE}")
        print("=" * 80)
        
        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        print("-" * 40)
        signup_success = self.test_auth_signup()
        if signup_success:
            self.test_auth_login()
            self.test_auth_verify()
        
        # Project Tests
        print("\n📚 PROJECT TESTS")
        print("-" * 40)
        self.test_get_projects()
        self.test_get_project_by_id()
        self.test_get_project_not_found()
        
        # Payment Tests
        print("\n💳 PAYMENT TESTS")
        print("-" * 40)
        session_id = self.test_create_checkout_session()
        if session_id:
            self.test_payment_status(session_id)
        
        # Custom Project Tests
        print("\n🛠️ CUSTOM PROJECT TESTS")
        print("-" * 40)
        self.test_custom_project_request()
        self.test_get_user_requests()
        
        # User Data Tests
        print("\n👤 USER DATA TESTS")
        print("-" * 40)
        self.test_get_user_purchases()
        
        # Security Tests
        print("\n🔒 SECURITY TESTS")
        print("-" * 40)
        self.test_unauthenticated_requests()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n🎉 All tests passed! Backend API is working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️ Some tests failed. Check the output above for details.")
        sys.exit(1)