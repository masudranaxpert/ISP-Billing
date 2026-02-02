import { useEffect, useState } from "react"
import { connectionFeeService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Wallet } from "lucide-react"
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

function ConnectionFeesPage() {
    // const navigate = useNavigate() // Remove this line
    const [fees, setFees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [selectedFee, setSelectedFee] = useState<any>(null)
    const [paymentData, setPaymentData] = useState({
        payment_method: "cash",
        transaction_id: "",
        notes: ""
    })

    useEffect(() => {
        fetchFees()
    }, [page, searchTerm])

    const fetchFees = async () => {
        try {
            setLoading(true)
            const params: any = { page }
            if (searchTerm) params.search = searchTerm
            const response = await connectionFeeService.getConnectionFees(params)
            setFees(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            toast.error("Failed to load connection fees")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenPayment = (fee: any) => {
        setSelectedFee(fee)
        setPaymentData({
            payment_method: "cash",
            transaction_id: "",
            notes: ""
        })
        setIsPaymentOpen(true)
    }

    const handleMarkPaid = async () => {
        if (!selectedFee) return

        try {
            setLoading(true)
            await connectionFeeService.updateConnectionFee(selectedFee.id, {
                is_paid: true,
                payment_method: paymentData.payment_method,
                transaction_id: paymentData.transaction_id,
                notes: paymentData.notes
            })
            toast.success("Connection fee marked as paid")
            setIsPaymentOpen(false)
            fetchFees()
        } catch (error: any) {
            toast.error("Failed to update connection fee")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (is_paid: boolean) => {
        return is_paid ?
            <Badge className="bg-green-600 hover:bg-green-700">PAID</Badge> :
            <Badge variant="outline" className="text-yellow-600 border-yellow-500 bg-yellow-50">UNPAID</Badge>
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
                                <BreadcrumbPage>Connection Fees</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Card className="mt-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Connection Fees</CardTitle>
                                    <CardDescription>Manage connection and reconnection fees</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search fees..."
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
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Fee Type</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Received By</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {fees.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                            No connection fees found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    fees.map((fee: any) => (
                                                        <TableRow key={fee.id}>
                                                            <TableCell className="font-medium">
                                                                {fee.customer_name ? (
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{fee.customer_name}</span>
                                                                        <span className="text-xs text-muted-foreground">{fee.customer_id_display}</span>
                                                                    </div>
                                                                ) : (
                                                                    fee.subscription ? `Sub #${fee.subscription}` : 'N/A'
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{fee.fee_type_display}</TableCell>
                                                            <TableCell>৳{fee.amount}</TableCell>
                                                            <TableCell>{fee.date}</TableCell>
                                                            <TableCell>{getStatusBadge(fee.is_paid)}</TableCell>
                                                            <TableCell>{fee.received_by_name || '-'}</TableCell>
                                                            <TableCell className="text-right">
                                                                {!fee.is_paid && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                                        onClick={() => handleOpenPayment(fee)}
                                                                    >
                                                                        <Wallet className="mr-1 h-3 w-3" />
                                                                        Pay
                                                                    </Button>
                                                                )}
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

                {/* Payment Dialog */}
                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mark as Paid</DialogTitle>
                            <DialogDescription>
                                Record payment for connection fee of ৳{selectedFee?.amount}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Received By</Label>
                                <Input
                                    value="You (Current User)"
                                    disabled
                                    className="bg-muted"
                                />
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
                            <Button onClick={handleMarkPaid}>Confirm Payment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default ConnectionFeesPage
