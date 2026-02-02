import * as React from "react"
import { authService } from "@/services/api"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconReport,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavSecondary } from "@/components/layout/nav-secondary"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin User",
    email: "admin@isp.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "Subscriptions",
      icon: IconReport,
      items: [
        {
          title: "All Subscriptions",
          url: "/subscriptions",
        },
        {
          title: "Active",
          url: "/subscriptions?status=active",
        },
        {
          title: "Suspended",
          url: "/subscriptions?status=suspended",
        },
        {
          title: "Expired",
          url: "/subscriptions?status=expired",
        },
      ],
    },
    {
      title: "Configure",
      icon: IconSettings,
      items: [
        {
          title: "Zones",
          url: "/zones",
        },
        {
          title: "Connection Types",
          url: "/connection-types",
        },
      ],
    },
    {
      title: "MikroTik",
      icon: IconDatabase,
      items: [
        {
          title: "Routers",
          url: "/mikrotik/routers",
        },
        {
          title: "Queue Profiles",
          url: "/mikrotik/queue-profiles",
        },
        {
          title: "Sync Logs",
          url: "/mikrotik/sync-logs",
        },
      ],
    },
    {
      title: "Packages",
      url: "/packages",
      icon: IconDatabase,
    },
    {
      title: "Billing",
      icon: IconReport,
      items: [
        {
          title: "Bills",
          url: "/bills",
        },
        {
          title: "Payments",
          url: "/billing/payments",
        },
        {
          title: "Invoices",
          url: "/billing/invoices",
        },
        {
          title: "Advance Payments",
          url: "/billing/advance-payments",
        },
        {
          title: "Discounts",
          url: "/billing/discounts",
        },
        {
          title: "Connection Fees",
          url: "/billing/connection-fees",
        },
        {
          title: "Refunds",
          url: "/billing/refunds",
        },
      ],
    },
    {
      title: "HR",
      icon: IconUsers,
      items: [
        {
          title: "All Users",
          url: "/users",
        },
        {
          title: "Create User",
          url: "/users/create",
        },
        {
          title: "Login History",
          url: "/users/login-history",
        },
      ],
    },
    {
      title: "Schedule",
      url: "/schedule",
      icon: IconReport,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState(data.user)

  React.useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const profile = await authService.getProfile()
      setUser({
        name: profile.full_name || profile.username || "User",
        email: profile.email || "",
        avatar: profile.profile_picture || "",
      })
    } catch (error) {
      console.error("Failed to fetch profile", error)
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconDashboard className="!size-5" />
                <span className="text-base font-semibold">ISP System</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
