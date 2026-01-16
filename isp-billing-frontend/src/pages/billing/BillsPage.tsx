import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { billService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, Eye, Trash2 } from "lucide-react"
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

    const getStatusBadge = (status: string) => {
        const variants: any = {
            pending: "secondary",
            paid: "default",
            partial: "outline",
            overdue: "destructive",
            cancelled: "secondary",
        }
        return <Badge variant={variants[status] || "secondary"}>{status?.toUpperCase()}</Badge>
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
                            <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem><BreadcrumbPage>Bills</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Bills</CardTitle>
                                    <CardDescription>Manage customer bills</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsGenerateOpen(true)}>
                                        Generate Monthly Bills
                                    </Button>
                                    <Button onClick={() => navigate("/billing/bills/add")}>
                                        <Plus className="mr-2 h-4 w-4" />Add Bill
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search bills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                                </div>
                            </div>
                            {loading ? (
                                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                                                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No bills found</TableCell></TableRow>
                                                ) : (
                                                    bills.map((bill) => (
                                                        <TableRow key={bill.id}>
                                                            <TableCell className="font-medium">{bill.bill_number}</TableCell>
                                                            <TableCell>{bill.subscription_customer}</TableCell>
                                                            <TableCell>{bill.subscription_package}</TableCell>
                                                            <TableCell>{bill.billing_month}/{bill.billing_year}</TableCell>
                                                            <TableCell>৳{bill.total_amount}</TableCell>
                                                            <TableCell>৳{bill.paid_amount}</TableCell>
                                                            <TableCell>৳{bill.due_amount}</TableCell>
                                                            <TableCell>{getStatusBadge(bill.status)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/billing/bills/${bill.id}`)}><Eye className="h-4 w-4" /></Button>
                                                                    <Button variant="ghost" size="icon" onClick={async () => { if (confirm("Delete?")) { await billService.deleteBill(bill.id); fetchBills(); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                                            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</Button>
                                            <span className="text-sm">Page {page} of {totalPages}</span>
                                            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Monthly Bills</DialogTitle>
                            <DialogDescription>
                                Auto-generate bills for all active subscriptions for the selected month. Existing bills will be skipped.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Month</Label>
                                    <Select
                                        value={generateDate.month}
                                        onValueChange={(val) => setGenerateDate(prev => ({ ...prev, month: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <SelectItem key={m} value={m.toString()}>
                                                    {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    <Input
                                        type="number"
                                        value={generateDate.year}
                                        onChange={(e) => setGenerateDate(prev => ({ ...prev, year: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                            <Button onClick={handleGenerateBills} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Generate Bills
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default BillsPage
