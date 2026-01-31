import requests

def test_api_login():
    url = "http://127.0.0.1:8000/token"
    payload = {
        "username": "admin@biovan.internal",
        "password": "securepassword123"
    }
    
    print(f"POST {url} with {payload}")
    
    try:
        response = requests.post(url, data=payload)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: API Login worked!")
        else:
            print("FAILURE: API returned error.")
            
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_api_login()
