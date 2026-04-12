import requests
import csv
import random

BASE_URL = "http://localhost:8081/api"
COUNT = 600

def main():
    print(f"--- Creating {COUNT} users and giving them some money ---")
    
    users_data = []

    with requests.Session() as s:
        for i in range(1, COUNT + 1):
            email = f"loadtest_user_{i}@example.com"
            password = "password123"
            
            reg_payload = {
                "email": email,
                "password": password,
                "firstName": f"User{i}",
                "lastName": "Test"
            }
             
            try:
                resp = s.post(f"{BASE_URL}/auth/register", json=reg_payload)
                if resp.status_code == 200:
                    token = resp.json()['token']
                    
                    amount = random.randint(500, 50000)
                    headers = {"Authorization": f"Bearer {token}"}
                    dep_payload = {"amount": amount}
                    
                    s.post(f"{BASE_URL}/users/deposit", json=dep_payload, headers=headers)
                    
                    users_data.append([email, password])
                    
                    if i % 50 == 0:
                        print(f"Created {i} users...")
                else:
                    login_resp = s.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
                    if login_resp.status_code == 200:
                         users_data.append([email, password])
            except Exception as e:
                print(f"Error on {i}: {e}")

    with open("users.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(users_data)
    
    print("Done. Created users.csv")

if __name__ == "__main__":
    main()
