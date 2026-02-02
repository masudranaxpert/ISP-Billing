import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { customerService, zoneService } from "@/services/api"
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
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

function AddCustomerPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = !!id

    const [loading, setLoading] = useState(false)
    const [zones, setZones] = useState<any[]>([])
    const [connectionTypes, setConnectionTypes] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        alternative_phone: "",
        nid: "",
        address: "",
        zone: "",
        billing_type: "personal",
        connection_type: "",
        mac_address: "",
        static_ip: "",
        status: "active",
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (isEditMode) {
            fetchCustomer()
        }
    }, [id])

    const fetchInitialData = async () => {
        try {
            const [zonesRes, connTypesRes] = await Promise.all([
                zoneService.getZones(),
                customerService.getConnectionTypes()
            ])
            setZones(zonesRes.results || [])
            setConnectionTypes(connTypesRes.results || [])
        } catch (error) {
            console.error("Failed to fetch initial data", error)
            toast.error("Failed to load form data")
        }
    }

    const fetchCustomer = async () => {
        try {
            const customer = await customerService.getCustomer(parseInt(id!))
            setFormData({
                name: customer.name,
                email: customer.email || "",
                phone: customer.phone,
                alternative_phone: customer.alternative_phone || "",
                nid: customer.nid || "",
                address: customer.address || "",
                zone: customer.zone ? customer.zone.toString() : "",
                billing_type: customer.billing_type || "personal",
                connection_type: customer.connection_type ? customer.connection_type.toString() : "",
                mac_address: customer.mac_address || "",
                static_ip: customer.static_ip || "",
                status: customer.status || "active",
            })
        } catch (error) {
            console.error("Failed to fetch customer", error)
            toast.error("Failed to load customer details")
            navigate("/customers")
        }
    }

    const formatPhoneNumber = (phone: string) => {
        if (!phone) return phone
        const cleaned = phone.replace(/\D/g, '')
        if (cleaned.startsWith('880')) return '+' + cleaned
        if (cleaned.startsWith('0')) return '+880' + cleaned.substring(1)
        if (cleaned.startsWith('1') && cleaned.length === 10) return '+880' + cleaned
        if (phone.startsWith('+')) return phone
        return '+880' + cleaned
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
                phone: formatPhoneNumber(formData.phone),
                alternative_phone: formData.alternative_phone
                    ? formatPhoneNumber(formData.alternative_phone)
                    : null,
                zone: formData.zone ? parseInt(formData.zone) : null,
                connection_type: formData.connection_type ? parseInt(formData.connection_type) : null,
                email: formData.email || null,
                nid: formData.nid || null,
                mac_address: formData.mac_address || null,
                static_ip: formData.static_ip || null,
            }

            if (isEditMode) {
                await customerService.updateCustomer(parseInt(id!), payload)
                toast.success("Customer updated successfully!")
            } else {
                await customerService.createCustomer(payload)
                toast.success("Customer created successfully!")
            }
            navigate("/customers")
        } catch (error: any) {
            console.error("Failed to save customer", error)
            if (error.response?.data) {
                const errors = error.response.data
                Object.keys(errors).forEach(key => {
                    const errorMsg = Array.isArray(errors[key])
                        ? errors[key].join(", ")
                        : errors[key]
                    // Capitalize key
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    toast.error(`${displayKey}: ${errorMsg}`)
                })
            } else {
                toast.error(`Failed to ${isEditMode ? 'update' : 'create'} customer`)
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
                                    <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{isEditMode ? 'Edit Customer' : 'Add Customer'}</BreadcrumbPage>
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
                                <CardTitle>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
                                <CardDescription>
                                    {isEditMode ? 'Update customer details below' : 'Fill in the customer details below'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
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
                                                <PhoneInput
                                                    international
                                                    defaultCountry="BD"
                                                    value={formData.phone}
                                                    onChange={(value) => handleChange("phone", value || "")}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="alternative_phone">Alternative Phone</Label>
                                                <PhoneInput
                                                    international
                                                    defaultCountry="BD"
                                                    value={formData.alternative_phone}
                                                    onChange={(value) => handleChange("alternative_phone", value || "")}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {connectionTypes.map((type) => (
                                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                                {type.name}
                                                            </SelectItem>
                                                        ))}
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
                                                    placeholder="XX:XX:XX:XX:XX:XX"
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
                                                    placeholder="192.168.1.100"
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

                                    <div className="flex gap-4">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="cursor-pointer"
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isEditMode ? 'Update Customer' : 'Create Customer'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate("/customers")}
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

export default AddCustomerPage
