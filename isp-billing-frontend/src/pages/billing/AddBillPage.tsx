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
        billing_month: currentDate.getMonth() + 1,
        billing_year: currentDate.getFullYear(),
        package_price: "",
        discount: "0",
        other_charges: "0",
        status: "pending",
        // Payment fields (shown only if status is paid/partial)
        payment_amount: "",
        payment_method: "cash",
        transaction_id: "",
        payment_notes: ""
    })

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const getAvailableMonths = () => {
        const months = []
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        let startMonth = currentMonth - 6
        let startYear = currentYear

        if (startMonth <= 0) {
            startMonth = startMonth + 12
            startYear = startYear - 1
        }

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

    useEffect(() => {
        if (formData.subscription) {
            const sub = subscriptions.find(s => s.id.toString() === formData.subscription)
            if (sub && sub.package_price) {
                setFormData(prev => ({ ...prev, package_price: sub.package_price.toString() }))
            }
        }
    }, [formData.subscription, subscriptions])

    // Auto-calculate payment amount when status changes
    useEffect(() => {
        if (formData.status === 'paid' && formData.package_price) {
            const total = parseFloat(formData.package_price) + parseFloat(formData.other_charges) - parseFloat(formData.discount)
            setFormData(prev => ({ ...prev, payment_amount: total.toString() }))
        }
    }, [formData.status, formData.package_price, formData.other_charges, formData.discount])

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
            const selectedSub = subscriptions.find(s => s.id.toString() === formData.subscription)

            if (!selectedSub) {
                toast.error("Please select a subscription")
                setLoading(false)
                return
            }

            const packagePrice = parseFloat(formData.package_price)
            const discount = parseFloat(formData.discount)
            const otherCharges = parseFloat(formData.other_charges)
            const totalAmount = packagePrice + otherCharges - discount

            let paidAmount = 0
            let dueAmount = totalAmount
            let finalStatus = formData.status

            if (formData.status === 'paid') {
                paidAmount = totalAmount
                dueAmount = 0
                finalStatus = 'paid'
            } else if (formData.status === 'partial') {
                paidAmount = parseFloat(formData.payment_amount)
                dueAmount = totalAmount - paidAmount
                finalStatus = 'partial'
            } else {
                finalStatus = 'pending'
            }

            const billData = {
                subscription: parseInt(formData.subscription),
                billing_month: formData.billing_month,
                billing_year: formData.billing_year,
                package_price: packagePrice,
                discount: discount,
                other_charges: otherCharges,
                total_amount: totalAmount,
                paid_amount: paidAmount,
                due_amount: dueAmount,
                status: finalStatus
            }

            const response = await billService.createBill(billData)

            // If status is paid or partial, create payment entry
            if ((formData.status === 'paid' || formData.status === 'partial') && paidAmount > 0) {
                await billService.addPayment(response.bill.id, {
                    amount: paidAmount,
                    payment_method: formData.payment_method,
                    transaction_id: formData.transaction_id,
                    notes: formData.payment_notes,
                    payment_date: new Date().toISOString()
                })
            }

            toast.success("Bill created successfully")
            navigate("/bills")
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create bill")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const showPaymentFields = formData.status === 'paid' || formData.status === 'partial'

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
                                <BreadcrumbPage>Create Bill</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Card className="mt-4 max-w-2xl mx-auto w-full">
                        <CardHeader>
                            <CardTitle>Create New Bill</CardTitle>
                            <CardDescription>Manually create a bill for a subscription</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subscription">Subscription *</Label>
                                    <Select value={formData.subscription} onValueChange={(v) => handleChange('subscription', v)}>
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

                                {(() => {
                                    const selectedSub = subscriptions.find(s => s.id.toString() === formData.subscription)
                                    const balance = selectedSub ? parseFloat(selectedSub.customer_advance_balance || '0') : 0

                                    if (balance > 0) {
                                        return (
                                            <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                                                <div className="flex">
                                                    <div className="ml-3">
                                                        <h3 className="text-sm font-medium text-blue-800">
                                                            Advance Balance Available
                                                        </h3>
                                                        <div className="mt-1 text-sm text-blue-700">
                                                            <p>
                                                                This customer has <strong>৳{balance.toFixed(2)}</strong> in advance balance.
                                                                {formData.status !== 'paid' && formData.status !== 'cancelled' ? (
                                                                    <span> It will be automatically applied to this bill (if pending/partial).</span>
                                                                ) : (
                                                                    <span> <strong>Note:</strong> Auto-deduction is skipped for Paid/Cancelled status.</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                })()}

                                <div className="space-y-2">
                                    <Label htmlFor="billing_period">Billing Period *</Label>
                                    <Select
                                        value={`${formData.billing_month}-${formData.billing_year}`}
                                        onValueChange={(v) => {
                                            const [month, year] = v.split('-')
                                            handleChange('billing_month', parseInt(month))
                                            handleChange('billing_year', parseInt(year))
                                        }}
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

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="package_price">Package Price *</Label>
                                        <Input
                                            id="package_price"
                                            type="number"
                                            step="0.01"
                                            value={formData.package_price}
                                            onChange={(e) => handleChange('package_price', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="other_charges">Other Charges</Label>
                                        <Input
                                            id="other_charges"
                                            type="number"
                                            step="0.01"
                                            value={formData.other_charges}
                                            onChange={(e) => handleChange('other_charges', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discount">Discount</Label>
                                        <Input
                                            id="discount"
                                            type="number"
                                            step="0.01"
                                            value={formData.discount}
                                            onChange={(e) => handleChange('discount', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="partial">Partial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Payment Fields - Show only if status is paid or partial */}
                                {showPaymentFields && (
                                    <div className="border-t pt-4 mt-4 space-y-4">
                                        <h3 className="font-semibold text-sm">Payment Details</h3>

                                        <div className="space-y-2">
                                            <Label htmlFor="payment_amount">Payment Amount (৳) *</Label>
                                            <Input
                                                id="payment_amount"
                                                type="number"
                                                step="0.01"
                                                value={formData.payment_amount}
                                                onChange={(e) => handleChange('payment_amount', e.target.value)}
                                                required={showPaymentFields}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="payment_method">Payment Method *</Label>
                                            <Select value={formData.payment_method} onValueChange={(v) => handleChange('payment_method', v)}>
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

                                        <div className="space-y-2">
                                            <Label htmlFor="transaction_id">Transaction ID (Optional)</Label>
                                            <Input
                                                id="transaction_id"
                                                value={formData.transaction_id}
                                                onChange={(e) => handleChange('transaction_id', e.target.value)}
                                                placeholder="Enter transaction ID"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="payment_notes">Payment Notes (Optional)</Label>
                                            <Input
                                                id="payment_notes"
                                                value={formData.payment_notes}
                                                onChange={(e) => handleChange('payment_notes', e.target.value)}
                                                placeholder="Enter payment notes"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => navigate("/bills")}>
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
