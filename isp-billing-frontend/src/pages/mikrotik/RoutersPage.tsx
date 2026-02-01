import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { mikrotikService } from "@/services/api"
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
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, Eye, Pencil, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { toast } from "sonner"

function RoutersPage() {
    const navigate = useNavigate()
    const [routers, setRouters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [checkingStatus, setCheckingStatus] = useState<Record<number, boolean>>({})

    useEffect(() => {
        fetchRouters()
    }, [page, searchTerm])

    // Check router status when page loads
    useEffect(() => {
        if (routers.length > 0) {
            checkAllRoutersStatus()
        }
    }, [routers.length]) // Only when routers are first loaded

    const fetchRouters = async () => {
        try {
            setLoading(true)
            const params: any = { page }
            if (searchTerm) {
                params.search = searchTerm
            }
            const response = await mikrotikService.getRouters(params)
            setRouters(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            console.error("Failed to fetch routers", error)
            toast.error("Failed to load routers")
        } finally {
            setLoading(false)
        }
    }

    const checkAllRoutersStatus = async () => {
        // Silently check all routers without showing toast
        for (const router of routers) {
            if (router.status === 'active') {
                await checkRouterStatus(router.id)
            }
        }
    }

    const checkRouterStatus = async (routerId: number) => {
        try {
            setCheckingStatus(prev => ({ ...prev, [routerId]: true }))
            await mikrotikService.testRouter(routerId)
            // Refresh routers to get updated status
            const params: any = { page }
            if (searchTerm) {
                params.search = searchTerm
            }
            const response = await mikrotikService.getRouters(params)
            setRouters(response.results || [])
        } catch (error) {
            // Silently fail - don't show error toast for background checks
            console.log(`Router ${routerId} connection check failed`)
        } finally {
            setCheckingStatus(prev => ({ ...prev, [routerId]: false }))
        }
    }

    const handleToggleStatus = async (router: any, checked: boolean) => {
        const newStatus = checked ? 'active' : 'inactive'
        try {
            await mikrotikService.updateRouter(router.id, { status: newStatus })
            toast.success(`Router ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
            fetchRouters()
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete router "${name}"?`)) return

        try {
            await mikrotikService.deleteRouter(id)
            toast.success("Router deleted successfully!")
            fetchRouters()
        } catch (error) {
            toast.error("Failed to delete router")
        }
    }

    const getOnlineBadge = (isOnline: boolean, routerId: number) => {
        const isChecking = checkingStatus[routerId]

        if (isChecking) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking...
                </Badge>
            )
        }

        return (
            <Badge
                variant={isOnline ? "default" : "destructive"}
                className={isOnline ? "bg-green-500 hover:bg-green-600" : ""}
            >
                {isOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
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
                                    <BreadcrumbPage>MikroTik Routers</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Card className="mt-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>MikroTik Routers</CardTitle>
                                    <CardDescription>
                                        Manage your MikroTik routers and connections
                                    </CardDescription>
                                </div>
                                <Button
                                    className="cursor-pointer"
                                    onClick={() => navigate("/mikrotik/routers/add")}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Router
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search routers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>IP Address</TableHead>
                                                    <TableHead>Zone</TableHead>
                                                    <TableHead>Connection</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Last Connected</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {routers.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={7}
                                                            className="text-center py-8 text-muted-foreground"
                                                        >
                                                            No routers found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    routers.map((router) => (
                                                        <TableRow key={router.id}>
                                                            <TableCell className="font-medium">
                                                                {router.name}
                                                            </TableCell>
                                                            <TableCell>{router.ip_address}:{router.api_port || 8728}</TableCell>
                                                            <TableCell>{router.zone_name || "-"}</TableCell>
                                                            <TableCell>
                                                                {getOnlineBadge(router.is_online, router.id)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Switch
                                                                        checked={router.status === 'active'}
                                                                        onCheckedChange={(checked) => handleToggleStatus(router, checked)}
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {router.last_connected_at
                                                                    ? new Date(router.last_connected_at).toLocaleString()
                                                                    : "Never"}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => navigate(`/mikrotik/routers/${router.id}`)}
                                                                        title="View"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => navigate(`/mikrotik/routers/${router.id}`)}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDelete(router.id, router.name)}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page - 1)}
                                                disabled={page === 1}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                Page {page} of {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page + 1)}
                                                disabled={page === totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default RoutersPage
