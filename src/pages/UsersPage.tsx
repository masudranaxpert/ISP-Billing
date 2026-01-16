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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPlus, IconSearch, IconDots, IconEye, IconEdit, IconTrash, IconUsers } from "@tabler/icons-react"
import { userService } from "@/services/api"
import { useNavigate } from "react-router-dom"
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
    date_joined: string
}

export default function UsersPage() {
    const navigate = useNavigate()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        fetchUsers()
    }, [currentPage, roleFilter, statusFilter, searchQuery])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const params: any = { page: currentPage }

            if (roleFilter !== "all") {
                params.role = roleFilter
            }

            if (statusFilter !== "all") {
                params.status = statusFilter
            }

            if (searchQuery) {
                params.search = searchQuery
            }

            const response = await userService.getUsers(params)
            setUsers(response.results || [])
            setTotalCount(response.count || 0)
            setTotalPages(Math.ceil((response.count || 0) / 10))
        } catch (error: any) {
            console.error("Failed to fetch users:", error)
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return

        try {
            await userService.deleteUser(id)
            toast.success("User deleted successfully")
            fetchUsers()
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
                                    <BreadcrumbPage>Users Management</BreadcrumbPage>
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
                                    <IconUsers className="h-8 w-8" />
                                    Users Management
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage system users and their permissions
                                </p>
                            </div>
                            <Button onClick={() => navigate("/users/create")}>
                                <IconPlus className="h-4 w-4 mr-2" />
                                Add User
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Users</CardDescription>
                                    <CardTitle className="text-3xl">{totalCount}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Active Users</CardDescription>
                                    <CardTitle className="text-3xl">
                                        {users.filter((u) => u.status === "active").length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Admins</CardDescription>
                                    <CardTitle className="text-3xl">
                                        {users.filter((u) => u.role === "admin").length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardDescription>Managers</CardDescription>
                                    <CardTitle className="text-3xl">
                                        {users.filter((u) => u.role === "manager").length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Filters */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Filters</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by username, email, or name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Filter by role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                            <SelectItem value="accountant">Accountant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Users Table */}
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Login</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">
                                                    Loading...
                                                </TableCell>
                                            </TableRow>
                                        ) : users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">
                                                    No users found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {user.profile_picture ? (
                                                                <img
                                                                    src={user.profile_picture}
                                                                    alt={user.full_name}
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                    <span className="text-sm font-medium">
                                                                        {user.full_name?.charAt(0) || user.username?.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-medium">{user.full_name || user.username}</div>
                                                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.phone || "N/A"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                                            {user.role_display}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusBadgeVariant(user.status)}>
                                                            {user.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.last_login
                                                            ? new Date(user.last_login).toLocaleDateString()
                                                            : "Never"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <IconDots className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                                                                    <IconEye className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => navigate(`/users/${user.id}/edit`)}>
                                                                    <IconEdit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(user.id)}
                                                                    className="text-destructive"
                                                                >
                                                                    <IconTrash className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
                                    Showing {users.length} of {totalCount} users
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
