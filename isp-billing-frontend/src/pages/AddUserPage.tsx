import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowLeft, IconDeviceFloppy, IconUserPlus } from "@tabler/icons-react"
import { userService } from "@/services/api"
import { toast } from "sonner"

interface UserFormData {
    username: string
    email: string
    phone: string
    password: string
    password_confirm: string
    first_name: string
    last_name: string
    role: string
    status: string
}

export default function AddUserPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditMode = !!id

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<UserFormData>({
        username: "",
        email: "",
        phone: "",
        password: "",
        password_confirm: "",
        first_name: "",
        last_name: "",
        role: "staff",
        status: "active",
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (isEditMode) {
            fetchUserDetails()
        }
    }, [id])

    const fetchUserDetails = async () => {
        try {
            setLoading(true)
            const data = await userService.getUser(Number(id))
            setFormData({
                username: data.username,
                email: data.email,
                phone: data.phone || "",
                password: "",
                password_confirm: "",
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                role: data.role,
                status: data.status,
            })
        } catch (error: any) {
            console.error("Failed to fetch user details:", error)
            toast.error("Failed to load user details")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: keyof UserFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.username.trim()) {
            newErrors.username = "Username is required"
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format"
        }

        if (!isEditMode) {
            if (!formData.password) {
                newErrors.password = "Password is required"
            } else if (formData.password.length < 8) {
                newErrors.password = "Password must be at least 8 characters"
            }

            if (!formData.password_confirm) {
                newErrors.password_confirm = "Please confirm password"
            } else if (formData.password !== formData.password_confirm) {
                newErrors.password_confirm = "Passwords do not match"
            }
        } else {
            // In edit mode, only validate password if it's provided
            if (formData.password && formData.password.length < 8) {
                newErrors.password = "Password must be at least 8 characters"
            }

            if (formData.password && formData.password !== formData.password_confirm) {
                newErrors.password_confirm = "Passwords do not match"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error("Please fix the errors in the form")
            return
        }

        try {
            setLoading(true)

            const submitData: any = {
                username: formData.username,
                email: formData.email,
                phone: formData.phone || null,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role,
                status: formData.status,
            }

            if (isEditMode) {
                // Only include password if it's provided in edit mode
                if (formData.password) {
                    submitData.password = formData.password
                    submitData.password_confirm = formData.password_confirm
                }
                await userService.updateUser(Number(id), submitData)
                toast.success("User updated successfully")
            } else {
                submitData.password = formData.password
                submitData.password_confirm = formData.password_confirm
                await userService.createUser(submitData)
                toast.success("User created successfully")
            }

            navigate("/users")
        } catch (error: any) {
            console.error("Failed to save user:", error)
            if (error.response?.data) {
                const apiErrors = error.response.data
                const newErrors: Record<string, string> = {}
                Object.keys(apiErrors).forEach((key) => {
                    newErrors[key] = Array.isArray(apiErrors[key])
                        ? apiErrors[key][0]
                        : apiErrors[key]
                })
                setErrors(newErrors)
            }
            toast.error(isEditMode ? "Failed to update user" : "Failed to create user")
        } finally {
            setLoading(false)
        }
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
                                    <BreadcrumbLink href="/users">Users</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{isEditMode ? "Edit User" : "Create User"}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="max-w-4xl mx-auto w-full space-y-6 mt-4">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
                                <IconArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <IconUserPlus className="h-8 w-8" />
                                    {isEditMode ? "Edit User" : "Create New User"}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {isEditMode
                                        ? "Update user information and permissions"
                                        : "Add a new user to the system"}
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>User Information</CardTitle>
                                    <CardDescription>
                                        Enter the user's details and assign appropriate role
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Username */}
                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            Username <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="username"
                                            value={formData.username}
                                            onChange={(e) => handleChange("username", e.target.value)}
                                            placeholder="Enter username"
                                            disabled={isEditMode} // Username cannot be changed in edit mode
                                        />
                                        {errors.username && (
                                            <p className="text-sm text-destructive">{errors.username}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            Email <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            placeholder="user@example.com"
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            placeholder="+880 1234567890"
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-destructive">{errors.phone}</p>
                                        )}
                                    </div>

                                    {/* First Name & Last Name */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name">First Name</Label>
                                            <Input
                                                id="first_name"
                                                value={formData.first_name}
                                                onChange={(e) => handleChange("first_name", e.target.value)}
                                                placeholder="John"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name">Last Name</Label>
                                            <Input
                                                id="last_name"
                                                value={formData.last_name}
                                                onChange={(e) => handleChange("last_name", e.target.value)}
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    {/* Password Fields */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">
                                                Password {!isEditMode && <span className="text-destructive">*</span>}
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => handleChange("password", e.target.value)}
                                                placeholder={isEditMode ? "Leave blank to keep current" : "Enter password"}
                                            />
                                            {errors.password && (
                                                <p className="text-sm text-destructive">{errors.password}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password_confirm">
                                                Confirm Password {!isEditMode && <span className="text-destructive">*</span>}
                                            </Label>
                                            <Input
                                                id="password_confirm"
                                                type="password"
                                                value={formData.password_confirm}
                                                onChange={(e) => handleChange("password_confirm", e.target.value)}
                                                placeholder="Confirm password"
                                            />
                                            {errors.password_confirm && (
                                                <p className="text-sm text-destructive">{errors.password_confirm}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Role & Status */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="role">
                                                Role <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="staff">Staff</SelectItem>
                                                    <SelectItem value="accountant">Accountant</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.role && (
                                                <p className="text-sm text-destructive">{errors.role}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">
                                                Status <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <p className="text-sm text-destructive">{errors.status}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex gap-4 pt-4">
                                        <Button type="submit" disabled={loading}>
                                            <IconDeviceFloppy className="h-4 w-4 mr-2" />
                                            {loading ? "Saving..." : isEditMode ? "Update User" : "Create User"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate("/users")}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
