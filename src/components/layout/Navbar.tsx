import { Link } from "react-router-dom"
import { Menu, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const Navbar = () => {
    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex items-center justify-between h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">NetBill<span className="text-primary">Pro</span></span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6">
                    <a href="/#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
                    <a href="/#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
                    <a href="/#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
                    <a href="/#faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</a>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <ModeToggle />

                    <Button variant="ghost" asChild className="cursor-pointer">
                        <Link to="/login">Login</Link>
                    </Button>

                    <Button asChild className="cursor-pointer">
                        <Link to="/register">Get Started</Link>
                    </Button>
                </div>

                {/* Mobile Menu */}
                <div className="flex md:hidden items-center gap-4">
                    <ModeToggle />
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <div className="flex flex-col gap-4 mt-8">
                                <a href="/#features" className="text-lg font-medium">Features</a>
                                <a href="/#pricing" className="text-lg font-medium">Pricing</a>
                                <a href="/#testimonials" className="text-lg font-medium">Testimonials</a>
                                <a href="/#faq" className="text-lg font-medium">FAQ</a>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Button variant="outline" asChild className="w-full cursor-pointer">
                                        <Link to="/login">Login</Link>
                                    </Button>

                                    <Button asChild className="w-full cursor-pointer">
                                        <Link to="/register">Get Started</Link>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
