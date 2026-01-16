import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { mikrotikService, zoneService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, ArrowLeft } from "lucide-react"
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

function AddRouterPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = !!id
    const [loading, setLoading] = useState(false)
    const [zones, setZones] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: "",
        ip_address: "",
        api_port: "8728",
        username: "admin",
        password: "",
        zone: "",
        status: "active",
    })

    useEffect(() => {
        fetchZones()
        if (isEditMode) {
            fetchRouter()
        }
    }, [id])

    const fetchRouter = async () => {
        try {
            const router = await mikrotikService.getRouter(parseInt(id!))
            setFormData({
                name: router.name,
                ip_address: router.ip_address,
                api_port: router.api_port?.toString() || "8728",
                username: router.username,
                password: "", // Don't populate password for security
                zone: router.zone?.toString() || "",
                status: router.status,
            })
        } catch (error) {
            toast.error("Failed to load router")
        }
    }

    const fetchZones = async () => {
        try {
            const response = await zoneService.getZones()
            setZones(response.results || [])
        } catch (error) {
            console.error("Failed to fetch zones", error)
            toast.error("Failed to load zones")
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                ...formData,
                api_port: parseInt(formData.api_port),
                zone: formData.zone ? parseInt(formData.zone) : null,
            }

            if (isEditMode) {
                await mikrotikService.updateRouter(parseInt(id!), payload)
                toast.success("Router updated successfully!")
            } else {
                await mikrotikService.createRouter(payload)
                toast.success("Router created successfully!")
            }
            navigate("/mikrotik/routers")
        } catch (error: any) {
            console.error("Failed to save router", error)
            if (error.response?.data) {
                const errors = error.response.data
                Object.keys(errors).forEach(key => {
                    const errorMsg = Array.isArray(errors[key])
                        ? errors[key].join(", ")
                        : errors[key]
                    toast.error(`${key}: ${errorMsg}`)
                })
            } else {
                toast.error(`Failed to ${isEditMode ? 'update' : 'create'} router`)
            }
        } finally {
            setLoading(false)
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
                                    <BreadcrumbLink href="/mikrotik/routers">Routers</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{isEditMode ? "Edit Router" : "Add Router"}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/mikrotik/routers")}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Routers
                        </Button>

                        <Card>
                            <CardHeader>
                                <CardTitle>{isEditMode ? "Edit MikroTik Router" : "Add New MikroTik Router"}</CardTitle>
                                <CardDescription>
                                    {isEditMode ? "Update router configuration" : "Configure a new MikroTik router connection"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Router Name *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleChange("name", e.target.value)}
                                                required
                                                placeholder="e.g., Main Router"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ip_address">IP Address *</Label>
                                            <Input
                                                id="ip_address"
                                                value={formData.ip_address}
                                                onChange={(e) => handleChange("ip_address", e.target.value)}
                                                required
                                                placeholder="192.168.1.1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="api_port">API Port</Label>
                                            <Input
                                                id="api_port"
                                                type="number"
                                                value={formData.api_port}
                                                onChange={(e) => handleChange("api_port", e.target.value)}
                                                placeholder="8728"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username *</Label>
                                            <Input
                                                id="username"
                                                value={formData.username}
                                                onChange={(e) => handleChange("username", e.target.value)}
                                                required
                                                placeholder="admin"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password *</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => handleChange("password", e.target.value)}
                                                required
                                                placeholder="Router API password"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zone">Zone</Label>
                                            <Select
                                                value={formData.zone}
                                                onValueChange={(value) => handleChange("zone", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a zone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {zones.map((zone) => (
                                                        <SelectItem key={zone.id} value={zone.id.toString()}>
                                                            {zone.name} ({zone.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value) => handleChange("status", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="cursor-pointer"
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isEditMode ? "Update Router" : "Create Router"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate("/mikrotik/routers")}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AddRouterPage
