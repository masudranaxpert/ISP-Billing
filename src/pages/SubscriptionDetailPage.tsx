import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { subscriptionService, connectionFeeService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

function SubscriptionDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [subscription, setSubscription] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showFeeDialog, setShowFeeDialog] = useState(false)
    const [isSubmittingFee, setIsSubmittingFee] = useState(false)
    const [newFee, setNewFee] = useState({
        fee_type: "connection",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        is_paid: false,
        notes: ""
    })

    useEffect(() => {
        fetchSubscription()
    }, [id])

    const fetchSubscription = async () => {
        try {
            setLoading(true)
            const data = await subscriptionService.getSubscription(parseInt(id!))
            setSubscription(data)
        } catch (error) {
            toast.error("Failed to fetch subscription")
            navigate("/subscriptions")
        } finally {
            setLoading(false)
        }
    }

    const handleAddFee = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmittingFee(true)
            await connectionFeeService.createConnectionFee({
                subscription: parseInt(id!),
                ...newFee
            })
            toast.success("Fee added successfully")
            setShowFeeDialog(false)
            fetchSubscription() // Refresh data
            // Reset form
            setNewFee({
                fee_type: "connection",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                is_paid: false,
                notes: ""
            })
        } catch (error) {
            console.error(error)
            toast.error("Failed to add fee")
        } finally {
            setIsSubmittingFee(false)
        }
    }

    const handleDeleteFee = async (feeId: number) => {
        if (!confirm("Are you sure you want to delete this fee?")) return
        try {
            await connectionFeeService.deleteConnectionFee(feeId)
            toast.success("Fee deleted successfully")
            fetchSubscription()
        } catch (error) {
            toast.error("Failed to delete fee")
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!subscription) return null

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
                                <BreadcrumbLink href="/subscriptions">Subscriptions</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Subscription Details</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" onClick={() => navigate("/subscriptions")}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subscriptions
                        </Button>
                        <Button onClick={() => navigate(`/subscriptions/${id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Subscription
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Information</CardTitle>
                                <CardDescription>Basic details about the subscription</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Customer:</span>
                                    <span>{subscription.customer_name} ({subscription.customer_id_display})</span>

                                    <span className="font-medium text-muted-foreground">Status:</span>
                                    <span className="capitalize">{subscription.status}</span>

                                    <span className="font-medium text-muted-foreground">Start Date:</span>
                                    <span>{subscription.start_date}</span>

                                    <span className="font-medium text-muted-foreground">Billing Day:</span>
                                    <span>{subscription.billing_day}</span>

                                    <span className="font-medium text-muted-foreground">Next Billing:</span>
                                    <span>{subscription.next_billing_date}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Package & Router</CardTitle>
                                <CardDescription>Technical details and configuration</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Package:</span>
                                    <span>{subscription.package_name}</span>

                                    <span className="font-medium text-muted-foreground">Router:</span>
                                    <span>{subscription.router_name || 'N/A'}</span>

                                    <span className="font-medium text-muted-foreground">PPPoE Username:</span>
                                    <span className="font-mono bg-muted px-2 py-0.5 rounded">{subscription.mikrotik_username}</span>

                                    <span className="font-medium text-muted-foreground">PPPoE Password:</span>
                                    <span className="font-mono bg-muted px-2 py-0.5 rounded">{subscription.mikrotik_password || '********'}</span>

                                    <span className="font-medium text-muted-foreground">IP Address:</span>
                                    <span className="font-mono">{subscription.framed_ip_address || '-'}</span>

                                    <span className="font-medium text-muted-foreground">MAC Address:</span>
                                    <span className="font-mono">{subscription.mac_address || '-'}</span>

                                    <span className="font-medium text-muted-foreground">Sync Status:</span>
                                    <Badge variant={subscription.is_synced_to_mikrotik ? "secondary" : "destructive"}>
                                        {subscription.is_synced_to_mikrotik ? "Synced" : "Unsynced"}
                                    </Badge>

                                    {subscription.sync_error && (
                                        <>
                                            <span className="font-medium text-muted-foreground text-red-500">Error:</span>
                                            <span className="text-red-500 text-xs">{subscription.sync_error}</span>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Connection Fees</CardTitle>
                                <CardDescription>Manage connection and reconnection fees</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setShowFeeDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Fee
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subscription.connection_fees && subscription.connection_fees.length > 0 ? (
                                        subscription.connection_fees.map((fee: any) => (
                                            <TableRow key={fee.id}>
                                                <TableCell>{fee.date}</TableCell>
                                                <TableCell>{fee.fee_type_display}</TableCell>
                                                <TableCell>৳{fee.amount}</TableCell>
                                                <TableCell>
                                                    <Badge variant={fee.is_paid ? "outline" : "destructive"} className={fee.is_paid ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                                        {fee.is_paid ? "Paid" : "Unpaid"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={fee.notes}>
                                                    {fee.notes || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => handleDeleteFee(fee.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                No fees recorded
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Fee</DialogTitle>
                            <DialogDescription>
                                Add a connection or reconnection fee for this subscription.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddFee} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fee_type">Fee Type</Label>
                                <Select
                                    value={newFee.fee_type}
                                    onValueChange={(value) => setNewFee({ ...newFee, fee_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="connection">New Connection Fee</SelectItem>
                                        <SelectItem value="reconnection">Reconnection Fee</SelectItem>
                                        <SelectItem value="other">Other Fee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (৳)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    required
                                    value={newFee.amount}
                                    onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    required
                                    value={newFee.date}
                                    onChange={(e) => setNewFee({ ...newFee, date: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_paid"
                                    checked={newFee.is_paid}
                                    onCheckedChange={(checked) => setNewFee({ ...newFee, is_paid: checked as boolean })}
                                />
                                <Label htmlFor="is_paid">Mark as Paid</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={newFee.notes}
                                    onChange={(e) => setNewFee({ ...newFee, notes: e.target.value })}
                                    placeholder="Optional notes..."
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowFeeDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmittingFee}>
                                    {isSubmittingFee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Fee
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default SubscriptionDetailPage
