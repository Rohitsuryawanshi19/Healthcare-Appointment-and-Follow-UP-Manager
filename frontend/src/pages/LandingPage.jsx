import React from 'react';
import { PageTransition } from '../components/ui/PageTransition';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { SearchDoctorSection } from '../components/landing/SearchDoctorSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { PatientDoctorBenefitsSection } from '../components/landing/PatientDoctorBenefitsSection';
import { AiAssistanceSection } from '../components/landing/AiAssistanceSection';
import { CalendarSyncSection } from '../components/landing/CalendarSyncSection';
import { TrustSection } from '../components/landing/TrustSection';
import { CtaSection } from '../components/landing/CtaSection';
import { LandingFooter } from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <PageTransition className="min-h-screen flex flex-col bg-slate-50">
      {/* 1. Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Search/Find-a-Doctor CTA */}
        <SearchDoctorSection />

        {/* 4. How CareFlow Works */}
        <HowItWorksSection />

        {/* 5. Key Features */}
        <FeaturesSection />

        {/* 6 & 7. Patient Benefits & Doctor Benefits */}
        <PatientDoctorBenefitsSection />

        {/* 8. AI Clinical Assistance */}
        <AiAssistanceSection />

        {/* 9. Appointment & Calendar Sync */}
        <CalendarSyncSection />

        {/* 10. Trust & Verification */}
        <TrustSection />

        {/* 11. Final Call-to-Action */}
        <CtaSection />
      </main>

      {/* 12. Footer */}
      <LandingFooter />
    </PageTransition>
  );
}
