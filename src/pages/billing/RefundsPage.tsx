import { useEffect, useState } from "react"
import { refundService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, CheckCircle, XCircle } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

function RefundsPage() {
    const navigate = useNavigate()
    const [refunds, setRefunds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchRefunds()
    }, [page])

    const fetchRefunds = async () => {
        try {
            setLoading(true)
            const response = await refundService.getRefunds({ page })
            setRefunds(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            toast.error("Failed to load refunds")
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: number) => {
        try {
            await refundService.approveRefund(id)
            toast.success("Refund approved!")
            fetchRefunds()
        } catch (error) {
            toast.error("Failed to approve")
        }
    }

    const handleReject = async (id: number) => {
        try {
            await refundService.rejectRefund(id)
            toast.success("Refund rejected!")
            fetchRefunds()
        } catch (error) {
            toast.error("Failed to reject")
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: any = { pending: "secondary", approved: "default", rejected: "destructive", completed: "outline" }
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
                            <BreadcrumbItem><BreadcrumbPage>Refunds</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Refunds</CardTitle>
                                    <CardDescription>Manage refund requests</CardDescription>
                                </div>
                                <Button onClick={() => navigate("/billing/refunds/add")}><Plus className="mr-2 h-4 w-4" />Add Refund</Button>
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
                                                    <TableHead>Refund Number</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Advance Balance</TableHead>
                                                    <TableHead>Refund Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {refunds.length === 0 ? (
                                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No refunds found</TableCell></TableRow>
                                                ) : (
                                                    refunds.map((refund) => (
                                                        <TableRow key={refund.id}>
                                                            <TableCell className="font-medium">{refund.refund_number}</TableCell>
                                                            <TableCell>{refund.subscription_customer}</TableCell>
                                                            <TableCell>৳{refund.refund_amount}</TableCell>
                                                            <TableCell>৳{refund.advance_balance}</TableCell>
                                                            <TableCell>{refund.refund_date ? new Date(refund.refund_date).toLocaleDateString() : "-"}</TableCell>
                                                            <TableCell>{getStatusBadge(refund.status)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {refund.status === "pending" && (
                                                                        <>
                                                                            <Button variant="ghost" size="icon" onClick={() => handleApprove(refund.id)} title="Approve"><CheckCircle className="h-4 w-4 text-green-500" /></Button>
                                                                            <Button variant="ghost" size="icon" onClick={() => handleReject(refund.id)} title="Reject"><XCircle className="h-4 w-4 text-red-500" /></Button>
                                                                        </>
                                                                    )}
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
            </SidebarInset>
        </SidebarProvider>
    )
}

export default RefundsPage
