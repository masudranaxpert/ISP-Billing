import { useEffect, useState } from "react"
import { advancePaymentService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus } from "lucide-react"
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
                                    <CardDescription>Customer advance payments</CardDescription>
                                </div>
                                <Button onClick={() => navigate("/billing/advance-payments/add")}><Plus className="mr-2 h-4 w-4" />Add Advance Payment</Button>
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
                                                    <TableHead>Advance Number</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Months Covered</TableHead>
                                                    <TableHead>Used</TableHead>
                                                    <TableHead>Remaining</TableHead>
                                                    <TableHead>Payment Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payments.length === 0 ? (
                                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No advance payments found</TableCell></TableRow>
                                                ) : (
                                                    payments.map((payment) => (
                                                        <TableRow key={payment.id}>
                                                            <TableCell className="font-medium">{payment.advance_number}</TableCell>
                                                            <TableCell>{payment.subscription_customer}</TableCell>
                                                            <TableCell>৳{payment.amount}</TableCell>
                                                            <TableCell>{payment.months_covered}</TableCell>
                                                            <TableCell>৳{payment.used_amount}</TableCell>
                                                            <TableCell>৳{payment.remaining_balance}</TableCell>
                                                            <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
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
