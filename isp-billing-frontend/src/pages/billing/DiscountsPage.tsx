import { useEffect, useState } from "react"
import { discountService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

function DiscountsPage() {
    const navigate = useNavigate()
    const [discounts, setDiscounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchDiscounts()
    }, [page])

    const fetchDiscounts = async () => {
        try {
            setLoading(true)
            const response = await discountService.getDiscounts({ page })
            setDiscounts(response.results || [])
            setTotalPages(Math.ceil((response.count || 0) / 20))
        } catch (error) {
            toast.error("Failed to load discounts")
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
                            <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem><BreadcrumbPage>Discounts</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Discounts</CardTitle>
                                    <CardDescription>Manage discount offers</CardDescription>
                                </div>
                                <Button onClick={() => navigate("/billing/discounts/add")}><Plus className="mr-2 h-4 w-4" />Add Discount</Button>
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
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Value</TableHead>
                                                    <TableHead>Apply To</TableHead>
                                                    <TableHead>Start Date</TableHead>
                                                    <TableHead>End Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {discounts.length === 0 ? (
                                                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No discounts found</TableCell></TableRow>
                                                ) : (
                                                    discounts.map((discount) => (
                                                        <TableRow key={discount.id}>
                                                            <TableCell className="font-medium">{discount.name}</TableCell>
                                                            <TableCell>{discount.discount_type_display}</TableCell>
                                                            <TableCell>{discount.discount_value}{discount.discount_type === 'percentage' ? '%' : '৳'}</TableCell>
                                                            <TableCell>{discount.apply_to_display}</TableCell>
                                                            <TableCell>{discount.start_date}</TableCell>
                                                            <TableCell>{discount.end_date || "-"}</TableCell>
                                                            <TableCell><Badge variant={discount.is_active ? "default" : "secondary"}>{discount.is_active ? "ACTIVE" : "INACTIVE"}</Badge></TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" onClick={async () => { if (confirm("Delete?")) { await discountService.deleteDiscount(discount.id); fetchDiscounts(); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default DiscountsPage
