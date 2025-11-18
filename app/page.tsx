import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      redirect("/dashboard");
    }
  } catch (error) {
    // If auth check fails, show landing page
    console.error("Auth check error:", error);
  }

  return <LandingPage />;
}

