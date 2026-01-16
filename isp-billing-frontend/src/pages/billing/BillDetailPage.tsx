import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { billService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Download } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"

export default function BillDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [bill, setBill] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchBill()
        }
    }, [id])

    const fetchBill = async () => {
        try {
            setLoading(true)
            const data = await billService.getBill(parseInt(id!))
            setBill(data)
        } catch (error) {
            toast.error("Failed to load bill details")
            navigate("/bills")
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
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        return months[month - 1] || ""
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!bill) {
        return null
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
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/bills">Bills</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{bill.bill_number}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="flex items-center justify-between mt-4">
                        <Button variant="outline" onClick={() => navigate("/bills")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Bills
                        </Button>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
                        </Button>
                    </div>

                    <Card className="max-w-4xl mx-auto w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl">{bill.bill_number}</CardTitle>
                                    <CardDescription>
                                        {getMonthName(bill.billing_month)} {bill.billing_year}
                                    </CardDescription>
                                </div>
                                {getStatusBadge(bill.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Customer & Subscription Info */}
                            <div className="grid grid-cols-2 gap-6 pb-6 border-b">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">CUSTOMER</h3>
                                    <p className="text-lg font-medium">{bill.customer_name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">PACKAGE</h3>
                                    <p className="text-lg font-medium">{bill.package_name}</p>
                                </div>
                            </div>

                            {/* Bill Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4">BILL DETAILS</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Package Price</span>
                                        <span className="font-medium">৳{bill.package_price}</span>
                                    </div>
                                    {parseFloat(bill.other_charges) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Other Charges</span>
                                            <span className="font-medium">৳{bill.other_charges}</span>
                                        </div>
                                    )}
                                    {parseFloat(bill.discount) > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span className="font-medium">-৳{bill.discount}</span>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>Total Amount</span>
                                        <span>৳{bill.total_amount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4">PAYMENT STATUS</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                                        <p className="text-xl font-bold">৳{bill.total_amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Paid Amount</p>
                                        <p className="text-xl font-bold text-green-600">৳{bill.paid_amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Due Amount</p>
                                        <p className="text-xl font-bold text-red-600">৳{bill.due_amount}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Billing Date:</span>
                                    <span className="ml-2 font-medium">{new Date(bill.billing_date).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Created:</span>
                                    <span className="ml-2 font-medium">{new Date(bill.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {bill.notes && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">NOTES</h3>
                                    <p className="text-sm">{bill.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
