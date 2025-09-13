'use client';

import Image from 'next/image';
import {
  Anchor,
  Box,
  Container,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';

const navigationLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Explorar Autos', href: '/explorar' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Lounge Club ★', href: '/lounge-club' },
];

const supportLinks = [
  { label: 'Centro de Ayuda', href: '/soporte' },
  { label: 'Términos de Uso', href: '/terminos' },
  { label: 'Política de Privacidad', href: '/privacidad' },
  { label: 'Contacto', href: '/contacto' },
];

export function Footer() {
  return (
    <Box
      component="footer"
      style={{
        backgroundColor: 'var(--mantine-color-gray-9)',
        color: 'white',
      }}
    >
      <Container size="xl" py="xl">
        {/* Main Footer Content */}
        <Grid gutter="xl">
          {/* Brand Section */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Image
                src="/logo-blanco.svg"
                alt="Cliquéalo.mx"
                width={150}
                height={35}
                priority
              />
              <Text size="sm" c="dimmed" pr={{ base: 0, md: 'lg' }}>
                Tu plataforma confiable para encontrar el auto perfecto. 
                Conectamos compradores y vendedores con la mejor experiencia del mercado.
              </Text>
            </Stack>
          </Grid.Col>

          {/* Navigation Links */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Stack gap="md">
              <Title order={4} size="md" c="white">
                Navegación
              </Title>
              <Stack gap="xs">
                {navigationLinks.map((link) => (
                  <Anchor
                    key={link.label}
                    href={link.href}
                    size="sm"
                    c="dimmed"
                    underline="never"
                    style={{
                      transition: 'color 0.2s',
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          color: 'var(--mantine-color-cliquealow-green-4)',
                        },
                      },
                    }}
                  >
                    {link.label}
                  </Anchor>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>

          {/* Support Links */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Stack gap="md">
              <Title order={4} size="md" c="white">
                Soporte
              </Title>
              <Stack gap="xs">
                {supportLinks.map((link) => (
                  <Anchor
                    key={link.label}
                    href={link.href}
                    size="sm"
                    c="dimmed"
                    underline="never"
                    style={{
                      transition: 'color 0.2s',
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          color: 'var(--mantine-color-cliquealow-green-4)',
                        },
                      },
                    }}
                  >
                    {link.label}
                  </Anchor>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>
        </Grid>

        <Divider my="xl" color="gray.7" />

        {/* Bottom Footer */}
        <Group
          justify="space-between"
          align="center"
          gap="md"
          style={{
            flexDirection: 'column',
          }}
        >
          <Group gap="xs" align="center">
            <Text size="sm" c="dimmed">
              © 2025 Cliquéalo.mx. Todos los derechos reservados.
            </Text>
            <Text size="sm" c="dimmed">
              • Hecho en México 🇲🇽
            </Text>
          </Group>

          <Group gap="xs" align="center">
            <Text size="xs" c="dimmed">
              Desarrollado por
            </Text>
            <Anchor
              href="https://hyrk.io"
              size="xs"
              c="cliquealow-green.4"
              underline="never"
              fw={500}
              styles={{
                root: {
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
              }}
            >
              hyrk.io
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}