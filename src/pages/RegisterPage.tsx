import { SignupForm } from "@/components/auth/signup-form"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <div className="flex-1 flex w-full items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <SignupForm />
                </div>
            </div>
            <Footer />
        </div>
    )
}
