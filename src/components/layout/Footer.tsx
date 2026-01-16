import { Zap } from "lucide-react"

const Footer = () => {
    return (
        <footer className="py-12 border-t bg-background">
            <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-bold text-lg">NetBillPro</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Simplifying ISP management with intelligent automation and billing.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">Features</a></li>
                            <li><a href="#" className="hover:text-primary">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary">Changelog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">About</a></li>
                            <li><a href="#" className="hover:text-primary">Blog</a></li>
                            <li><a href="#" className="hover:text-primary">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">Privacy</a></li>
                            <li><a href="#" className="hover:text-primary">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} NetBillPro. All rights reserved.
                </div>
            </div>
        </footer>
    )
}

export default Footer
