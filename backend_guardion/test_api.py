"""
Test Authentication API Endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

print("="*60)
print("GuardIOn API Testing")
print("="*60)

# Test 1: Health Check
print("\n1. Testing Health Check...")
response = requests.get(f"{BASE_URL}/health")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 2: Register a new user
print("\n2. Testing User Registration...")
user_data = {
    "email": "parent@example.com",
    "password": "securepassword123",
    "name": "John Doe",
    "phone_number": "+2348012345678"
}

response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
print(f"Status: {response.status_code}")
if response.status_code == 201:
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("✅ Registration successful!")
else:
    print(f"Error: {response.text}")

# Test 3: Login
print("\n3. Testing User Login...")
login_data = {
    "email": "parent@example.com",
    "password": "securepassword123"
}

response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    tokens = response.json()
    print(f"Response: {json.dumps(tokens, indent=2)}")
    access_token = tokens["access_token"]
    print("✅ Login successful!")
else:
    print(f"Error: {response.text}")
    exit(1)

# Test 4: Get current user info (with authentication)
print("\n4. Testing Get Current User (Protected Route)...")
headers = {
    "Authorization": f"Bearer {access_token}"
}

response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("✅ Protected route access successful!")
else:
    print(f"Error: {response.text}")

# Test 5: Update user profile
print("\n5. Testing Update User Profile...")
update_data = {
    "name": "John Doe Updated",
    "phone_number": "+2348098765432"
}

response = requests.patch(f"{BASE_URL}/api/v1/users/me", json=update_data, headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("✅ Profile update successful!")
else:
    print(f"Error: {response.text}")

# Test 6: Try to login with wrong password (should fail)
print("\n6. Testing Login with Wrong Password (Should Fail)...")
wrong_login = {
    "email": "parent@example.com",
    "password": "wrongpassword"
}

response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=wrong_login)
print(f"Status: {response.status_code}")
if response.status_code == 401:
    print("✅ Correctly rejected wrong password!")
else:
    print(f"Unexpected response: {response.text}")

# Test 7: Try to access protected route without token (should fail)
print("\n7. Testing Protected Route Without Token (Should Fail)...")
response = requests.get(f"{BASE_URL}/api/v1/auth/me")
print(f"Status: {response.status_code}")
if response.status_code == 403:
    print("✅ Correctly rejected unauthorized access!")
else:
    print(f"Unexpected response: {response.text}")

print("\n" + "="*60)
print("Testing Complete!")
print("="*60)
