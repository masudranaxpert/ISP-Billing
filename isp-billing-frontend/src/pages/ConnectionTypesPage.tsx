import { useEffect, useState } from "react"
import { customerService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
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

function ConnectionTypesPage() {
    const [types, setTypes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Dialog State
    const [showDialog, setShowDialog] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
    })

    useEffect(() => {
        fetchTypes()
    }, [])

    const fetchTypes = async () => {
        try {
            setLoading(true)
            const response = await customerService.getConnectionTypes()
            setTypes(response.results || [])
        } catch (error) {
            console.error("Failed to fetch connection types", error)
            toast.error("Failed to load connection types")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (type?: any) => {
        if (type) {
            setEditingId(type.id)
            setFormData({
                name: type.name,
                code: type.code || "",
                description: type.description || "",
            })
        } else {
            setEditingId(null)
            setFormData({
                name: "",
                code: "",
                description: "",
            })
        }
        setShowDialog(true)
    }

    const handleToggleStatus = async (type: any, checked: boolean) => {
        const newStatus = checked ? 'active' : 'inactive'
        try {
            await customerService.updateConnectionType(type.id, { status: newStatus })
            toast.success(`Connection type ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
            fetchTypes()
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (editingId) {
                await customerService.updateConnectionType(editingId, formData)
                toast.success("Connection type updated successfully")
            } else {
                await customerService.createConnectionType(formData)
                toast.success("Connection type created successfully")
            }
            setShowDialog(false)
            fetchTypes()
        } catch (error: any) {
            console.error(error)
            toast.error("Failed to save connection type")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete connection type "${name}"?`)) return

        try {
            await customerService.deleteConnectionType(id)
            toast.success("Connection type deleted successfully!")
            fetchTypes()
        } catch (error) {
            toast.error("Failed to delete connection type. It may be in use.")
        }
    }

    const filteredTypes = types.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.code && t.code.toLowerCase().includes(searchTerm.toLowerCase()))
    )

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
                                    <BreadcrumbPage>Connection Types</BreadcrumbPage>
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
                                    <CardTitle>Connection Types</CardTitle>
                                    <CardDescription>
                                        Manage internet connection types (e.g., PPPoE, Optical Fiber)
                                    </CardDescription>
                                </div>
                                <Button
                                    className="cursor-pointer"
                                    onClick={() => handleOpenDialog()}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Type
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search types..."
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
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Total Customers</TableHead>
                                                <TableHead>Active Customers</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTypes.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={7}
                                                        className="text-center py-8 text-muted-foreground"
                                                    >
                                                        No connection types found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredTypes.map((type) => (
                                                    <TableRow key={type.id}>
                                                        <TableCell>{type.code || "-"}</TableCell>
                                                        <TableCell className="font-medium">
                                                            {type.name}
                                                        </TableCell>
                                                        <TableCell>{type.description || "-"}</TableCell>
                                                        <TableCell>{type.customer_count || 0}</TableCell>
                                                        <TableCell>{type.active_customer_count || 0}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={type.status === 'active'}
                                                                    onCheckedChange={(checked) => handleToggleStatus(type, checked)}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleOpenDialog(type)}
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(type.id, type.name)}
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
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Connection Type" : "Add Connection Type"}</DialogTitle>
                            <DialogDescription>
                                {editingId ? "Update existing connection type details" : "Create a new connection type"}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., PPPoE, Static IP"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., PPPOE, STATIC"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Optional description..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingId ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default ConnectionTypesPage
