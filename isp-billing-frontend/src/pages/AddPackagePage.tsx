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
        price: "",
        description: "",
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
                price: data.price.toString(),
                description: data.description || "",
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
                price: formData.price,
                description: formData.description || null,
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
                                    {isEditMode ? 'Update package details' : 'Create a new internet package with pricing'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Basic Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Package Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Package Name *</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => handleChange("name", e.target.value)}
                                                    required
                                                    placeholder="e.g., Basic Package"
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
