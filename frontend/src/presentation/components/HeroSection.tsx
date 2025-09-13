'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { motion, AnimatePresence } from 'motion/react';
import { Listing } from '@/lib/api/listings';

export function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [dynamicTexts, setDynamicTexts] = useState([
    {
      title: "Autos seminuevos, precios justos.",
      description: "Compra y vende autos seminuevos de manera simple, transparente y sin complicaciones."
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        // Fetch both listings and hero content in parallel
        const [listingsResponse, heroResponse] = await Promise.all([
          fetch(`${API_URL}/listings`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`${API_URL}/hero-content/active`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
        ]);

        // Process listings for images
        if (listingsResponse.ok) {
          const listings: Listing[] = await listingsResponse.json();
          const images = listings
            .filter(listing => listing.images && listing.images.length > 0)
            .map(listing => listing.images![0])
            .slice(0, 6);
          setVehicleImages(images);
        }

        // Process hero content
        if (heroResponse.ok) {
          const heroContents = await heroResponse.json();
          if (heroContents.length > 0) {
            setDynamicTexts(heroContents.map((content: { title: string; description: string }) => ({
              title: content.title,
              description: content.description
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback
        setVehicleImages(['/placeholder-car.jpg']);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (vehicleImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % vehicleImages.length
      );
    }, 4000); // Cambiar cada 4 segundos

    return () => clearInterval(interval);
  }, [vehicleImages]);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        (prevIndex + 1) % dynamicTexts.length
      );
    }, 5000); // Cambiar texto cada 5 segundos

    return () => clearInterval(textInterval);
  }, [dynamicTexts.length]);

  return (
    <Box
      style={{
        position: 'relative',
        color: 'white',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Carousel Background */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      >
        {!loading && vehicleImages.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${vehicleImages[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </AnimatePresence>
        )}
      </Box>

      {/* Background Overlay */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(135deg, 
              rgba(0, 0, 0, 0.3) 0%, 
              rgba(0, 0, 0, 0.4) 50%, 
              rgba(0, 0, 0, 0.5) 100%
            )
          `,
          zIndex: 2,
        }}
      />

      {/* Content */}
      <Box style={{ position: 'relative', zIndex: 3, width: '100%' }}>
        <Box
          style={{
            paddingTop: '80px',
            paddingLeft: 'clamp(20px, 5vw, 80px)',
            paddingRight: 'clamp(20px, 5vw, 80px)',
            minHeight: 'calc(85vh - 140px)',
            width: '100%',
            maxWidth: '1200px',
            margin: '0',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              width: '100%',
              maxWidth: '900px',
            }}
          >
            <Stack align="flex-start" gap={0} style={{ textAlign: 'left', position: 'relative' }}>
              {/* Title Animation */}
              <div style={{ position: 'relative', width: '100%', minHeight: 'clamp(70px, 12vw, 130px)' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`title-${currentTextIndex}`}
                    initial={{ 
                      opacity: 0, 
                      filter: 'blur(8px)',
                      y: 20
                    }}
                    animate={{ 
                      opacity: 1, 
                      filter: 'blur(0px)',
                      y: 0
                    }}
                    exit={{ 
                      opacity: 0, 
                      filter: 'blur(6px)',
                      y: -10
                    }}
                    transition={{ 
                      duration: 0.8,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 0.1
                    }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      left: 0,
                      top: 0
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 'clamp(1.5rem, 5vw, 3.5rem)',
                        fontWeight: 600,
                        lineHeight: 0.85,
                        color: '#16a34a',
                        margin: 0,
                        textAlign: 'left',
                      }}
                      className="readex-pro-semibold"
                    >
                      {dynamicTexts[currentTextIndex].title}
                    </Text>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Description Animation */}
              <div style={{ position: 'relative', width: '100%', minHeight: 'clamp(90px, 18vw, 150px)', marginTop: '1rem' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`desc-${currentTextIndex}`}
                    initial={{ 
                      opacity: 0, 
                      filter: 'blur(8px)',
                      y: 25
                    }}
                    animate={{ 
                      opacity: 1, 
                      filter: 'blur(0px)',
                      y: 0
                    }}
                    exit={{ 
                      opacity: 0, 
                      filter: 'blur(6px)',
                      y: -15
                    }}
                    transition={{ 
                      duration: 0.9,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 0.3
                    }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      left: 0,
                      top: 0
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 'clamp(1rem, 3vw, 1.8rem)',
                        lineHeight: 1.1,
                        color: 'white',
                        margin: 0,
                        maxWidth: '700px',
                        textAlign: 'left',
                      }}
                      className="roboto-regular"
                    >
                      {dynamicTexts[currentTextIndex].description}
                    </Text>
                  </motion.div>
                </AnimatePresence>
              </div>

            <Group gap="md" mt={40}>
              <Button
                size="lg"
                color="cliquealow-green"
                radius="md"
                px={30}
                styles={{
                  root: {
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(34, 197, 94, 0.25)',
                    },
                  },
                }}
              >
                Explorar Autos
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                color="white"
                radius="md"
                px={30}
                styles={{
                  root: {
                    borderColor: 'rgba(255,255,255,0.8)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white',
                      transform: 'translateY(-2px)',
                    },
                  },
                }}
              >
                Vender Auto
              </Button>
            </Group>

            <Text
              size="lg"
              c="rgba(255,255,255,0.8)"
              mt={32}
              style={{ fontSize: '1.1rem' }}
            >
              Desliza para explorar
            </Text>

            {/* Carousel Indicators */}
            {!loading && vehicleImages.length > 1 && (
              <Group gap="xs" mt="sm">
                {vehicleImages.map((_, index) => (
                  <motion.div
                    key={index}
                    animate={{
                      scale: currentImageIndex === index ? 1.2 : 1,
                      backgroundColor: currentImageIndex === index ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      cursor: 'pointer',
                    }}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </Group>
            )}
          </Stack>
        </motion.div>
        </Box>
      </Box>
    </Box>
  );
}