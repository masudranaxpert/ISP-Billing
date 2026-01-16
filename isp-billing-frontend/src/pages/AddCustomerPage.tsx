import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
    const [loading, setLoading] = useState(false)
    const [zones, setZones] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        alternative_phone: "",
        nid: "",
        address: "",
        zone: "",
        billing_type: "personal",
        connection_type: "pppoe",
        mac_address: "",
        static_ip: "",
        status: "active",
    })

    useEffect(() => {
        fetchZones()
    }, [])

    const fetchZones = async () => {
        try {
            const response = await zoneService.getZones()
            setZones(response.results || [])
        } catch (error) {
            console.error("Failed to fetch zones", error)
            toast.error("Failed to load zones")
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
                email: formData.email || null,
                nid: formData.nid || null,
                mac_address: formData.mac_address || null,
                static_ip: formData.static_ip || null,
            }
            await customerService.createCustomer(payload)
            toast.success("Customer created successfully!")
            navigate("/customers")
        } catch (error: any) {
            console.error("Failed to create customer", error)
            if (error.response?.data) {
                const errors = error.response.data
                Object.keys(errors).forEach(key => {
                    const errorMsg = Array.isArray(errors[key])
                        ? errors[key].join(", ")
                        : errors[key]
                    toast.error(`${key}: ${errorMsg}`)
                })
            } else {
                toast.error("Failed to create customer")
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
                                    <BreadcrumbPage>Add Customer</BreadcrumbPage>
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
                                <CardTitle>Add New Customer</CardTitle>
                                <CardDescription>
                                    Fill in the customer details below
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
                                            Create Customer
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
