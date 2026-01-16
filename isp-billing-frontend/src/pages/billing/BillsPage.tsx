import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { billService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, Eye, Wallet } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

function BillsPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const statusFilter = searchParams.get("status") || ""
    const [bills, setBills] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isGenerateOpen, setIsGenerateOpen] = useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<any>(null)
    const [paymentData, setPaymentData] = useState({
        amount: "",
        payment_method: "cash",
        transaction_id: "",
        notes: ""
    })
    const [generateDate, setGenerateDate] = useState({
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString()
    })

    useEffect(() => {
        fetchBills()
    }, [page, searchTerm, statusFilter])

    const fetchBills = async () => {
        try {
            setLoading(true)
            const params: any = { page }
            if (searchTerm) params.search = searchTerm
            if (statusFilter) params.status = statusFilter
            const response = await billService.getBills(params)
            setBills(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            toast.error("Failed to load bills")
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateBills = async () => {
        try {
            setLoading(true)
            const res = await billService.generateMonthlyBills({
                month: parseInt(generateDate.month),
                year: parseInt(generateDate.year)
            })
            toast.success(res.message)
            setIsGenerateOpen(false)
            fetchBills()
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to generate bills")
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
            fetchBills()
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to add payment")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const config: any = {
            pending: { variant: "outline", className: "border-yellow-500 text-yellow-600 bg-yellow-50" },
            paid: { variant: "default", className: "bg-green-600 hover:bg-green-700" },
            partial: { variant: "default", className: "bg-blue-600 hover:bg-blue-700" },
            overdue: { variant: "destructive", className: "" },
            cancelled: { variant: "secondary", className: "" },
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
                            <BreadcrumbItem>
                                <BreadcrumbPage>Bills</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Card className="mt-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Bills</CardTitle>
                                    <CardDescription>Manage customer bills and payments</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => setIsGenerateOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Generate Monthly Bills
                                    </Button>
                                    <Button onClick={() => navigate("/bills/add")}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Bill
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search bills..."
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
                                                    <TableHead>Bill Number</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Package</TableHead>
                                                    <TableHead>Month/Year</TableHead>
                                                    <TableHead>Total Amount</TableHead>
                                                    <TableHead>Paid</TableHead>
                                                    <TableHead>Due</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bills.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                            No bills found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    bills.map((bill: any) => (
                                                        <TableRow key={bill.id}>
                                                            <TableCell className="font-medium">{bill.bill_number}</TableCell>
                                                            <TableCell>{bill.customer_name}</TableCell>
                                                            <TableCell>{bill.package_name}</TableCell>
                                                            <TableCell>{bill.billing_month}/{bill.billing_year}, {getMonthName(bill.billing_month)}</TableCell>
                                                            <TableCell>৳{bill.total_amount}</TableCell>
                                                            <TableCell>৳{bill.paid_amount}</TableCell>
                                                            <TableCell>৳{bill.due_amount}</TableCell>
                                                            <TableCell>{getStatusBadge(bill.status)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {bill.status !== 'paid' && (
                                                                        <Button
                                                                            size="sm"
                                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                                            onClick={() => handleOpenPayment(bill)}
                                                                        >
                                                                            <Wallet className="mr-1 h-3 w-3" />
                                                                            Payment
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => navigate(`/bills/${bill.id}`)}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
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

                {/* Generate Bills Dialog */}
                <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Monthly Bills</DialogTitle>
                            <DialogDescription>
                                Generate bills for all active subscriptions for a specific month
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Month</Label>
                                <Select value={generateDate.month} onValueChange={(v) => setGenerateDate({ ...generateDate, month: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Year</Label>
                                <Input
                                    type="number"
                                    value={generateDate.year}
                                    onChange={(e) => setGenerateDate({ ...generateDate, year: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                            <Button onClick={handleGenerateBills}>Generate</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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

export default BillsPage
