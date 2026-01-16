import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])

    const [formData, setFormData] = useState({
        customer: "",
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        notes: ""
    })

    useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        try {
            const data = await customerService.getCustomers({ status: 'active' })
            setCustomers(data.results || [])
        } catch (error) {
            toast.error("Failed to load customers")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await advancePaymentService.createAdvancePayment({
                customer: parseInt(formData.customer),
                amount: parseFloat(formData.amount),
                payment_date: formData.payment_date,
                notes: formData.notes
            })
            toast.success("Advance Payment recorded successfully")
            navigate("/billing/advance-payments")
        } catch (error) {
            console.error(error)
            toast.error("Failed to record advance payment")
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
                                <BreadcrumbPage>Record Advance Payment</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Record Advance Payment</CardTitle>
                            <CardDescription>Record an advance payment from a customer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Customer</Label>
                                    <Select
                                        value={formData.customer}
                                        onValueChange={(value) => setFormData({ ...formData, customer: value })}
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
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            required
                                            value={formData.payment_date}
                                            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                        />
                                    </div>
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
                                        Record Payment
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
