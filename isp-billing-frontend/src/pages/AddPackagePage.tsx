import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { packageService } from "@/services/api"
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

function AddPackagePage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        bandwidth_download: "",
        bandwidth_upload: "",
        price: "",
        validity_days: "30",
        description: "",
        mikrotik_queue_name: "",
        burst_limit_download: "",
        burst_limit_upload: "",
        burst_threshold_download: "",
        burst_threshold_upload: "",
        burst_time: "",
        priority: "8",
        status: "active",
    })

    const { id } = useParams()
    const isEditMode = !!id

    useEffect(() => {
        if (isEditMode) {
            fetchPackage()
        }
    }, [id])

    const fetchPackage = async () => {
        try {
            setLoading(true)
            const data = await packageService.getPackage(parseInt(id!))
            setFormData({
                name: data.name,
                bandwidth_download: data.bandwidth_download.toString(),
                bandwidth_upload: data.bandwidth_upload.toString(),
                price: data.price.toString(),
                validity_days: data.validity_days?.toString() || "",
                description: data.description || "",
                mikrotik_queue_name: data.mikrotik_queue_name,
                burst_limit_download: data.burst_limit_download?.toString() || "",
                burst_limit_upload: data.burst_limit_upload?.toString() || "",
                burst_threshold_download: data.burst_threshold_download?.toString() || "",
                burst_threshold_upload: data.burst_threshold_upload?.toString() || "",
                burst_time: data.burst_time?.toString() || "",
                priority: data.priority.toString(),
                status: data.status,
            })
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch package details")
            navigate("/packages")
        } finally {
            setLoading(false)
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
                name: formData.name,
                bandwidth_download: parseInt(formData.bandwidth_download),
                bandwidth_upload: parseInt(formData.bandwidth_upload),
                price: formData.price,
                validity_days: formData.validity_days ? parseInt(formData.validity_days) : null,
                description: formData.description || null,
                mikrotik_queue_name: formData.mikrotik_queue_name,
                burst_limit_download: formData.burst_limit_download ? parseInt(formData.burst_limit_download) : null,
                burst_limit_upload: formData.burst_limit_upload ? parseInt(formData.burst_limit_upload) : null,
                burst_threshold_download: formData.burst_threshold_download ? parseInt(formData.burst_threshold_download) : null,
                burst_threshold_upload: formData.burst_threshold_upload ? parseInt(formData.burst_threshold_upload) : null,
                burst_time: formData.burst_time ? parseInt(formData.burst_time) : null,
                priority: parseInt(formData.priority),
                status: formData.status,
            }

            if (isEditMode) {
                await packageService.updatePackage(parseInt(id!), payload)
                toast.success("Package updated successfully!")
            } else {
                await packageService.createPackage(payload)
                toast.success("Package created successfully!")
            }
            navigate("/packages")
        } catch (error: any) {
            console.error("Failed to create package", error)
            if (error.response?.data) {
                const errors = error.response.data
                Object.keys(errors).forEach(key => {
                    const errorMsg = Array.isArray(errors[key])
                        ? errors[key].join(", ")
                        : errors[key]
                    toast.error(`${key}: ${errorMsg}`)
                })
            } else {
                toast.error(`Failed to ${isEditMode ? 'update' : 'create'} package`)
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
                                    <BreadcrumbLink href="/packages">Packages</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{isEditMode ? 'Edit Package' : 'Add Package'}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/packages")}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Packages
                        </Button>

                        <Card>
                            <CardHeader>
                                <CardTitle>{isEditMode ? 'Edit Package' : 'Add New Package'}</CardTitle>
                                <CardDescription>
                                    {isEditMode ? 'Update package details' : 'Create a new internet package with bandwidth and pricing'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Basic Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Basic Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Package Name *</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => handleChange("name", e.target.value)}
                                                    required
                                                    placeholder="e.g., Home 10 Mbps"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mikrotik_queue_name">MikroTik Queue Name *</Label>
                                                <Input
                                                    id="mikrotik_queue_name"
                                                    value={formData.mikrotik_queue_name}
                                                    onChange={(e) => handleChange("mikrotik_queue_name", e.target.value)}
                                                    required
                                                    placeholder="e.g., home-10mbps"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="price">Price (৳) *</Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.price}
                                                    onChange={(e) => handleChange("price", e.target.value)}
                                                    required
                                                    placeholder="500.00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="validity_days">Validity (Days)</Label>
                                                <Input
                                                    id="validity_days"
                                                    type="number"
                                                    value={formData.validity_days}
                                                    onChange={(e) => handleChange("validity_days", e.target.value)}
                                                    placeholder="30"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => handleChange("description", e.target.value)}
                                                placeholder="Package description"
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    {/* Bandwidth Settings */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Bandwidth Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bandwidth_download">Download Speed (Mbps) *</Label>
                                                <Input
                                                    id="bandwidth_download"
                                                    type="number"
                                                    value={formData.bandwidth_download}
                                                    onChange={(e) => handleChange("bandwidth_download", e.target.value)}
                                                    required
                                                    placeholder="10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bandwidth_upload">Upload Speed (Mbps) *</Label>
                                                <Input
                                                    id="bandwidth_upload"
                                                    type="number"
                                                    value={formData.bandwidth_upload}
                                                    onChange={(e) => handleChange("bandwidth_upload", e.target.value)}
                                                    required
                                                    placeholder="5"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Burst Settings (Optional) */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Burst Settings (Optional)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="burst_limit_download">Burst Download Limit (Mbps)</Label>
                                                <Input
                                                    id="burst_limit_download"
                                                    type="number"
                                                    value={formData.burst_limit_download}
                                                    onChange={(e) => handleChange("burst_limit_download", e.target.value)}
                                                    placeholder="20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="burst_limit_upload">Burst Upload Limit (Mbps)</Label>
                                                <Input
                                                    id="burst_limit_upload"
                                                    type="number"
                                                    value={formData.burst_limit_upload}
                                                    onChange={(e) => handleChange("burst_limit_upload", e.target.value)}
                                                    placeholder="10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="burst_threshold_download">Burst Threshold Download (Mbps)</Label>
                                                <Input
                                                    id="burst_threshold_download"
                                                    type="number"
                                                    value={formData.burst_threshold_download}
                                                    onChange={(e) => handleChange("burst_threshold_download", e.target.value)}
                                                    placeholder="8"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="burst_threshold_upload">Burst Threshold Upload (Mbps)</Label>
                                                <Input
                                                    id="burst_threshold_upload"
                                                    type="number"
                                                    value={formData.burst_threshold_upload}
                                                    onChange={(e) => handleChange("burst_threshold_upload", e.target.value)}
                                                    placeholder="4"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="burst_time">Burst Time (Seconds)</Label>
                                                <Input
                                                    id="burst_time"
                                                    type="number"
                                                    value={formData.burst_time}
                                                    onChange={(e) => handleChange("burst_time", e.target.value)}
                                                    placeholder="10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="priority">Priority (1-8, lower = higher priority) *</Label>
                                                <Select
                                                    value={formData.priority}
                                                    onValueChange={(value) => handleChange("priority", value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                                            <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => handleChange("status", value)}
                                        >
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="cursor-pointer"
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isEditMode ? 'Update Package' : 'Create Package'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate("/packages")}
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

export default AddPackagePage
