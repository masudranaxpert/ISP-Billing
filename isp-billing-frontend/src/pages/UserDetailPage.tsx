import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    IconArrowLeft,
    IconEdit,
    IconTrash,
    IconUser,
    IconMail,
    IconPhone,
    IconCalendar,
    IconClock,
    IconShield,
} from "@tabler/icons-react"
import { userService } from "@/services/api"
import { toast } from "sonner"

interface User {
    id: number
    username: string
    email: string
    phone: string
    first_name: string
    last_name: string
    full_name: string
    role: string
    role_display: string
    status: string
    profile_picture: string
    last_login: string
    last_login_ip: string
    date_joined: string
    updated_at: string
}

interface LoginHistory {
    id: number
    ip_address: string
    user_agent: string
    login_time: string
    logout_time: string
    is_active: boolean
}

export default function UserDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchUserDetails()
            fetchLoginHistory()
        }
    }, [id])

    const fetchUserDetails = async () => {
        try {
            setLoading(true)
            const data = await userService.getUser(Number(id))
            setUser(data)
        } catch (error: any) {
            console.error("Failed to fetch user details:", error)
            toast.error("Failed to load user details")
        } finally {
            setLoading(false)
        }
    }

    const fetchLoginHistory = async () => {
        try {
            const response = await userService.getLoginHistory({ user: id })
            setLoginHistory(response.results || [])
        } catch (error: any) {
            console.error("Failed to fetch login history:", error)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this user?")) return

        try {
            await userService.deleteUser(Number(id))
            toast.success("User deleted successfully")
            navigate("/users")
        } catch (error: any) {
            console.error("Failed to delete user:", error)
            toast.error("Failed to delete user")
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "admin":
                return "destructive"
            case "manager":
                return "default"
            case "accountant":
                return "secondary"
            default:
                return "outline"
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        return status === "active" ? "default" : "secondary"
    }

    if (loading) {
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
                                        <BreadcrumbPage>User Details</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        <p className="text-center py-8">Loading...</p>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    }

    if (!user) {
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
                                        <BreadcrumbPage>User Details</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        <p className="text-center py-8">User not found</p>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
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
                                    <BreadcrumbPage>{user.full_name || user.username}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="max-w-7xl mx-auto w-full space-y-6 mt-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
                                    <IconArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-bold">User Details</h1>
                                    <p className="text-muted-foreground mt-1">
                                        View and manage user information
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => navigate(`/users/${id}/edit`)}>
                                    <IconEdit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button variant="destructive" onClick={handleDelete}>
                                    <IconTrash className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>

                        {/* User Profile Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-6">
                                    {user.profile_picture ? (
                                        <img
                                            src={user.profile_picture}
                                            alt={user.full_name}
                                            className="h-24 w-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                                            <IconUser className="h-12 w-12 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h2 className="text-2xl font-bold">{user.full_name || user.username}</h2>
                                            <p className="text-muted-foreground">@{user.username}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                                {user.role_display}
                                            </Badge>
                                            <Badge variant={getStatusBadgeVariant(user.status)}>
                                                {user.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <IconMail className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Email</p>
                                                <p className="font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <IconPhone className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Phone</p>
                                                <p className="font-medium">{user.phone || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <IconShield className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Role</p>
                                                <p className="font-medium">{user.role_display}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <IconCalendar className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Date Joined</p>
                                                <p className="font-medium">
                                                    {new Date(user.date_joined).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <IconClock className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Last Login</p>
                                                <p className="font-medium">
                                                    {user.last_login
                                                        ? new Date(user.last_login).toLocaleString()
                                                        : "Never"}
                                                </p>
                                            </div>
                                        </div>
                                        {user.last_login_ip && (
                                            <div className="flex items-center gap-3">
                                                <IconUser className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Last Login IP</p>
                                                    <p className="font-medium">{user.last_login_ip}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Login History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Login History</CardTitle>
                                <CardDescription>Recent login activity for this user</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loginHistory.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">
                                        No login history available
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Login Time</TableHead>
                                                <TableHead>Logout Time</TableHead>
                                                <TableHead>IP Address</TableHead>
                                                <TableHead>User Agent</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loginHistory.map((history) => (
                                                <TableRow key={history.id}>
                                                    <TableCell>
                                                        {new Date(history.login_time).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {history.logout_time
                                                            ? new Date(history.logout_time).toLocaleString()
                                                            : "Active"}
                                                    </TableCell>
                                                    <TableCell>{history.ip_address}</TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {history.user_agent}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={history.is_active ? "default" : "secondary"}>
                                                            {history.is_active ? "Active" : "Ended"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
