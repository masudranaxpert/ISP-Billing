import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { subscriptionService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Pencil } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

function SubscriptionDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [subscription, setSubscription] = useState<any>(null)
    const [loading, setLoading] = useState(true)

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

                                    <span className="font-medium text-muted-foreground">Connection Fee:</span>
                                    <span>৳{subscription.connection_fee || '0.00'}</span>

                                    <span className="font-medium text-muted-foreground">Reconnection Fee:</span>
                                    <span>৳{subscription.reconnection_fee || '0.00'}</span>
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
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default SubscriptionDetailPage
