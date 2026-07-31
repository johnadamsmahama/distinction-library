import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Features from '@/components/Features';
import PeerTutors from '@/components/PeerTutors';
import HowItWorks from '@/components/HowItWorks';
import FoundersNote from '@/components/FoundersNote';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <PeerTutors />
      <HowItWorks />
      <FoundersNote />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
