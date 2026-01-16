import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { zoneService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Loader2, ArrowLeft, Trash2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"

function ZoneDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [zone, setZone] = useState<any>(null)
    const [formData, setFormData] = useState<any>({})

    useEffect(() => {
        if (id) {
            fetchZone()
        }
    }, [id])

    const fetchZone = async () => {
        try {
            setLoading(true)
            const data = await zoneService.getZone(parseInt(id!))
            setZone(data)
            setFormData({
                name: data.name || "",
                code: data.code || "",
                description: data.description || "",
                status: data.status || "active",
            })
        } catch (error) {
            console.error("Failed to fetch zone", error)
            alert("Failed to load zone details")
            navigate("/zones")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            await zoneService.updateZone(parseInt(id!), formData)
            alert("Zone updated successfully!")
            setIsEditing(false)
            fetchZone()
        } catch (error: any) {
            console.error("Failed to update zone", error)
            alert("Failed to update zone: " + (error.response?.data?.message || error.message))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this zone? This will affect all customers in this zone.")) return

        try {
            await zoneService.deleteZone(parseInt(id!))
            alert("Zone deleted successfully!")
            navigate("/zones")
        } catch (error: any) {
            console.error("Failed to delete zone", error)
            alert("Failed to delete zone: " + (error.response?.data?.message || error.message))
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: any = {
            active: "default",
            inactive: "secondary",
        }
        return (
            <Badge variant={variants[status] || "secondary"}>
                {status?.toUpperCase()}
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
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
                                    <BreadcrumbLink href="/zones">Zones</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{zone?.code}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/zones")}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Zones
                        </Button>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {zone?.name}
                                            {getStatusBadge(zone?.status)}
                                        </CardTitle>
                                        <CardDescription>
                                            Zone Code: {zone?.code} | {zone?.customer_count || 0} Total Customers ({zone?.active_customer_count || 0} Active)
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {!isEditing ? (
                                            <>
                                                <Button onClick={() => setIsEditing(true)}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDelete}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsEditing(false)
                                                    fetchZone()
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <form onSubmit={handleUpdate} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Zone Name *</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => handleChange("name", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="code">Zone Code *</Label>
                                                <Input
                                                    id="code"
                                                    value={formData.code}
                                                    onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                                                    required
                                                    maxLength={20}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => handleChange("description", e.target.value)}
                                                rows={3}
                                            />
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

                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            className="cursor-pointer"
                                        >
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-muted-foreground">Zone Name</Label>
                                                <p className="font-medium">{zone?.name}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Zone Code</Label>
                                                <p className="font-medium">{zone?.code}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label className="text-muted-foreground">Description</Label>
                                                <p className="font-medium">{zone?.description || "-"}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Total Customers</Label>
                                                <p className="font-medium">{zone?.customer_count || 0}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Active Customers</Label>
                                                <p className="font-medium">{zone?.active_customer_count || 0}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Created At</Label>
                                                <p className="font-medium">
                                                    {new Date(zone?.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Updated At</Label>
                                                <p className="font-medium">
                                                    {new Date(zone?.updated_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default ZoneDetailPage
