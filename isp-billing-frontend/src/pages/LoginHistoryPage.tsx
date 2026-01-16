import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconHistory } from "@tabler/icons-react"
import { userService } from "@/services/api"
import { toast } from "sonner"

interface LoginHistory {
    id: number
    user?: {
        id?: number
        username?: string
        full_name?: string
    }
    user_id?: number
    username?: string
    user_name?: string
    ip_address: string
    user_agent: string
    login_time: string
    logout_time: string | null
    is_active: boolean
}

export default function LoginHistoryPage() {
    const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        fetchLoginHistory()
    }, [currentPage])

    const fetchLoginHistory = async () => {
        try {
            setLoading(true)
            const response = await userService.getLoginHistory({ page: currentPage })
            setLoginHistory(response.results || [])
            setTotalCount(response.count || 0)
            setTotalPages(Math.ceil((response.count || 0) / 10))
        } catch (error: any) {
            console.error("Failed to fetch login history:", error)
            toast.error("Failed to load login history")
        } finally {
            setLoading(false)
        }
    }

    const getBrowserName = (userAgent: string): string => {
        if (userAgent.includes("Chrome")) return "Chrome"
        if (userAgent.includes("Firefox")) return "Firefox"
        if (userAgent.includes("Safari")) return "Safari"
        if (userAgent.includes("Edge")) return "Edge"
        return "Unknown"
    }

    const getOSName = (userAgent: string): string => {
        if (userAgent.includes("Windows")) return "Windows"
        if (userAgent.includes("Mac")) return "macOS"
        if (userAgent.includes("Linux")) return "Linux"
        if (userAgent.includes("Android")) return "Android"
        if (userAgent.includes("iOS")) return "iOS"
        return "Unknown"
    }

    const getUserDisplayName = (history: LoginHistory): string => {
        if (history.user?.full_name) return history.user.full_name
        if (history.user?.username) return history.user.username
        if (history.user_name) return history.user_name
        if (history.username) return history.username
        return "N/A"
    }

    const getUserUsername = (history: LoginHistory): string => {
        if (history.user?.username) return history.user.username
        if (history.user_name) return history.user_name
        if (history.username) return history.username
        return "N/A"
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4">
                    <div className="flex items-center gap-2 flex-1">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/users">Users</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Login History</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="max-w-7xl mx-auto w-full space-y-6 mt-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <IconHistory className="h-8 w-8" />
                                    Login History
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    View all user login activities and sessions
                                </p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Sessions</CardDescription>
                                    <CardTitle className="text-3xl">{totalCount}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Active Sessions</CardDescription>
                                    <CardTitle className="text-3xl">
                                        {loginHistory.filter((h) => h.is_active).length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Ended Sessions</CardDescription>
                                    <CardTitle className="text-3xl">
                                        {loginHistory.filter((h) => !h.is_active).length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Login History Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Login Activity</CardTitle>
                                <CardDescription>Track user authentication and session information</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Login Time</TableHead>
                                            <TableHead>Logout Time</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Browser</TableHead>
                                            <TableHead>OS</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">
                                                    Loading...
                                                </TableCell>
                                            </TableRow>
                                        ) : loginHistory.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">
                                                    No login history found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            loginHistory.map((history) => (
                                                <TableRow key={history.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {getUserDisplayName(history)}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                @{getUserUsername(history)}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(history.login_time).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {history.logout_time
                                                            ? new Date(history.logout_time).toLocaleString()
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                                            {history.ip_address}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>{getBrowserName(history.user_agent)}</TableCell>
                                                    <TableCell>{getOSName(history.user_agent)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={history.is_active ? "default" : "secondary"}>
                                                            {history.is_active ? "Active" : "Ended"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {loginHistory.length} of {totalCount} sessions
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
