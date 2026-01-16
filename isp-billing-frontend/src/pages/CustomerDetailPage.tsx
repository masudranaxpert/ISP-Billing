import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { customerService } from "@/services/api"
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

function CustomerDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [customer, setCustomer] = useState<any>(null)
    const [formData, setFormData] = useState<any>({})

    useEffect(() => {
        if (id) {
            fetchCustomer()
        }
    }, [id])

    const fetchCustomer = async () => {
        try {
            setLoading(true)
            const data = await customerService.getCustomer(parseInt(id!))
            setCustomer(data)
            setFormData({
                name: data.name || "",
                email: data.email || "",
                phone: data.phone || "",
                alternative_phone: data.alternative_phone || "",
                nid: data.nid || "",
                address: data.address || "",
                zone: data.zone?.toString() || "",
                billing_type: data.billing_type || "personal",
                connection_type: data.connection_type || "pppoe",
                mac_address: data.mac_address || "",
                static_ip: data.static_ip || "",
                status: data.status || "active",
            })
        } catch (error) {
            console.error("Failed to fetch customer", error)
            alert("Failed to load customer details")
            navigate("/customers")
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
            const payload = {
                ...formData,
                zone: formData.zone ? parseInt(formData.zone) : null,
            }
            await customerService.updateCustomer(parseInt(id!), payload)
            alert("Customer updated successfully!")
            setIsEditing(false)
            fetchCustomer()
        } catch (error: any) {
            console.error("Failed to update customer", error)
            alert("Failed to update customer: " + (error.response?.data?.message || error.message))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this customer?")) return

        try {
            await customerService.deleteCustomer(parseInt(id!))
            alert("Customer deleted successfully!")
            navigate("/customers")
        } catch (error: any) {
            console.error("Failed to delete customer", error)
            alert("Failed to delete customer: " + (error.response?.data?.message || error.message))
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: any = {
            active: "default",
            suspended: "destructive",
            inactive: "secondary",
            closed: "outline",
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
                                    <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{customer?.customer_id}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/customers")}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Customers
                        </Button>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {customer?.name}
                                            {getStatusBadge(customer?.status)}
                                        </CardTitle>
                                        <CardDescription>
                                            Customer ID: {customer?.customer_id}
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
                                                    fetchCustomer()
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
                                    <form onSubmit={handleUpdate} className="space-y-6">
                                        {/* Personal Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Personal Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Name *</Label>
                                                    <Input
                                                        id="name"
                                                        value={formData.name}
                                                        onChange={(e) => handleChange("name", e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => handleChange("email", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">Phone *</Label>
                                                    <Input
                                                        id="phone"
                                                        value={formData.phone}
                                                        onChange={(e) => handleChange("phone", e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="alternative_phone">Alternative Phone</Label>
                                                    <Input
                                                        id="alternative_phone"
                                                        value={formData.alternative_phone}
                                                        onChange={(e) =>
                                                            handleChange("alternative_phone", e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="nid">NID</Label>
                                                    <Input
                                                        id="nid"
                                                        value={formData.nid}
                                                        onChange={(e) => handleChange("nid", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="zone">Zone ID</Label>
                                                    <Input
                                                        id="zone"
                                                        type="number"
                                                        value={formData.zone}
                                                        onChange={(e) => handleChange("zone", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address">Address *</Label>
                                                <Input
                                                    id="address"
                                                    value={formData.address}
                                                    onChange={(e) => handleChange("address", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Connection Details */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Connection Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="billing_type">Billing Type</Label>
                                                    <Select
                                                        value={formData.billing_type}
                                                        onValueChange={(value) =>
                                                            handleChange("billing_type", value)
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="personal">Personal</SelectItem>
                                                            <SelectItem value="business">Business</SelectItem>
                                                            <SelectItem value="free">Free</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="connection_type">Connection Type</Label>
                                                    <Select
                                                        value={formData.connection_type}
                                                        onValueChange={(value) =>
                                                            handleChange("connection_type", value)
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pppoe">PPPoE</SelectItem>
                                                            <SelectItem value="static_ip">Static IP</SelectItem>
                                                            <SelectItem value="hotspot">Hotspot</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="mac_address">MAC Address</Label>
                                                    <Input
                                                        id="mac_address"
                                                        value={formData.mac_address}
                                                        onChange={(e) =>
                                                            handleChange("mac_address", e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="static_ip">Static IP</Label>
                                                    <Input
                                                        id="static_ip"
                                                        value={formData.static_ip}
                                                        onChange={(e) =>
                                                            handleChange("static_ip", e.target.value)
                                                        }
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
                                                            <SelectItem value="suspended">Suspended</SelectItem>
                                                            <SelectItem value="inactive">Inactive</SelectItem>
                                                            <SelectItem value="closed">Closed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
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
                                    <div className="space-y-6">
                                        {/* View Mode */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Personal Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-muted-foreground">Name</Label>
                                                    <p className="font-medium">{customer?.name}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">Email</Label>
                                                    <p className="font-medium">{customer?.email || "-"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">Phone</Label>
                                                    <p className="font-medium">{customer?.phone}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">Alternative Phone</Label>
                                                    <p className="font-medium">{customer?.alternative_phone || "-"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">NID</Label>
                                                    <p className="font-medium">{customer?.nid || "-"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">Zone</Label>
                                                    <p className="font-medium">{customer?.zone_name || "-"}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="text-muted-foreground">Address</Label>
                                                    <p className="font-medium">{customer?.address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Connection Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-muted-foreground">Billing Type</Label>
                                                    <p className="font-medium">{customer?.billing_type_display}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">Connection Type</Label>
                                                    <p className="font-medium">{customer?.connection_type_display}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">MAC Address</Label>
                                                    <p className="font-medium">{customer?.mac_address || "-"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">Static IP</Label>
                                                    <p className="font-medium">{customer?.static_ip || "-"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">Created At</Label>
                                                    <p className="font-medium">
                                                        {new Date(customer?.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="text-muted-foreground">Updated At</Label>
                                                    <p className="font-medium">
                                                        {new Date(customer?.updated_at).toLocaleString()}
                                                    </p>
                                                </div>
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

export default CustomerDetailPage
