'use client';

import Image from 'next/image';
import {
  Box,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  SignedIn,
  SignedOut,
  UserButton,
  useClerk,
} from '@clerk/nextjs';

const navigationItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Explorar Autos', href: '/explorar' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Lounge Club ★', href: '/lounge' },
];

export function Header() {
  const [opened, { toggle, close }] = useDisclosure();
  const { openSignIn, openSignUp } = useClerk();

  return (
    <>
      <Box
        component="header"
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 60,
        }}
      >
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            {/* Logo */}
            <UnstyledButton
              component="a"
              href="/"
              style={{ cursor: 'pointer' }}
            >
              <Image
                src="/logo.webp"
                alt="Cliquéalo.mx"
                width={120}
                height={40}
                priority
              />
            </UnstyledButton>

            {/* Desktop Navigation */}
            <Group gap="md" visibleFrom="md">
              {navigationItems.map((item) => (
                <UnstyledButton
                  key={item.label}
                  p="xs"
                  style={{
                    borderRadius: 4,
                    transition: 'background-color 0.2s',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: 'var(--mantine-color-gray-1)',
                      },
                    },
                  }}
                >
                  <Text size="sm" fw={500}>
                    {item.label}
                  </Text>
                </UnstyledButton>
              ))}
              
              {/* Auth Section */}
              <SignedOut>
                <Group gap="xs">
                  <Button 
                    variant="light" 
                    size="sm" 
                    color="cliquealow-green"
                    onClick={() => openSignIn()}
                  >
                    Iniciar Sesión
                  </Button>
                  <Button 
                    size="sm" 
                    color="cliquealow-green"
                    onClick={() => openSignUp()}
                  >
                    Registrarse
                  </Button>
                </Group>
              </SignedOut>
              <SignedIn>
                <Group gap="md">
                  <UnstyledButton
                    p="xs"
                    style={{
                      borderRadius: 4,
                      transition: 'background-color 0.2s',
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          backgroundColor: 'var(--mantine-color-gray-1)',
                        },
                      },
                    }}
                    component="a"
                    href="/dashboard"
                  >
                    <Text size="sm" fw={500}>
                      Mi Dashboard
                    </Text>
                  </UnstyledButton>
                  <UserButton />
                </Group>
              </SignedIn>
            </Group>

            {/* Mobile Burger */}
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
              size="sm"
            />
          </Group>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        size="xs"
        position="right"
        styles={{
          header: {
            paddingBottom: 0,
          },
          body: {
            paddingTop: 0,
          },
        }}
      >
        <Stack gap="md" pt="md">
          {navigationItems.map((item) => (
            <UnstyledButton
              key={item.label}
              p="md"
              onClick={close}
              style={{
                borderRadius: 8,
                transition: 'background-color 0.2s',
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: 'var(--mantine-color-gray-1)',
                  },
                },
              }}
            >
              <Text size="md" fw={500}>
                {item.label}
              </Text>
            </UnstyledButton>
          ))}
          
          {/* Mobile Auth Section */}
          <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <SignedOut>
              <Stack gap="sm">
                <Button 
                  variant="light" 
                  fullWidth 
                  color="cliquealow-green"
                  onClick={() => {
                    openSignIn();
                    close();
                  }}
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  fullWidth 
                  color="cliquealow-green"
                  onClick={() => {
                    openSignUp();
                    close();
                  }}
                >
                  Registrarse
                </Button>
              </Stack>
            </SignedOut>
            <SignedIn>
              <Stack gap="sm">
                <UnstyledButton
                  p="md"
                  onClick={close}
                  style={{
                    borderRadius: 8,
                    transition: 'background-color 0.2s',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: 'var(--mantine-color-gray-1)',
                      },
                    },
                  }}
                  component="a"
                  href="/dashboard"
                >
                  <Text size="md" fw={500}>
                    Mi Dashboard
                  </Text>
                </UnstyledButton>
                <Group justify="center" pt="sm">
                  <UserButton />
                </Group>
              </Stack>
            </SignedIn>
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}