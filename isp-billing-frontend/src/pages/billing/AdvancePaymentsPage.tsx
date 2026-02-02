import { useEffect, useState } from "react"
import { advancePaymentService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

function AdvancePaymentsPage() {
    const navigate = useNavigate()
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Get user from local storage
    const userJson = localStorage.getItem('user')
    const user = userJson ? JSON.parse(userJson) : null
    // Assuming role or is_staff is available in user object
    const isAdminOrManager = user && (['admin', 'manager', 'superuser'].includes(user.role) || user.is_staff || user.is_superuser)

    useEffect(() => {
        fetchPayments()
    }, [page])

    const fetchPayments = async () => {
        try {
            setLoading(true)
            const response = await advancePaymentService.getAdvancePayments({ page })
            setPayments(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            toast.error("Failed to load advance payments")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this advance payment?")) return

        try {
            await advancePaymentService.deleteAdvancePayment(id)
            toast.success("Advance payment deleted")
            fetchPayments()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to delete advance payment")
        }
    }

    const canEditOrDelete = (payment: any) => {
        if (isAdminOrManager) return true;
        const created = new Date(payment.created_at).getTime();
        const now = new Date().getTime();
        const diffMinutes = (now - created) / 60000;
        return diffMinutes <= 30;
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
                            <BreadcrumbItem><BreadcrumbPage>Advance Payments</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Advance Payments</CardTitle>
                                    <CardDescription>Manage customer advance payments and wallet balances</CardDescription>
                                </div>
                                <Button onClick={() => navigate("/billing/advance-payments/add")}>
                                    <Plus className="mr-2 h-4 w-4" />Add Advance
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>No.</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Used</TableHead>
                                                    <TableHead>Remaining</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payments.length === 0 ? (
                                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No advance payments found</TableCell></TableRow>
                                                ) : (
                                                    payments.map((payment) => (
                                                        <TableRow key={payment.id}>
                                                            <TableCell className="font-medium text-xs">{payment.advance_number}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span>{payment.customer_name}</span>
                                                                    <span className="text-xs text-muted-foreground">{payment.customer_phone}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                                            <TableCell className="font-medium">৳{payment.amount}</TableCell>
                                                            <TableCell className="text-muted-foreground">৳{payment.used_amount}</TableCell>
                                                            <TableCell className="text-green-600 font-medium">৳{payment.remaining_balance}</TableCell>
                                                            <TableCell className="text-right">
                                                                {canEditOrDelete(payment) && (
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => navigate(`/billing/advance-payments/${payment.id}/edit`)}
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleDelete(payment.id)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    </div>
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
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AdvancePaymentsPage
