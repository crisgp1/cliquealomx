'use client';

import {
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';

export function HeroSection() {
  return (
    <Box
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container size="xl" py={{ base: 60, md: 100 }}>
        <Stack align="center" gap="xl">
          <Stack align="center" gap="md" ta="center">
            <Title
              size={{ base: 'h1', md: 52 }}
              fw={700}
              lh={1.2}
              maw={800}
            >
              Cliquéalo.mx
            </Title>
            
            <Text
              size={{ base: 'lg', md: 'xl' }}
              fw={600}
              opacity={0.9}
            >
              Autos usados, precios justos.
            </Text>

            <Text
              size={{ base: 'md', md: 'lg' }}
              opacity={0.8}
              maw={600}
              ta="center"
            >
              Compra y vende autos usados de manera simple, transparente y sin complicaciones.
            </Text>
          </Stack>

          <Group gap="md" mt="lg">
            <Button
              size="lg"
              variant="white"
              color="dark"
              radius="md"
              px={30}
              styles={{
                root: {
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
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
                  borderColor: 'rgba(255,255,255,0.5)',
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
            size="sm"
            opacity={0.7}
            ta="center"
            mt="md"
          >
            Desliza para explorar
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}