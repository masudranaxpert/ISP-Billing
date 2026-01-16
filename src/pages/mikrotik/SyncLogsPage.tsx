import { useEffect, useState } from "react"
import { mikrotikService } from "@/services/api"
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
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

function SyncLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [statusFilter, setStatusFilter] = useState("all")
    const [actionFilter, setActionFilter] = useState("all")

    useEffect(() => {
        fetchLogs()
    }, [page, statusFilter, actionFilter])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const params: any = { page }
            if (statusFilter && statusFilter !== "all") params.status = statusFilter
            if (actionFilter && actionFilter !== "all") params.action = actionFilter

            const response = await mikrotikService.getSyncLogs(params)
            setLogs(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            console.error("Failed to fetch sync logs", error)
            toast.error("Failed to load sync logs")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: any = {
            success: "default",
            failed: "destructive",
        }
        return (
            <Badge variant={variants[status] || "secondary"}>
                {status?.toUpperCase()}
            </Badge>
        )
    }

    const getActionBadge = (action: string) => {
        const colors: any = {
            create_queue: "bg-blue-500",
            update_queue: "bg-yellow-500",
            delete_queue: "bg-red-500",
            create_user: "bg-green-500",
            update_user: "bg-orange-500",
            delete_user: "bg-red-600",
            enable_user: "bg-emerald-500",
            disable_user: "bg-gray-500",
        }
        return (
            <Badge className={colors[action] || ""}>
                {action?.replace(/_/g, " ").toUpperCase()}
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
                                    <BreadcrumbPage>Sync Logs</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>MikroTik Sync Logs</CardTitle>
                            <CardDescription>
                                View synchronization logs between system and MikroTik routers
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={actionFilter} onValueChange={setActionFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Actions</SelectItem>
                                        <SelectItem value="create_queue">Create Queue</SelectItem>
                                        <SelectItem value="update_queue">Update Queue</SelectItem>
                                        <SelectItem value="delete_queue">Delete Queue</SelectItem>
                                        <SelectItem value="create_user">Create User</SelectItem>
                                        <SelectItem value="update_user">Update User</SelectItem>
                                        <SelectItem value="delete_user">Delete User</SelectItem>
                                        <SelectItem value="enable_user">Enable User</SelectItem>
                                        <SelectItem value="disable_user">Disable User</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                                    <TableHead>Timestamp</TableHead>
                                                    <TableHead>Router</TableHead>
                                                    <TableHead>Action</TableHead>
                                                    <TableHead>Target</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Message</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {logs.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={6}
                                                            className="text-center py-8 text-muted-foreground"
                                                        >
                                                            No sync logs found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    logs.map((log: any) => (
                                                        <TableRow key={log.id}>
                                                            <TableCell className="font-medium">
                                                                {new Date(log.created_at).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell>{log.router_name || "-"}</TableCell>
                                                            <TableCell>
                                                                {getActionBadge(log.action)}
                                                            </TableCell>
                                                            <TableCell>{log.target_name || "-"}</TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(log.status)}
                                                            </TableCell>
                                                            <TableCell className="max-w-xs truncate">
                                                                {log.message || "-"}
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

export default SyncLogsPage
