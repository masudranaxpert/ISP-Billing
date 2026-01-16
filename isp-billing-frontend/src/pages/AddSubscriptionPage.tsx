import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { subscriptionService, customerService, packageService, mikrotikService } from "@/services/api"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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

function AddSubscriptionPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [packages, setPackages] = useState<any[]>([])
    const [routers, setRouters] = useState<any[]>([])
    const [showForceLinkDialog, setShowForceLinkDialog] = useState(false)
    const [selectedPackagePrice, setSelectedPackagePrice] = useState<string>("")
    const [formData, setFormData] = useState({
        customer: "",
        package: "",
        start_date: new Date().toISOString().split('T')[0],
        billing_day: "1",
        billing_start_month: new Date().toISOString().slice(0, 7) + '-01', // YYYY-MM-01 format
        router: "",
        mikrotik_username: "",
        mikrotik_password: "",
        connection_fee: "",
        reconnection_fee: "",
        status: "active",
    })

    const { id } = useParams()
    const isEditMode = !!id

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (isEditMode) {
            fetchSubscription()
        }
    }, [id])

    const fetchData = async () => {
        try {
            const [customersRes, packagesRes, routersRes] = await Promise.all([
                customerService.getCustomers(),
                packageService.getPackages(),
                mikrotikService.getRouters(),
            ])
            setCustomers(customersRes.results || [])
            setPackages(packagesRes.results || [])
            setRouters(routersRes.results || [])
        } catch (error) {
            toast.error("Failed to load data")
        }
    }

    const fetchSubscription = async () => {
        try {
            setLoading(true)
            const data = await subscriptionService.getSubscription(parseInt(id!))
            setFormData({
                customer: (data.customer?.id || data.customer).toString(),
                package: (data.package?.id || data.package).toString(),
                start_date: data.start_date,
                billing_day: data.billing_day.toString(),
                billing_start_month: data.billing_start_month || new Date().toISOString().slice(0, 7) + '-01',
                router: data.router ? (data.router?.id || data.router).toString() : "",
                mikrotik_username: data.mikrotik_username,
                mikrotik_password: data.mikrotik_password, // Password might not be returned? If not, leave blank or handle safely.
                // If password is not returned, we might need logic to keep existing if empty.
                connection_fee: data.connection_fee ? data.connection_fee.toString() : "",
                reconnection_fee: data.reconnection_fee ? data.reconnection_fee.toString() : "",
                status: data.status,
            })
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch subscription details")
            navigate("/subscriptions")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))

        // If package is being changed, update the selected package price
        if (field === "package") {
            const selectedPkg = packages.find(pkg => pkg.id.toString() === value)
            if (selectedPkg) {
                setSelectedPackagePrice(selectedPkg.price)
            } else {
                setSelectedPackagePrice("")
            }
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createSubscription(false)
    }

    const createSubscription = async (forceLink: boolean) => {
        setLoading(true)
        try {
            const payload = {
                customer: parseInt(formData.customer),
                package: parseInt(formData.package),
                start_date: formData.start_date,
                billing_day: parseInt(formData.billing_day),
                billing_start_month: formData.billing_start_month,
                router: formData.router ? parseInt(formData.router) : null,
                mikrotik_username: formData.mikrotik_username,
                mikrotik_password: formData.mikrotik_password,
                connection_fee: formData.connection_fee || null,
                reconnection_fee: formData.reconnection_fee || null,
                status: formData.status,
                force_link: forceLink,
            }

            if (isEditMode) {
                // If update, we might not send password if it's empty to avoid reset?
                // But simplified for now.
                await subscriptionService.updateSubscription(parseInt(id!), payload)
                toast.success("Subscription updated successfully!")
            } else {
                await subscriptionService.createSubscription(payload)
                toast.success(forceLink ? "Subscription linked successfully!" : "Subscription created successfully!")
            }
            navigate("/subscriptions")
        } catch (error: any) {
            console.error("Failed to create subscription", error)
            if (error.response?.data) {
                const errors = error.response.data

                // Handle specific MikroTik error
                if (errors.mikrotik_error) {
                    const msg = Array.isArray(errors.mikrotik_error) ? errors.mikrotik_error[0] : errors.mikrotik_error

                    // Check if it's the "already exists" error
                    if (msg.includes("already exists in MikroTik") && !forceLink) {
                        setShowForceLinkDialog(true)
                        return
                    }

                    toast.error(msg, { duration: 5000 })
                    return
                }

                Object.keys(errors).forEach(key => {
                    const errorMsg = Array.isArray(errors[key])
                        ? errors[key].join(", ")
                        : errors[key]
                    // Capitalize key for display
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    toast.error(`${displayKey}: ${errorMsg}`)
                })
            } else {
                toast.error(`Failed to ${isEditMode ? 'update' : 'create'} subscription. Please check your connection.`)
            }
        } finally {
            if (!showForceLinkDialog) {
                setLoading(false)
            }
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
                                    <BreadcrumbLink href="/subscriptions">Subscriptions</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{isEditMode ? 'Edit Subscription' : 'Add Subscription'}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/subscriptions")}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Subscriptions
                        </Button>

                        <Card>
                            <CardHeader>
                                <CardTitle>{isEditMode ? 'Edit Subscription' : 'Add New Subscription'}</CardTitle>
                                <CardDescription>
                                    {isEditMode ? 'Update subscription details' : 'Create a new customer subscription'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="customer">Customer *</Label>
                                            <Select
                                                value={formData.customer}
                                                onValueChange={(value) => handleChange("customer", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                                            {customer.name} - {customer.phone}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="package">Package *</Label>
                                            <Select
                                                value={formData.package}
                                                onValueChange={(value) => handleChange("package", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select package" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {packages.map((pkg) => (
                                                        <SelectItem key={pkg.id} value={pkg.id.toString()}>
                                                            {pkg.name} - ৳{pkg.price}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedPackagePrice && (
                                                <p className="text-sm font-medium text-green-600">
                                                    Package Price: ৳{selectedPackagePrice}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="start_date">Start Date *</Label>
                                            <Input
                                                id="start_date"
                                                type="date"
                                                value={formData.start_date}
                                                onChange={(e) => handleChange("start_date", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="billing_day">Billing Day (1-31) *</Label>
                                            <Input
                                                id="billing_day"
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={formData.billing_day}
                                                onChange={(e) => handleChange("billing_day", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="billing_start_month">Billing Start Month *</Label>
                                            <Input
                                                id="billing_start_month"
                                                type="month"
                                                value={formData.billing_start_month?.slice(0, 7) || ''}
                                                onChange={(e) => handleChange("billing_start_month", e.target.value + '-01')}
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Month from which billing cycle starts
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="router">MikroTik Router</Label>
                                            <Select
                                                value={formData.router}
                                                onValueChange={(value) => handleChange("router", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select router" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {routers.map((router) => (
                                                        <SelectItem key={router.id} value={router.id.toString()}>
                                                            {router.name} - {router.ip_address}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mikrotik_username">PPPoE Username *</Label>
                                            <Input
                                                id="mikrotik_username"
                                                value={formData.mikrotik_username}
                                                onChange={(e) => handleChange("mikrotik_username", e.target.value)}
                                                required
                                                placeholder="pppoe-user123"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mikrotik_password">PPPoE Password *</Label>
                                            <Input
                                                id="mikrotik_password"
                                                type="password"
                                                value={formData.mikrotik_password}
                                                onChange={(e) => handleChange("mikrotik_password", e.target.value)}
                                                required
                                                placeholder="Strong password"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="connection_fee">Connection Fee (৳)</Label>
                                            <Input
                                                id="connection_fee"
                                                type="number"
                                                step="0.01"
                                                value={formData.connection_fee}
                                                onChange={(e) => handleChange("connection_fee", e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reconnection_fee">Reconnection Fee (৳)</Label>
                                            <Input
                                                id="reconnection_fee"
                                                type="number"
                                                step="0.01"
                                                value={formData.reconnection_fee}
                                                onChange={(e) => handleChange("reconnection_fee", e.target.value)}
                                                placeholder="0.00"
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
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    <SelectItem value="expired">Expired</SelectItem>
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
                                            {isEditMode ? 'Update Subscription' : 'Create Subscription'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate("/subscriptions")}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <Dialog open={showForceLinkDialog} onOpenChange={setShowForceLinkDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>User Already Exists</DialogTitle>
                            <DialogDescription>
                                A PPPoE user with the username <strong>{formData.mikrotik_username}</strong> already exists in the MikroTik router.
                                <br /><br />
                                Do you want to link this subscription to the existing router user? The password and plan will be updated to match this subscription.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowForceLinkDialog(false)}>
                                No, Cancel
                            </Button>
                            <Button onClick={() => {
                                setShowForceLinkDialog(false);
                                createSubscription(true);
                            }}>
                                Yes, Link User
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AddSubscriptionPage
