import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { advancePaymentService, customerService } from "@/services/api"
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

export default function AddAdvancePaymentPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = !!id

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])

    const [formData, setFormData] = useState({
        customer: "",
        amount: "",
        payment_method: "cash",
        payment_date: new Date().toISOString().split('T')[0],
        notes: ""
    })

    useEffect(() => {
        fetchCustomers()
        if (isEditMode) {
            fetchPayment()
        }
    }, [id])

    const fetchCustomers = async () => {
        try {
            const data = await customerService.getCustomers({ status: 'active' })
            setCustomers(data.results || [])
        } catch (error) {
            toast.error("Failed to load customers")
        }
    }

    const fetchPayment = async () => {
        if (!id) return
        try {
            setLoading(true)
            const data = await advancePaymentService.getAdvancePayment(parseInt(id))
            setFormData({
                customer: data.customer.toString(),
                amount: data.amount.toString(),
                payment_method: data.payment_method,
                payment_date: data.payment_date.split('T')[0],
                notes: data.notes || ""
            })
        } catch (error) {
            toast.error("Failed to load advance payment details")
            navigate("/billing/advance-payments")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                customer: parseInt(formData.customer),
                amount: parseFloat(formData.amount),
                payment_method: formData.payment_method,
                payment_date: formData.payment_date,
                notes: formData.notes
            }

            if (isEditMode && id) {
                await advancePaymentService.updateAdvancePayment(parseInt(id), payload)
                toast.success("Advance Payment updated successfully")
            } else {
                const response = await advancePaymentService.createAdvancePayment(payload)
                toast.success(response.message || "Advance Payment recorded successfully")
            }
            navigate("/billing/advance-payments")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to save advance payment")
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
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/billing/advance-payments">Advance Payments</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{isEditMode ? 'Edit' : 'Record'} Advance Payment</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>{isEditMode ? 'Edit' : 'Record'} Advance Payment</CardTitle>
                            <CardDescription>{isEditMode ? 'Update existing' : 'Record new'} advance payment from a customer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Customer</Label>
                                    <Select
                                        value={formData.customer}
                                        onValueChange={(value) => setFormData({ ...formData, customer: value })}
                                        disabled={isEditMode} // Disable customer change in edit mode for safety
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name} ({c.customer_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Amount</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payment Method</Label>
                                        <Select
                                            value={formData.payment_method}
                                            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select method" />
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
                                </div>

                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Input
                                        placeholder="Optional notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => navigate("/billing/advance-payments")}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isEditMode ? 'Update' : 'Record'} Payment
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
