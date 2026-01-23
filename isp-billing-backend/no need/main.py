from librouteros import connect

# ===========================
# MikroTik Router Credentials
# ===========================
ROUTER_IP = "180.148.213.201"
USERNAME = "API"
PASSWORD = "API@9889"
PORT = 110


def connect_router():
    try:
        api = connect(
            host=ROUTER_IP,
            username=USERNAME,
            password=PASSWORD,
            port=PORT
        )
        print("\n✅ Connected to MikroTik Successfully!\n")
        return api
    except Exception as e:
        print("❌ Connection Failed:", e)
        exit()


def show_identity(api):
    print("\n📌 Router Identity:")
    response = api(cmd="/system/identity/print")
    for item in response:
        print(" →", item.get("name"))


def show_interfaces(api):
    print("\n📌 Interface List:")
    response = api(cmd="/interface/print")
    for item in response:
        print(item)


def show_pppoe_users(api):
    print("\n📌 PPPoE Users:")
    response = api(cmd="/ppp/secret/print")
    for user in response:
        print(user)


def show_pppoe_online(api):
    print("\n📌 Online PPPoE Users:")
    response = api(cmd="/ppp/active/print")
    for user in response:
        print(user)


def create_pppoe_user(api):
    name = input("Enter PPPoE username: ")
    password = input("Enter PPPoE password: ")

    api(
        cmd="/ppp/secret/add",
        name=name,
        password=password,
        service="pppoe",
        disabled="no"
    )
    print(f"\n✅ PPPoE User '{name}' Created Successfully!")


def delete_pppoe_user(api):
    name = input("Enter PPPoE username to remove: ")

    api(cmd="/ppp/secret/remove", numbers=name)
    print(f"\n🗑 PPPoE User '{name}' Removed Successfully!")


def disable_pppoe_user(api):
    name = input("Enter PPPoE username to DISABLE: ")

    # 1️⃣ Find ALL secrets with this name
    secrets = api(cmd="/ppp/secret/print")
    matched = False

    for s in secrets:
        if s.get("name") == name:
            matched = True
            api(
                cmd="/ppp/secret/set",
                numbers=s[".id"],
                disabled="yes"
            )

    if not matched:
        print(f"❌ PPPoE User '{name}' not found!")
        return

    print(f"\n🚫 PPPoE User '{name}' Disabled (ALL secrets)!")

    # 2️⃣ Remove ALL active sessions
    active_users = api(cmd="/ppp/active/print")
    disconnected = False

    for user in active_users:
        if user.get("name") == name:
            api(
                cmd="/ppp/active/remove",
                numbers=user[".id"]
            )
            disconnected = True

    if disconnected:
        print(f"🔌 All active sessions disconnected for '{name}'")
    else:
        print("ℹ️ User was not online")


def show_ip_list(api):
    print("\n📌 IP Address List:")
    response = api(cmd="/ip/address/print")
    for item in response:
        print(item)


def show_firewall_rules(api):
    print("\n📌 Firewall Rules:")
    response = api(cmd="/ip/firewall/filter/print")
    for rule in response:
        print(rule)


def show_system_info(api):
    print("\n📌 System Resource Info:")
    response = api(cmd="/system/resource/print")
    for item in response:
        print(item)


def main():
    api = connect_router()

    while True:
        print("\n========================")
        print("     MikroTik Menu")
        print("========================")
        print("1. Show Router Identity")
        print("2. Show Interface List")
        print("3. Show PPPoE Users")
        print("4. Show Online PPPoE Users")
        print("5. Create PPPoE User")
        print("6. Delete PPPoE User")
        print("7. Disable PPPoE User (by username)")
        print("8. Show IP Address List")
        print("9. Show Firewall Rules")
        print("10. Show System Info")
        print("0. Exit")
        print("========================")

        choice = input("Select Option: ")

        if choice == "1":
            show_identity(api)
        elif choice == "2":
            show_interfaces(api)
        elif choice == "3":
            show_pppoe_users(api)
        elif choice == "4":
            show_pppoe_online(api)
        elif choice == "5":
            create_pppoe_user(api)
        elif choice == "6":
            delete_pppoe_user(api)
        elif choice == "7":
            disable_pppoe_user(api)
        elif choice == "8":
            show_ip_list(api)
        elif choice == "9":
            show_firewall_rules(api)
        elif choice == "10":
            show_system_info(api)
        elif choice == "0":
            print("\n👋 Exiting... Bye!\n")
            break
        else:
            print("❌ Invalid Option!")


if __name__ == "__main__":
    main()
