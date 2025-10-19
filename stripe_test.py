#!/usr/bin/env python3
"""
Test Stripe integration specifically
"""

import requests
import json
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://academicshop.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

def test_stripe_config():
    """Test if Stripe is configured properly"""
    
    # First, create a user and get auth token
    signup_data = {
        "name": "Test User",
        "email": f"test.{datetime.now().strftime('%Y%m%d%H%M%S')}@test.com",
        "password": "TestPassword123!"
    }
    
    session = requests.Session()
    
    # Sign up
    response = session.post(f"{API_BASE}/auth/signup", json=signup_data)
    if response.status_code != 200:
        print("❌ Failed to create test user")
        return False
    
    data = response.json()
    token = data.get('token')
    session.headers.update({'Authorization': f'Bearer {token}'})
    
    # Test checkout session creation
    checkout_data = {
        "amount": 10.00,  # Small test amount
        "currency": "usd",
        "success_url": f"{BASE_URL}/success",
        "cancel_url": f"{BASE_URL}/cancel",
        "metadata": {
            "project_id": "1",
            "product_name": "Test Product"
        }
    }
    
    print("🧪 Testing Stripe checkout session creation...")
    response = session.post(f"{API_BASE}/payments/checkout/session", json=checkout_data)
    
    print(f"Status Code: {response.status_code}")
    
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200 and data.get('success'):
            print("✅ Stripe integration is working!")
            return True
        else:
            print("❌ Stripe integration failed")
            print(f"Error: {data.get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Failed to parse response: {e}")
        print(f"Raw response: {response.text}")
        return False

if __name__ == "__main__":
    test_stripe_config()