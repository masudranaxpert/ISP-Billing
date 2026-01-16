import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { discountService, customerService } from "@/services/api"
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

export default function AddDiscountPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])

    const [formData, setFormData] = useState({
        customer: "",
        amount: "",
        reason: ""
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
            await discountService.createDiscount({
                customer: parseInt(formData.customer),
                amount: parseFloat(formData.amount),
                reason: formData.reason
            })
            toast.success("Discount created successfully")
            navigate("/billing/discounts")
        } catch (error) {
            console.error(error)
            toast.error("Failed to create discount")
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
                                <BreadcrumbLink href="/billing/discounts">Discounts</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Create Discount</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Discount</CardTitle>
                            <CardDescription>Apply a discount to a customer</CardDescription>
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
                                    <Label>Reason</Label>
                                    <Input
                                        required
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => navigate("/billing/discounts")}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Discount
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
