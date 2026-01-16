from routeros_api import RouterOsApiPool

MIKROTIK_IP = "180.148.213.201"
USERNAME = "API"
PASSWORD = "API@9889"
PORT = 110

def get_online_pppoe_users():
    api_pool = RouterOsApiPool(
        MIKROTIK_IP,
        username=USERNAME,
        password=PASSWORD,
        port=PORT,
        plaintext_login=True
    )

    api = api_pool.get_api()

    # Active PPPoE connections
    ppp_active = api.get_resource('/ppp/active')

    users = ppp_active.get()

    api_pool.disconnect()

    return users


if __name__ == "__main__":
    online_users = get_online_pppoe_users()

    if not online_users:
        print("❌ No PPPoE users online")
    else:
        print(f"✅ Online PPPoE Users: {len(online_users)}\n")
        for user in online_users:
            print(f"""
User      : {user.get('name')}
IP        : {user.get('address')}
Uptime    : {user.get('uptime')}
Caller-ID : {user.get('caller-id')}
Service   : {user.get('service')}
""")
