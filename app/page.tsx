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
  const isAuthenticated = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar isAuthenticated={isAuthenticated} />
      <main className="flex-1">
        <Hero isAuthenticated={isAuthenticated} />
        <Features />
        <TrustedCompanies />
        <HowItWorks />
      </main>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}
