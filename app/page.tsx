import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import Features from "@/components/marketing/Features";
import TrustedCompanies from "@/components/marketing/TrustedCompanies";
import HowItWorks from "@/components/marketing/HowItWorks";
import Footer from "@/components/marketing/Footer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <TrustedCompanies />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
