import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { subscriptionService } from "@/services/api"
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
import { Loader2, Plus, Search, Eye, Pencil, Trash2, PlayCircle, PauseCircle, RefreshCw } from "lucide-react"
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

function SubscriptionsPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [statusFilter] = useState(searchParams.get("status") || "")

    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [editingExpiryDay, setEditingExpiryDay] = useState<number | null>(null)
    const [expiryDayValue, setExpiryDayValue] = useState<string>("")

    useEffect(() => {
        fetchSubscriptions()
    }, [page, searchTerm, statusFilter])

    const fetchSubscriptions = async () => {
        try {
            setLoading(true)
            const params: any = { page }
            if (searchTerm) params.search = searchTerm
            if (statusFilter) params.status = statusFilter

            const response = await subscriptionService.getSubscriptions(params)
            setSubscriptions(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            console.error("Failed to fetch subscriptions", error)
            toast.error("Failed to load subscriptions")
        } finally {
            setLoading(false)
        }
    }




    const handleDelete = async (id: number, customerName: string) => {
        if (!confirm(`Delete subscription for "${customerName}"?`)) return

        try {
            await subscriptionService.deleteSubscription(id)
            toast.success("Subscription deleted successfully!")
            fetchSubscriptions()
        } catch (error) {
            toast.error("Failed to delete subscription")
        }
    }

    const handleActivate = async (id: number) => {
        try {
            await subscriptionService.activateSubscription(id)
            toast.success("Subscription activated!")
            fetchSubscriptions()
        } catch (error) {
            toast.error("Failed to activate subscription")
        }
    }

    const handleSuspend = async (id: number) => {
        try {
            await subscriptionService.suspendSubscription(id)
            toast.success("Subscription suspended!")
            fetchSubscriptions()
        } catch (error) {
            toast.error("Failed to suspend subscription")
        }
    }

    const handleSync = async (id: number) => {
        try {
            await subscriptionService.syncSubscription(id)
            toast.success("Synced to MikroTik!")
            fetchSubscriptions()
        } catch (error) {
            toast.error("Failed to sync")
        }
    }

    const handleUpdateExpiryDay = async (id: number, newDay: number) => {
        if (newDay < 1 || newDay > 31) {
            toast.error("Expiry day must be between 1 and 31")
            return
        }

        try {
            await subscriptionService.updateSubscription(id, { billing_day: newDay })
            toast.success("Expiry day updated successfully!")
            setEditingExpiryDay(null)
            fetchSubscriptions()
        } catch (error) {
            toast.error("Failed to update expiry day")
        }
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
                                    <BreadcrumbPage>Subscriptions</BreadcrumbPage>
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
                                    <CardTitle>Customer Subscriptions</CardTitle>
                                    <CardDescription>
                                        Manage customer subscriptions and MikroTik sync
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        className="cursor-pointer"
                                        onClick={() => navigate("/subscriptions/add")}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Subscription
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search subscriptions..."
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
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Package</TableHead>
                                                    <TableHead>Router</TableHead>
                                                    <TableHead>Expiry Day</TableHead>
                                                    <TableHead>Next Billing</TableHead>
                                                    <TableHead>Connection</TableHead>
                                                    <TableHead>MikroTik Sync</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {subscriptions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={9}
                                                            className="text-center py-8 text-muted-foreground"
                                                        >
                                                            No subscriptions found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    subscriptions.map((sub) => {
                                                        const liveStatus = sub.live_status

                                                        return (
                                                            <TableRow key={sub.id}>
                                                                <TableCell className="font-medium">
                                                                    {sub.customer_name}
                                                                </TableCell>
                                                                <TableCell>{sub.package_name}</TableCell>
                                                                <TableCell>{sub.router_name || "-"}</TableCell>
                                                                <TableCell>
                                                                    {editingExpiryDay === sub.id ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Input
                                                                                type="number"
                                                                                min="1"
                                                                                max="31"
                                                                                value={expiryDayValue}
                                                                                onChange={(e) => setExpiryDayValue(e.target.value)}
                                                                                className="w-20"
                                                                                autoFocus
                                                                            />
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleUpdateExpiryDay(sub.id, parseInt(expiryDayValue))}
                                                                            >
                                                                                Save
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => setEditingExpiryDay(null)}
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            className="cursor-pointer hover:bg-accent px-2 py-1 rounded"
                                                                            onClick={() => {
                                                                                setEditingExpiryDay(sub.id)
                                                                                setExpiryDayValue(sub.billing_day.toString())
                                                                            }}
                                                                            title="Click to edit expiry day"
                                                                        >
                                                                            {sub.billing_day}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>{sub.next_billing_date || "-"}</TableCell>
                                                                <TableCell>
                                                                    {liveStatus ? (
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className="flex items-center gap-1 text-green-600">
                                                                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                                                                <span className="font-mono text-xs font-semibold">{liveStatus.ip_address}</span>
                                                                            </div>
                                                                            <span className="text-[10px] text-muted-foreground font-mono">{liveStatus.mac_address}</span>
                                                                            <span className="text-[10px] text-muted-foreground">Up: {liveStatus.uptime}</span>
                                                                        </div>
                                                                    ) : (sub.framed_ip_address ? (
                                                                        <div className="flex flex-col gap-1 opacity-60">
                                                                            <span className="font-mono text-xs font-semibold">{sub.framed_ip_address}</span>
                                                                            {sub.mac_address && (
                                                                                <span className="text-[10px] text-muted-foreground">{sub.mac_address}</span>
                                                                            )}
                                                                            <span className="text-[10px] text-muted-foreground">Offline</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-muted-foreground">Offline</span>
                                                                    ))}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant={sub.is_synced_to_mikrotik ? "secondary" : "destructive"}
                                                                        className={sub.is_synced_to_mikrotik ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" : ""}
                                                                        title={sub.sync_error}
                                                                    >
                                                                        {sub.is_synced_to_mikrotik ? "SYNCED" : "UNSYNCED"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch
                                                                            checked={sub.status === 'active'}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) handleActivate(sub.id)
                                                                                else handleSuspend(sub.id)
                                                                            }}
                                                                            disabled={sub.status === 'cancelled' || sub.status === 'expired'}
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => navigate(`/subscriptions/${sub.id}`)}
                                                                            title="View"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => navigate(`/subscriptions/${sub.id}/edit`)}
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                        {sub.status === "suspended" && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleActivate(sub.id)}
                                                                                title="Activate"
                                                                            >
                                                                                <PlayCircle className="h-4 w-4 text-green-500" />
                                                                            </Button>
                                                                        )}
                                                                        {sub.status === "active" && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleSuspend(sub.id)}
                                                                                title="Suspend"
                                                                            >
                                                                                <PauseCircle className="h-4 w-4 text-orange-500" />
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleSync(sub.id)}
                                                                            title="Sync to MikroTik"
                                                                        >
                                                                            <RefreshCw className="h-4 w-4 text-blue-500" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleDelete(sub.id, sub.customer_name)}
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })
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

export default SubscriptionsPage
