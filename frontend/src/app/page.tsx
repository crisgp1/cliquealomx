import { Box } from '@mantine/core';
import { HeroSection, EmptyCatalog, Footer } from '@/presentation/components';

export default function Home() {
  return (
    <Box>
      <HeroSection />
      <EmptyCatalog />
      <Footer />
    </Box>
  );
}
