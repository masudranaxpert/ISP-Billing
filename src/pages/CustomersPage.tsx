import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { customerService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, Eye, Pencil, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function CustomersPage() {
    const navigate = useNavigate()
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchCustomers()
    }, [page, searchTerm])

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            const params: any = { page }
            if (searchTerm) {
                params.search = searchTerm
            }
            const response = await customerService.getCustomers(params)
            setCustomers(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            console.error("Failed to fetch customers", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: any = {
            active: "default",
            suspended: "destructive",
            inactive: "secondary",
            closed: "outline",
        }
        return (
            <Badge variant={variants[status] || "secondary"}>
                {status?.toUpperCase()}
            </Badge>
        )
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4">
                    <div className="flex items-center gap-2 flex-1">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Customers</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Card className="mt-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Customers</CardTitle>
                                    <CardDescription>
                                        Manage your ISP customers and their subscriptions
                                    </CardDescription>
                                </div>
                                <Button
                                    className="cursor-pointer"
                                    onClick={() => navigate("/customers/add")}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Customer
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search customers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Customer ID</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Phone</TableHead>
                                                    <TableHead>Zone</TableHead>
                                                    <TableHead>Connection Type</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {customers.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={7}
                                                            className="text-center py-8 text-muted-foreground"
                                                        >
                                                            No customers found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    customers.map((customer) => (
                                                        <TableRow key={customer.id}>
                                                            <TableCell className="font-medium">
                                                                {customer.customer_id}
                                                            </TableCell>
                                                            <TableCell>{customer.name}</TableCell>
                                                            <TableCell>{customer.phone}</TableCell>
                                                            <TableCell>{customer.zone_name || "-"}</TableCell>
                                                            <TableCell>
                                                                {customer.connection_type_display}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(customer.status)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => navigate(`/customers/${customer.id}`)}
                                                                        title="View"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => navigate(`/customers/${customer.id}`)}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            if (confirm(`Delete customer ${customer.name}?`)) {
                                                                                // Delete logic here
                                                                            }
                                                                        }}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page - 1)}
                                                disabled={page === 1}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                Page {page} of {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page + 1)}
                                                disabled={page === totalPages}
                                            >
                                                Next
                                            </Button>
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

export default CustomersPage
