import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Loader2, Clock, CheckCircle2, XCircle, History, Settings, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api/client"

// Helper function to format time until next run
const formatTimeUntil = (dateString: string | null) => {
    if (!dateString) return "Not scheduled"

    const now = new Date()
    const target = new Date(dateString)
    const diff = target.getTime() - now.getTime()

    if (diff < 0) return "Overdue"

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`
    return "in less than a minute"
}

// Helper function to format relative time
const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never"

    const now = new Date()
    const target = new Date(dateString)
    const diff = now.getTime() - target.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return "just now"
}

interface ScheduleConfig {
    job_id: string
    name: string
    description: string
    is_enabled: boolean
    interval_value: number
    interval_unit: string
    cron_expression: string | null
    schedule_time: string | null
    next_run_time: string | null
    last_run_time: string | null
    last_status: string | null
}

function SchedulePage() {
    const [configs, setConfigs] = useState<ScheduleConfig[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedConfig, setSelectedConfig] = useState<ScheduleConfig | null>(null)
    const [editForm, setEditForm] = useState({
        interval_value: 1,
        interval_unit: 'minutes',
        schedule_time: '',
        day_of_month: 1,
        is_enabled: true
    })

    useEffect(() => {
        fetchConfigs()
        fetchStats()

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchConfigs()
            fetchStats()
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const fetchConfigs = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/schedule-config/')
            const data = Array.isArray(response.data) ? response.data : (response.data.results || [])
            setConfigs(data)
        } catch (error) {
            console.error("Failed to fetch schedule configs", error)
            toast.error("Failed to load schedule configurations")
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await apiClient.get('/scheduler/stats/')
            setStats(response.data)
        } catch (error) {
            console.error("Failed to fetch stats", error)
        }
    }

    const handleEdit = (config: any) => {
        setSelectedConfig(config)

        // Determine initial mode based on API data
        // If it's MONTHLY (unit='months'), set defaults

        setEditForm({
            interval_value: config.interval_value || 1,
            interval_unit: config.interval_unit || 'minutes',
            schedule_time: config.schedule_time || '',
            day_of_month: config.day_of_month || 1,
            is_enabled: config.is_enabled
        })
        setEditDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selectedConfig) return

        try {
            await apiClient.patch(`/schedule-config/${selectedConfig.job_id}/`, editForm)
            toast.success("Schedule updated successfully")
            setEditDialogOpen(false)
            fetchConfigs()
        } catch (error) {
            console.error("Failed to update schedule", error)
            toast.error("Failed to update schedule")
        }
    }

    const handleToggle = async (jobId: string, currentStatus: boolean) => {
        try {
            await apiClient.post(`/schedule-config/${jobId}/toggle/`)
            toast.success(`Job ${currentStatus ? 'disabled' : 'enabled'} successfully`)
            fetchConfigs()
        } catch (error) {
            console.error("Failed to toggle job", error)
            toast.error("Failed to toggle job status")
        }
    }

    const getScheduleDisplay = (config: any) => {
        return config.schedule_display || "Not scheduled"
    }

    const getNextRunBadge = (nextRunTime: string | null) => {
        if (!nextRunTime) {
            return <Badge variant="secondary">Not Scheduled</Badge>
        }

        const timeUntil = formatTimeUntil(nextRunTime)

        return (
            <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {timeUntil}
            </Badge>
        )
    }

    const getStatusBadge = (status: string | null, isEnabled: boolean) => {
        if (!isEnabled) {
            return <Badge variant="secondary">Disabled</Badge>
        }

        if (!status) return <Badge variant="secondary">Never Run</Badge>

        if (status === 'Success') {
            return (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Success
                </Badge>
            )
        }

        return (
            <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Failed
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
                                    <BreadcrumbPage>Schedule Management</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            fetchConfigs()
                            fetchStats()
                            toast.success("Refreshed")
                        }}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid gap-4 md:grid-cols-4 mt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_jobs}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                                    <History className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_executions}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Successful</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{stats.successful_executions}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">{stats.failed_executions}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Jobs Table */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Scheduled Jobs</CardTitle>
                            <CardDescription>
                                Configure when and how often background tasks should run
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Job Name</TableHead>
                                                <TableHead>Schedule</TableHead>
                                                <TableHead>Next Run</TableHead>
                                                <TableHead>Last Run</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {configs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                        No scheduled jobs found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                configs.map((config: any) => (
                                                    <TableRow key={config.job_id}>
                                                        <TableCell>
                                                            <div className="font-medium">{config.name}</div>
                                                            <div className="text-sm text-muted-foreground">{config.description}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                {getScheduleDisplay(config)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{getNextRunBadge(config.next_run_time)}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {formatRelativeTime(config.last_run_time)}
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(config.last_status, config.is_enabled)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Switch
                                                                    checked={config.is_enabled}
                                                                    onCheckedChange={() => handleToggle(config.job_id, config.is_enabled)}
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(config)}
                                                                >
                                                                    <Settings className="h-4 w-4" />
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
            </SidebarInset>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Configure Schedule</DialogTitle>
                        <DialogDescription>
                            {selectedConfig?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* 1. Schedule Mode Selection */}
                        <div className="grid gap-3">
                            <Label>Schedule Mode</Label>

                            {/* Special handling for Bill Generation Job - Locked to Monthly */}
                            {selectedConfig?.job_id === 'generate_monthly_bills' ? (
                                <div className="border p-3 rounded-md bg-primary/10 ring-1 ring-primary flex items-center">
                                    <input
                                        type="radio"
                                        checked
                                        readOnly
                                        className="h-4 w-4 text-primary mr-2"
                                    />
                                    <span className="text-sm font-medium">Monthly (Required for Billing Cycle)</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3 border p-3 rounded-md bg-muted/20">
                                    {/* Option 1: Interval */}
                                    <label className={`flex items-center cursor-pointer p-2 rounded-md transition-colors ${editForm.interval_unit !== 'days' && editForm.interval_unit !== 'months' ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                                        <input
                                            type="radio"
                                            name="schedule_mode"
                                            className="h-4 w-4 text-primary mr-2"
                                            checked={editForm.interval_unit !== 'days' && editForm.interval_unit !== 'months'}
                                            onChange={() => setEditForm(prev => ({
                                                ...prev,
                                                interval_unit: 'minutes',
                                                interval_value: 1,
                                                schedule_time: ''
                                            }))}
                                        />
                                        <span className="text-sm font-medium">Recurring</span>
                                    </label>

                                    {/* Option 2: Daily */}
                                    <label className={`flex items-center cursor-pointer p-2 rounded-md transition-colors ${editForm.interval_unit === 'days' ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                                        <input
                                            type="radio"
                                            name="schedule_mode"
                                            className="h-4 w-4 text-primary mr-2"
                                            checked={editForm.interval_unit === 'days'}
                                            onChange={() => setEditForm(prev => ({
                                                ...prev,
                                                interval_unit: 'days',
                                                interval_value: 1,
                                                schedule_time: '00:00'
                                            }))}
                                        />
                                        <span className="text-sm font-medium">Daily</span>
                                    </label>

                                    {/* Option 3: Monthly */}
                                    <label className={`flex items-center cursor-pointer p-2 rounded-md transition-colors ${editForm.interval_unit === 'months' ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                                        <input
                                            type="radio"
                                            name="schedule_mode"
                                            className="h-4 w-4 text-primary mr-2"
                                            checked={editForm.interval_unit === 'months'}
                                            onChange={() => setEditForm(prev => ({
                                                ...prev,
                                                interval_unit: 'months',
                                                interval_value: 1,
                                                day_of_month: 1,
                                                schedule_time: '00:00'
                                            }))}
                                        />
                                        <span className="text-sm font-medium">Monthly</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* 2. Dynamic Fields based on Mode */}
                        <div className="min-h-[120px]">
                            {/* CASE: Monthly Mode */}
                            {(editForm.interval_unit === 'months' || selectedConfig?.job_id === 'generate_monthly_bills') && (
                                <div className="grid gap-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="day_of_month">Run on Day of Month</Label>
                                            <Input
                                                id="day_of_month"
                                                type="number"
                                                min="1"
                                                max="28" // Safer max for billing
                                                value={editForm.day_of_month}
                                                onChange={(e) => setEditForm({ ...editForm, day_of_month: parseInt(e.target.value) || 1 })}
                                            />
                                            <p className="text-[10px] text-muted-foreground">Recommend: 1-28</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="schedule_time">At Time</Label>
                                            <Input
                                                id="schedule_time"
                                                type="time"
                                                value={editForm.schedule_time}
                                                onChange={(e) => setEditForm({ ...editForm, schedule_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {selectedConfig?.job_id === 'generate_monthly_bills' && (
                                        <div className="rounded bg-yellow-50 p-2 border border-yellow-200 text-xs text-yellow-800">
                                            ⚠️ This job will generate bills for the <strong>current month</strong> when it runs. Ensure the date is appropriate (e.g., 1st of month).
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CASE: Daily Mode - Hidden for monthly_bills */}
                            {editForm.interval_unit === 'days' && selectedConfig?.job_id !== 'generate_monthly_bills' && (
                                <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
                                    <Label htmlFor="schedule_time">Run Daily At</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="schedule_time"
                                            type="time"
                                            className="text-lg w-full"
                                            value={editForm.schedule_time}
                                            onChange={(e) => setEditForm({ ...editForm, schedule_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* CASE: Interval Mode */}
                            {editForm.interval_unit !== 'days' && editForm.interval_unit !== 'months' && (
                                <div className="grid gap-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="interval_value">Run Every</Label>
                                            <Input
                                                id="interval_value"
                                                type="number"
                                                min="1"
                                                value={editForm.interval_value}
                                                onChange={(e) => setEditForm({ ...editForm, interval_value: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="interval_unit">Unit</Label>
                                            <Select
                                                value={editForm.interval_unit}
                                                onValueChange={(value) => setEditForm({ ...editForm, interval_unit: value })}
                                            >
                                                <SelectTrigger id="interval_unit">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="seconds">Seconds</SelectItem>
                                                    <SelectItem value="minutes">Minutes</SelectItem>
                                                    <SelectItem value="hours">Hours</SelectItem>
                                                    <SelectItem value="weeks">Weeks</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Enable Switch */}
                        <div className="flex items-center justify-between border-t pt-4">
                            <Label htmlFor="is_enabled" className="text-base">Enable Job</Label>
                            <Switch
                                id="is_enabled"
                                checked={editForm.is_enabled}
                                onCheckedChange={(checked) => setEditForm({ ...editForm, is_enabled: checked })}
                            />
                        </div>

                        {/* 4. Info Box */}
                        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground border">
                            <p className="font-semibold mb-1 text-primary">
                                {editForm.interval_unit === 'months' ? "📅 Monthly Schedule (Cron)" :
                                    editForm.interval_unit === 'days' ? "🌞 Daily Schedule (Cron)" :
                                        "⏳ Recurring Interval"}
                            </p>
                            <p>
                                {editForm.interval_unit === 'months' && editForm.day_of_month && editForm.schedule_time && (
                                    <>Will run <strong>on Day {editForm.day_of_month} of every month at {new Date(`2000-01-01T${editForm.schedule_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong></>
                                )}
                                {editForm.interval_unit === 'days' && editForm.schedule_time && (
                                    <>Will run <strong>every day at {new Date(`2000-01-01T${editForm.schedule_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong></>
                                )}
                                {editForm.interval_unit !== 'days' && editForm.interval_unit !== 'months' && (
                                    <>Will run <strong>every {editForm.interval_value} {editForm.interval_unit}</strong> starting from the last execution time.</>
                                )}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    )
}

export default SchedulePage
