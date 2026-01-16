import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { packageService, mikrotikService } from "@/services/api"
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
import { Loader2, Plus, Search, Eye, Pencil, Trash2, RefreshCw } from "lucide-react"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

function PackagesPage() {
    const navigate = useNavigate()
    const [packages, setPackages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [syncDialogOpen, setSyncDialogOpen] = useState(false)
    const [selectedPackage, setSelectedPackage] = useState<any>(null)
    const [routers, setRouters] = useState<any[]>([])
    const [selectedRouter, setSelectedRouter] = useState("")
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        fetchPackages()
        fetchRouters()
    }, [page, searchTerm])

    const fetchPackages = async () => {
        try {
            setLoading(true)
            const params: any = { page }
            if (searchTerm) {
                params.search = searchTerm
            }
            const response = await packageService.getPackages(params)
            setPackages(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            console.error("Failed to fetch packages", error)
            toast.error("Failed to load packages")
        } finally {
            setLoading(false)
        }
    }

    const fetchRouters = async () => {
        try {
            const response = await mikrotikService.getRouters()
            setRouters(response.results || [])
        } catch (error) {
            console.error("Failed to fetch routers", error)
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete package "${name}"?`)) return

        try {
            await packageService.deletePackage(id)
            toast.success("Package deleted successfully!")
            fetchPackages()
        } catch (error) {
            toast.error("Failed to delete package")
        }
    }

    const handleSyncClick = (pkg: any) => {
        setSelectedPackage(pkg)
        setSelectedRouter("")
        setSyncDialogOpen(true)
    }

    const handleSync = async () => {
        if (!selectedRouter) {
            toast.error("Please select a router")
            return
        }

        setSyncing(true)
        try {
            await mikrotikService.syncPackageToRouter(selectedPackage.id, parseInt(selectedRouter))
            toast.success(`Package synced to router successfully!`)
            setSyncDialogOpen(false)
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to sync package")
        } finally {
            setSyncing(false)
        }
    }

    const handleToggleStatus = async (pkg: any, checked: boolean) => {
        const newStatus = checked ? 'active' : 'inactive'
        try {
            await packageService.updatePackage(pkg.id, { status: newStatus })
            toast.success(`Package ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
            fetchPackages()
        } catch (error) {
            toast.error("Failed to update status")
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
                                    <BreadcrumbPage>Packages</BreadcrumbPage>
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
                                    <CardTitle>Internet Packages</CardTitle>
                                    <CardDescription>
                                        Manage internet packages and pricing
                                    </CardDescription>
                                </div>
                                <Button
                                    className="cursor-pointer"
                                    onClick={() => navigate("/packages/add")}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Package
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search packages..."
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
                                                    <TableHead>Package Name</TableHead>
                                                    <TableHead>Speed</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Validity</TableHead>
                                                    <TableHead>Synced Routers</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {packages.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={7}
                                                            className="text-center py-8 text-muted-foreground"
                                                        >
                                                            No packages found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    packages.map((pkg) => (
                                                        <TableRow key={pkg.id}>
                                                            <TableCell className="font-medium">
                                                                {pkg.name}
                                                            </TableCell>
                                                            <TableCell>{pkg.speed_display}</TableCell>
                                                            <TableCell>৳{pkg.price}</TableCell>
                                                            <TableCell>{pkg.validity_days} days</TableCell>
                                                            <TableCell>
                                                                {pkg.synced_routers && pkg.synced_routers.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {pkg.synced_routers.map((router: any) => (
                                                                            <Badge
                                                                                key={router.router_id}
                                                                                variant={router.is_synced ? "outline" : "destructive"}
                                                                                className={`text-xs ${router.is_synced ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20" : ""}`}
                                                                                title={router.is_synced ? "Synced" : `Error: ${router.sync_error}`}
                                                                            >
                                                                                {router.router_name}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">Not synced</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Switch
                                                                        checked={pkg.status === 'active'}
                                                                        onCheckedChange={(checked) => handleToggleStatus(pkg, checked)}
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => navigate(`/packages/${pkg.id}`)}
                                                                        title="View"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => navigate(`/packages/${pkg.id}`)}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleSyncClick(pkg)}
                                                                        title="Sync to Router"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4 text-blue-500" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDelete(pkg.id, pkg.name)}
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

                {/* Sync to Router Dialog */}
                <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Sync Package to Router</DialogTitle>
                            <DialogDescription>
                                Select a MikroTik router to sync "{selectedPackage?.name}" package
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Router</label>
                                <Select value={selectedRouter} onValueChange={setSelectedRouter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a router" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {routers.map((router) => (
                                            <SelectItem key={router.id} value={router.id.toString()}>
                                                {router.name} - {router.ip_address} {router.is_online ? "🟢" : "🔴"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSync} disabled={syncing} className="flex-1">
                                    {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sync Package
                                </Button>
                                <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default PackagesPage
