import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { billService, subscriptionService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Loader2 } from "lucide-react"

export default function AddBillPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [subscriptions, setSubscriptions] = useState<any[]>([])

    const currentDate = new Date()
    const [formData, setFormData] = useState({
        subscription: "",
        billing_month: currentDate.getMonth() + 1, // Current month (1-12)
        billing_year: currentDate.getFullYear(),
        amount: "",
        status: "unpaid"
    })

    // Month names for display
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    // Generate month options (past 6 months + current + future 11 months = 18 total)
    const getAvailableMonths = () => {
        const months = []
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        // Start from 6 months ago
        let startMonth = currentMonth - 6
        let startYear = currentYear

        if (startMonth <= 0) {
            startMonth = startMonth + 12
            startYear = startYear - 1
        }

        // Add 18 months total (6 past + current + 11 future)
        for (let i = 0; i < 18; i++) {
            let month = startMonth + i
            let year = startYear

            while (month > 12) {
                month = month - 12
                year = year + 1
            }

            months.push({ month, year, label: `${monthNames[month - 1]} ${year}` })
        }

        return months
    }

    useEffect(() => {
        fetchSubscriptions()
    }, [])

    // Auto-fill amount when subscription changes
    useEffect(() => {
        if (formData.subscription) {
            const sub = subscriptions.find(s => s.id.toString() === formData.subscription)
            if (sub && sub.package_price) {
                setFormData(prev => ({ ...prev, amount: sub.package_price.toString() }))
            }
        }
    }, [formData.subscription, subscriptions])

    const fetchSubscriptions = async () => {
        try {
            const data = await subscriptionService.getSubscriptions({ status: 'active' })
            setSubscriptions(data.results || [])
        } catch (error) {
            toast.error("Failed to load subscriptions")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Get selected subscription to get package price
            const selectedSub = subscriptions.find(s => s.id.toString() === formData.subscription)

            if (!selectedSub) {
                toast.error("Please select a subscription")
                setLoading(false)
                return
            }

            const packagePrice = parseFloat(selectedSub.package_price || "0")

            // Calculate paid_amount based on status
            let paidAmount = 0
            if (formData.status === "paid") {
                paidAmount = packagePrice
            } else if (formData.status === "partial") {
                paidAmount = parseFloat(formData.amount || "0")
            } else {
                // pending
                paidAmount = 0
            }

            const dueAmount = packagePrice - paidAmount

            await billService.createBill({
                subscription: parseInt(formData.subscription),
                billing_month: formData.billing_month,
                billing_year: formData.billing_year,
                billing_date: new Date().toISOString().split('T')[0],
                package_price: packagePrice,
                total_amount: packagePrice,
                paid_amount: paidAmount,
                due_amount: dueAmount,
                status: formData.status
            })
            toast.success("Bill created successfully")
            navigate("/billing/bills")
        } catch (error: any) {
            console.error(error)
            if (error.response?.data) {
                const errorMsg = error.response.data.detail || error.response.data.non_field_errors?.[0] || "Failed to create bill"
                toast.error(errorMsg)
            } else {
                toast.error("Failed to create bill")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleMonthYearChange = (value: string) => {
        const [month, year] = value.split('-')
        setFormData({
            ...formData,
            billing_month: parseInt(month),
            billing_year: parseInt(year)
        })
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
                                <BreadcrumbLink href="/billing/bills">Bills</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Create Bill</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Bill</CardTitle>
                            <CardDescription>Manually create a bill for a subscription</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Subscription</Label>
                                    <Select
                                        value={formData.subscription}
                                        onValueChange={(value) => setFormData({ ...formData, subscription: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select subscription" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subscriptions.map((sub: any) => (
                                                <SelectItem key={sub.id} value={sub.id.toString()}>
                                                    {sub.customer_name} - {sub.package_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Billing Month</Label>
                                    <Select
                                        value={`${formData.billing_month}-${formData.billing_year}`}
                                        onValueChange={handleMonthYearChange}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAvailableMonths().map((m) => (
                                                <SelectItem key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Select billing month (past 6 months to future 11 months)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="partial">Partial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.status === "partial" && (
                                    <div className="space-y-2">
                                        <Label>Paid Amount</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="Amount already paid"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter the amount that has been paid (partial payment)
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => navigate("/billing/bills")}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Bill
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
