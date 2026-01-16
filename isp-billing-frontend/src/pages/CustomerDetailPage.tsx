import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { customerService, subscriptionService, billService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, User, Wifi, FileText, DollarSign, MapPin, Phone, Mail, Calendar, Activity, Wallet } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"

export default function CustomerDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [customer, setCustomer] = useState<any>(null)
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [bills, setBills] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState("overview")
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<any>(null)
    const [paymentData, setPaymentData] = useState({
        amount: "",
        payment_method: "cash",
        transaction_id: "",
        notes: ""
    })

    useEffect(() => {
        if (id) {
            fetchCustomerData()
        }
    }, [id])

    const fetchCustomerData = async () => {
        try {
            setLoading(true)
            const [customerData, subsData, billsData] = await Promise.all([
                customerService.getCustomer(parseInt(id!)),
                subscriptionService.getSubscriptions({ customer: id }),
                billService.getBills({ subscription__customer: id })
            ])
            setCustomer(customerData)
            setSubscriptions(subsData.results || [])
            setBills(billsData.results || [])
        } catch (error) {
            toast.error("Failed to load customer details")
            navigate("/customers")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenPayment = (bill: any) => {
        setSelectedBill(bill)
        setPaymentData({
            amount: bill.due_amount,
            payment_method: "cash",
            transaction_id: "",
            notes: ""
        })
        setIsPaymentOpen(true)
    }

    const handleAddPayment = async () => {
        if (!selectedBill) return

        try {
            setLoading(true)
            const res = await billService.addPayment(selectedBill.id, {
                ...paymentData,
                payment_date: new Date().toISOString()
            })
            toast.success(res.message)
            setIsPaymentOpen(false)
            fetchCustomerData() // Refresh data
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to add payment")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const config: any = {
            active: { variant: "default", className: "bg-green-600" },
            suspended: { variant: "destructive", className: "" },
            inactive: { variant: "secondary", className: "" },
            expired: { variant: "outline", className: "border-orange-500 text-orange-600" },
        }
        const statusConfig = config[status] || { variant: "secondary", className: "" }
        return (
            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                {status?.toUpperCase()}
            </Badge>
        )
    }

    const getBillStatusBadge = (status: string) => {
        const config: any = {
            pending: { variant: "outline", className: "border-yellow-500 text-yellow-600 bg-yellow-50" },
            paid: { variant: "default", className: "bg-green-600" },
            partial: { variant: "default", className: "bg-blue-600" },
            overdue: { variant: "destructive", className: "" },
        }
        const statusConfig = config[status] || { variant: "secondary", className: "" }
        return (
            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                {status?.toUpperCase()}
            </Badge>
        )
    }

    const getMonthName = (month: number) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return months[month - 1] || ""
    }

    const calculateBillingSummary = () => {
        const totalBilled = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0)
        const totalPaid = bills.reduce((sum, bill) => sum + parseFloat(bill.paid_amount || 0), 0)
        const totalDue = bills.reduce((sum, bill) => sum + parseFloat(bill.due_amount || 0), 0)
        return { totalBilled, totalPaid, totalDue }
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!customer) {
        return null
    }

    const billingSummary = calculateBillingSummary()
    const activeSubscription = subscriptions.find(s => s.status === 'active')

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{customer.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="flex items-center justify-between mt-4">
                        <Button variant="outline" onClick={() => navigate("/customers")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Customers
                        </Button>
                        <div className="flex gap-2">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`/subscriptions/add?customer=${id}`)}>
                                Add Subscription
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => navigate(`/bills/add?customer=${id}`)}>
                                Create Bill
                            </Button>
                        </div>
                    </div>

                    {/* Customer Header Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">{customer.name}</CardTitle>
                                        <CardDescription className="text-base">ID: {customer.customer_id}</CardDescription>
                                    </div>
                                </div>
                                {getStatusBadge(customer.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="font-medium">{customer.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium">{customer.email || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Zone</p>
                                        <p className="font-medium">{customer.zone_name || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Joined</p>
                                        <p className="font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs for Different Sections */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-muted">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-900/50 dark:data-[state=active]:text-amber-400">Overview</TabsTrigger>
                            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-900/50 dark:data-[state=active]:text-amber-400">Subscriptions</TabsTrigger>
                            <TabsTrigger value="billing" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-900/50 dark:data-[state=active]:text-amber-400">Billing</TabsTrigger>
                            <TabsTrigger value="connection" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 dark:data-[state=active]:bg-amber-900/50 dark:data-[state=active]:text-amber-400">Connection</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                {/* Quick Stats */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                                        <Wifi className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Total: {subscriptions.length}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">৳{billingSummary.totalDue.toFixed(2)}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Unpaid amount
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{bills.length}</div>
                                        <p className="text-xs text-muted-foreground">
                                            ৳{billingSummary.totalBilled.toFixed(2)} billed
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Customer Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Customer Information</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Full Name</p>
                                            <p className="font-medium">{customer.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Customer ID</p>
                                            <p className="font-medium">{customer.customer_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Phone</p>
                                            <p className="font-medium">{customer.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="font-medium">{customer.email || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Address</p>
                                            <p className="font-medium">{customer.address || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Zone</p>
                                            <p className="font-medium">{customer.zone_name || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">NID</p>
                                            <p className="font-medium">{customer.nid || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Status</p>
                                            <div>{getStatusBadge(customer.status)}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Subscriptions Tab */}
                        <TabsContent value="subscriptions" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Subscriptions</CardTitle>
                                    <CardDescription>All subscriptions for this customer</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {subscriptions.length === 0 ? (
                                        <p className="text-center py-8 text-muted-foreground">No subscriptions found</p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Package</TableHead>
                                                    <TableHead>Start Date</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Router</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {subscriptions.map((sub: any) => (
                                                    <TableRow key={sub.id}>
                                                        <TableCell className="font-medium">{sub.package_name}</TableCell>
                                                        <TableCell>{new Date(sub.start_date).toLocaleDateString()}</TableCell>
                                                        <TableCell>৳{sub.package_price}</TableCell>
                                                        <TableCell>{sub.router_name || "N/A"}</TableCell>
                                                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                                        <TableCell>
                                                            <Button size="sm" variant="outline" onClick={() => navigate(`/subscriptions/${sub.id}`)}>
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Billing Tab */}
                        <TabsContent value="billing" className="space-y-4">
                            {/* Billing Summary */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">৳{billingSummary.totalBilled.toFixed(2)}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">৳{billingSummary.totalPaid.toFixed(2)}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">৳{billingSummary.totalDue.toFixed(2)}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Bills Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bills</CardTitle>
                                    <CardDescription>All bills for this customer</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {bills.length === 0 ? (
                                        <p className="text-center py-8 text-muted-foreground">No bills found</p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Bill Number</TableHead>
                                                    <TableHead>Month/Year</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead>Paid</TableHead>
                                                    <TableHead>Due</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bills.map((bill: any) => (
                                                    <TableRow key={bill.id}>
                                                        <TableCell className="font-medium">{bill.bill_number}</TableCell>
                                                        <TableCell>{bill.billing_month}/{bill.billing_year}, {getMonthName(bill.billing_month)}</TableCell>
                                                        <TableCell>৳{bill.total_amount}</TableCell>
                                                        <TableCell>৳{bill.paid_amount}</TableCell>
                                                        <TableCell>৳{bill.due_amount}</TableCell>
                                                        <TableCell>{getBillStatusBadge(bill.status)}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                {bill.status !== 'paid' && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                                        onClick={() => handleOpenPayment(bill)}
                                                                    >
                                                                        <Wallet className="mr-1 h-3 w-3" />
                                                                        Pay
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" variant="outline" onClick={() => navigate(`/bills/${bill.id}`)}>
                                                                    View
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Connection Tab */}
                        <TabsContent value="connection" className="space-y-4">
                            {activeSubscription ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>MikroTik Connection Status</CardTitle>
                                        <CardDescription>Live connection information</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Username</p>
                                                <p className="font-medium font-mono">{activeSubscription.mikrotik_username || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">IP Address</p>
                                                {activeSubscription.live_status ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                                        <p className="font-medium font-mono text-green-600">{activeSubscription.live_status.ip_address}</p>
                                                    </div>
                                                ) : (
                                                    <p className="font-medium font-mono opacity-60">{activeSubscription.framed_ip_address || "N/A"}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">MAC Address</p>
                                                <p className="font-medium font-mono">
                                                    {activeSubscription.live_status?.mac_address || activeSubscription.mac_address || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Router</p>
                                                <p className="font-medium">{activeSubscription.router_name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Package</p>
                                                <p className="font-medium">{activeSubscription.package_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Sync Status</p>
                                                <Badge variant={activeSubscription.is_synced_to_mikrotik ? "default" : "destructive"}>
                                                    {activeSubscription.is_synced_to_mikrotik ? "SYNCED" : "NOT SYNCED"}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-green-600" />
                                                Connection Status
                                            </h4>
                                            {activeSubscription.live_status ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Status</p>
                                                        <Badge variant="default" className="bg-green-600">ONLINE</Badge>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Uptime</p>
                                                        <p className="font-medium">{activeSubscription.live_status.uptime || "N/A"}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <Badge variant="secondary" className="opacity-60">OFFLINE</Badge>
                                                    <p className="text-sm text-muted-foreground mt-2">No active connection found</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="py-8">
                                        <p className="text-center text-muted-foreground">No active subscription found</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Add Payment Dialog */}
                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Payment</DialogTitle>
                            <DialogDescription>
                                Add payment for bill {selectedBill?.bill_number}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Amount (৳)</Label>
                                <Input
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    placeholder="Enter amount"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Due Amount: ৳{selectedBill?.due_amount}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Payment Method</Label>
                                <Select value={paymentData.payment_method} onValueChange={(v) => setPaymentData({ ...paymentData, payment_method: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bkash">bKash</SelectItem>
                                        <SelectItem value="nagad">Nagad</SelectItem>
                                        <SelectItem value="rocket">Rocket</SelectItem>
                                        <SelectItem value="bank">Bank Transfer</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Transaction ID (Optional)</Label>
                                <Input
                                    value={paymentData.transaction_id}
                                    onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                                    placeholder="Enter transaction ID"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes (Optional)</Label>
                                <Input
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                    placeholder="Enter notes"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddPayment}>Add Payment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    )
}
