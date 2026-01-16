from routeros_api import RouterOsApiPool

MIKROTIK_IP = "180.148.213.201"
USERNAME = "API"
PASSWORD = "API@9889"
PORT = 110
def connect_api():
    return RouterOsApiPool(
        MIKROTIK_IP,
        username=USERNAME,
        password=PASSWORD,
        port=PORT,
        plaintext_login=True
    )

def get_ppp_profiles(api):
    profiles = api.get_resource('/ppp/profile')
    return profiles.get()

def get_online_pppoe_users(api):
    active = api.get_resource('/ppp/active')
    return active.get()

if __name__ == "__main__":
    api_pool = connect_api()
    api = api_pool.get_api()

    # 🔹 PPP PROFILES
    profiles = get_ppp_profiles(api)
    print(f"\n📦 Total PPP Profiles: {len(profiles)}\n")

    for p in profiles:
        print(f"""
Profile Name : {p.get('name')}
Local Addr  : {p.get('local-address')}
Remote Addr : {p.get('remote-address')}
Rate Limit  : {p.get('rate-limit')}
""")

    # 🔹 ONLINE USERS
    online_users = get_online_pppoe_users(api)
    print(f"\n✅ Online PPPoE Users: {len(online_users)}\n")

    for u in online_users:
        print(f"""
User   : {u.get('name')}
IP     : {u.get('address')}
Uptime : {u.get('uptime')}
MAC    : {u.get('caller-id')}
""")

    api_pool.disconnect()