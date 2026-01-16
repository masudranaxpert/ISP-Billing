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
    FileText,
    AlertCircle,
    UserCheck,
    UserX,
    Gift,
    Wallet
} from "lucide-react"
import { toast } from "sonner"

function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [recentActivity, setRecentActivity] = useState<any[]>([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // We use getOverview() which now returns the comprehensive payload
            const overviewData = await dashboardService.getOverview()
            setStats(overviewData)

            // Still fetch recent activity separately if needed, or extract if included (currently separate endpoint usually)
            try {
                const activityData = await dashboardService.getRecentActivity()
                setRecentActivity(activityData || [])
            } catch (error) {
                console.error("Failed to fetch recent activity:", error)
            }

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

    // Safely access nested data using optional chaining
    const financials = stats?.financials?.this_month || {}
    const subs = stats?.overview?.subscriptions || {}
    const revenueHistory = stats?.revenue_chart || []

    const financialCards = [
        {
            title: "Billed This Month",
            value: `৳${financials.billed || 0}`,
            icon: DollarSign,
            description: "Total invoice amount generated",
            color: "text-blue-600 bg-blue-100"
        },
        {
            title: "Collected This Month",
            value: `৳${financials.collected || 0}`,
            icon: Wallet,
            description: "Total payment received",
            color: "text-green-600 bg-green-100"
        },
        {
            title: "Due This Month",
            value: `৳${financials.due || 0}`,
            icon: AlertCircle, // Using AlertCircle for dues
            description: "Pending collection",
            color: "text-red-600 bg-red-100"
        },
        {
            title: "Total Advance",
            value: `৳${stats?.financials?.advance_balance || 0}`,
            icon: FileText,
            description: "Customer advance balance",
            color: "text-purple-600 bg-purple-100"
        }
    ]

    const clientCards = [
        {
            title: "Total Clients",
            value: subs.total || 0,
            icon: Users,
            color: "text-gray-600"
        },
        {
            title: "Active Clients",
            value: subs.active || 0,
            icon: UserCheck,
            color: "text-green-600"
        },
        {
            title: "Suspended",
            value: subs.suspended || 0,
            icon: UserX,
            color: "text-red-600"
        },
        {
            title: "Free Clients",
            value: subs.free || 0,
            icon: Gift,
            color: "text-orange-600"
        }
    ]

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                        <p className="text-muted-foreground">
                            Business snapshots for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    {/* Financial Stats Row */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {financialCards.map((card, index) => (
                            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-all">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {card.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-full ${card.color.split(' ')[1]}`}>
                                        <card.icon className={`h-4 w-4 ${card.color.split(' ')[0]}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{card.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {card.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Client Stats Row */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {clientCards.map((card, index) => (
                            <Card key={index} className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {card.title}
                                    </CardTitle>
                                    <card.icon className={`h-4 w-4 ${card.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{card.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts & Activity Row */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Revenue Chart */}
                        <Card className="col-span-4 shadow-md">
                            <CardHeader>
                                <CardTitle>Revenue History</CardTitle>
                                <CardDescription>
                                    Monthly revenue for the last 6 months
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-end justify-between px-2 gap-2">
                                    {revenueHistory.length > 0 ? (
                                        revenueHistory.map((item: any, i: number) => {
                                            const maxVal = Math.max(...revenueHistory.map((h: any) => h.total));
                                            const heightPercent = maxVal > 0 ? (item.total / maxVal) * 100 : 0;

                                            // Handle cases where all values are 0
                                            const finalHeight = maxVal === 0 ? 5 : heightPercent;

                                            return (
                                                <div key={i} className="flex flex-col items-center justify-end w-full group">
                                                    <div className="relative w-full flex items-end justify-center h-full">
                                                        <div
                                                            className="w-[80%] bg-primary/80 rounded-t-sm hover:bg-primary transition-all duration-500 relative group-hover:shadow-lg"
                                                            style={{ height: `${finalHeight}%`, minHeight: '4px' }}
                                                        >
                                                            {/* Tooltip on hover */}
                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                                ৳{item.total}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground mt-2 font-medium">{item.name}</span>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            No revenue data available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="col-span-3 shadow-md">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>
                                    Latest system updates
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.slice(0, 6).map((activity: any, i: number) => (
                                            <div key={i} className="flex items-center">
                                                <div className="ml-4 space-y-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        {activity.description || activity.message || "Activity logged"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : "Just now"}
                                                    </p>
                                                </div>
                                                <div className="ml-auto font-medium text-xs text-muted-foreground">
                                                    {activity.time_ago}
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
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default DashboardPage
