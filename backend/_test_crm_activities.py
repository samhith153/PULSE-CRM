import asyncio, httpx

async def main():
    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=15) as c:
        r = await c.post("/api/v1/auth/login",
                         json={"email": "admin@kalnet-pulse.com", "password": "Admin@123456"})
        token = r.json()["data"]["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        r2 = await c.get("/api/v1/crm-activities", headers=h)
        print("Status:", r2.status_code)
        import json
        body = r2.json()
        print(json.dumps(body, indent=2, default=str)[:1000])

        r3 = await c.get("/api/v1/crm-activities/owners", headers=h)
        print("\nOwners status:", r3.status_code)
        print(json.dumps(r3.json(), indent=2, default=str)[:300])

asyncio.run(main())
