import { Button } from "@/components/ui/button"
import { Shield, BarChart3, Receipt, Server, Phone, CheckCircle2, Zap, Rocket } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

const Hero = () => {
    return (
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-32 md:pb-48">
            <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col items-center text-center gap-8">
                    <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-primary" /> The Future of ISP Billing is Here
                    </Badge>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Automate Your <span className="text-primary">ISP Business</span> <br className="hidden md:block" /> with Precision
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                        A complete billing and management solution tailored for Internet Service Providers.
                        Automate invoicing, manage subscribers, and scale your network effortlessly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Button size="lg" className="h-12 px-8 text-base cursor-pointer">Start Free Trial</Button>
                        <Button variant="outline" size="lg" className="h-12 px-8 text-base cursor-pointer">Schedule Demo</Button>
                    </div>

                    {/* Dashboard Preview Mockup (Abstract representation) */}
                    <div className="mt-16 w-full max-w-5xl rounded-xl border bg-card text-card-foreground shadow-2xl overflow-hidden aspect-video relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-background/5 opacity-50"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-bold text-4xl">
                            Dashboard Application Preview
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

const Features = () => {
    const features = [
        {
            icon: <Receipt className="h-8 w-8 text-primary" />,
            title: "Automated Billing",
            description: "Generate and send invoices automatically via SMS and Email. Never miss a payment cycle."
        },
        {
            icon: <Server className="h-8 w-8 text-primary" />,
            title: "MikroTik Integration",
            description: "Seamlessly integrate with MikroTik routers for auto-suspension and bandwidth management."
        },
        {
            icon: <BarChart3 className="h-8 w-8 text-primary" />,
            title: "Advanced Analytics",
            description: "Gain insights into your revenue updates, active users, and business growth with real-time reports."
        },
        {
            icon: <Shield className="h-8 w-8 text-primary" />,
            title: "Secure & Reliable",
            description: "Enterprise-grade security with daily backups to keep your subscriber data safe."
        },
        {
            icon: <Phone className="h-8 w-8 text-primary" />,
            title: "Customer Portal",
            description: "Self-service portal for customers to pay bills, view usage, and request support tickets."
        },
        {
            icon: <Zap className="h-8 w-8 text-primary" />,
            title: "Instant Activation",
            description: "Provision new connections instantly upon payment confirmation. Zero manual delay."
        }
    ]

    return (
        <section id="features" className="py-24 bg-muted/50">
            <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to run your ISP</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Streamline your operations with our comprehensive suite of tools designed for modern ISPs.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="mb-4 inline-block p-3 bg-primary/10 rounded-xl w-fit">
                                    {feature.icon}
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

const Pricing = () => {
    return (
        <section id="pricing" className="py-24">
            <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Choose the plan that fits your business scale. No hidden fees.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Starter Plan */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-xl">Starter</CardTitle>
                            <CardDescription>Perfect for small local ISPs</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$49</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Up to 500 Subscribers</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">1 MikroTik Router</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Basic Support</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full cursor-pointer" variant="outline">Get Started</Button>
                        </CardFooter>
                    </Card>

                    {/* Pro Plan */}
                    <Card className="flex flex-col relative border-primary shadow-lg scale-105 z-10">
                        <div className="absolute top-0 right-0 p-2">
                            <Badge className="bg-primary hover:bg-primary">Popular</Badge>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl">Professional</CardTitle>
                            <CardDescription>For growing networks</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$99</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Up to 2,000 Subscribers</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span className="text-sm">5 MikroTik Routers</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span className="text-sm">Priority Support</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span className="text-sm">SMS Gateway Integration</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full cursor-pointer">Get Started</Button>
                        </CardFooter>
                    </Card>

                    {/* Enterprise Plan */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-xl">Enterprise</CardTitle>
                            <CardDescription>For large scale operations</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$299</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Unlimited Subscribers</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Unlimited Routers</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">24/7 Dedicated Support</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Custom Integrations</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full cursor-pointer" variant="outline">Contact Sales</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const FAQ = () => {
    return (
        <section id="faq" className="py-24 bg-muted/50">
            <div className="container px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Does it work with any MikroTik router?</AccordionTrigger>
                        <AccordionContent>
                            Yes, NetBillPro helps you manage any standard MikroTik RouterOS device. We support API integration for seamless control.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Can I import existing users?</AccordionTrigger>
                        <AccordionContent>
                            Absolutely. We provide a bulk import tool (CSV/Excel) so you can migrate your existing customer database in minutes.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Is payment gateway integration included?</AccordionTrigger>
                        <AccordionContent>
                            Yes, we support popular local and international payment gateways like Stripe, PayPal, BKash, etc.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>
    )
}

function LandingPage() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
            <Navbar />
            <main>
                <Hero />
                <Features />
                <Pricing />
                <FAQ />
            </main>
            <Footer />
        </div>
    )
}

export default LandingPage
