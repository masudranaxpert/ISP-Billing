import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardService } from "@/services/api"
import {
    Loader2,
    Users,
    DollarSign,
    Wifi,
    FileText,
    TrendingUp,
    AlertCircle
} from "lucide-react"
import { toast } from "sonner"

function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [revenueData, setRevenueData] = useState<any>(null)
    const [customerGrowth, setCustomerGrowth] = useState<any>(null)
    const [recentActivity, setRecentActivity] = useState<any[]>([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch each API individually with error handling
            let quickStats = null
            let revenue = null
            let growth = null
            let activity = []

            // Quick Stats
            try {
                quickStats = await dashboardService.getQuickStats()
            } catch (error) {
                console.error("Failed to fetch quick stats:", error)
            }

            // Revenue
            try {
                revenue = await dashboardService.getMonthlyRevenue()
            } catch (error) {
                console.error("Failed to fetch revenue:", error)
            }

            // Customer Growth
            try {
                growth = await dashboardService.getCustomerGrowth()
            } catch (error) {
                console.error("Failed to fetch customer growth:", error)
            }

            // Recent Activity
            try {
                const activityData = await dashboardService.getRecentActivity()
                activity = activityData?.results || []
            } catch (error) {
                console.error("Failed to fetch recent activity:", error)
            }

            setStats(quickStats)
            setRevenueData(revenue)
            setCustomerGrowth(growth)
            setRecentActivity(activity)
        } catch (error) {
            console.error("Failed to fetch dashboard data", error)
            toast.error("Some dashboard data could not be loaded")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    const statCards = [
        {
            title: "Total Customers",
            value: stats?.total_customers || 0,
            icon: Users,
            description: "Active customer base",
            trend: "+12% from last month",
            color: "text-blue-600"
        },
        {
            title: "Monthly Revenue",
            value: `৳${stats?.monthly_revenue || 0}`,
            icon: DollarSign,
            description: "This month's earnings",
            trend: "+8% from last month",
            color: "text-green-600"
        },
        {
            title: "Active Subscriptions",
            value: stats?.active_subscriptions || 0,
            icon: Wifi,
            description: "Currently active",
            trend: "+5% from last month",
            color: "text-purple-600"
        },
        {
            title: "Pending Bills",
            value: stats?.pending_bills || 0,
            icon: FileText,
            description: "Awaiting payment",
            trend: "Track payment status",
            color: "text-orange-600"
        }
    ]

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">
                                    ISP System
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Dashboard</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col gap-6 p-6 bg-muted/20">
                    {/* Welcome Section */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Welcome back! Here's what's happening with your ISP business today.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((card, index) => (
                            <Card key={index} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {card.title}
                                    </CardTitle>
                                    <card.icon className={`h-5 w-5 ${card.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{card.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {card.description}
                                    </p>
                                    <div className="flex items-center mt-2 text-xs">
                                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                                        <span className="text-green-600">{card.trend}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Revenue Chart */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Revenue Overview</CardTitle>
                                <CardDescription>
                                    Monthly revenue for the last 12 months
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Revenue chart will be displayed here</p>
                                        <p className="text-xs mt-1">Total Revenue: ৳{revenueData?.total || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>
                                    Latest updates and actions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.slice(0, 6).map((activity: any, i: number) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        {activity.description || "Activity logged"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {activity.timestamp || "Just now"}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No recent activity</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Info Row */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Customer Growth */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Growth</CardTitle>
                                <CardDescription>
                                    New customers this month
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <div className="text-3xl font-bold text-green-600">
                                        +{customerGrowth?.new_customers || 0}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Total: {customerGrowth?.total || 0} customers
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Package Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Package</CardTitle>
                                <CardDescription>
                                    Most popular package
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <div className="text-2xl font-bold">
                                        {stats?.top_package?.name || "N/A"}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {stats?.top_package?.subscribers || 0} subscribers
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Collection Rate */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Collection Rate</CardTitle>
                                <CardDescription>
                                    Payment collection efficiency
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {stats?.collection_rate || 0}%
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Of total bills collected
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default DashboardPage
