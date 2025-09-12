'use client';

import { useState } from 'react';
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
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

const navigationItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Explorar Autos', href: '/explorar' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Lounge Club ★', href: '/lounge' },
];

export function Header() {
  const [opened, { toggle, close }] = useDisclosure();

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
            <Text
              size="xl"
              fw={700}
              c="blue"
              style={{ cursor: 'pointer' }}
            >
              Cliquéalo.mx
            </Text>

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
                  <SignInButton>
                    <Button variant="light" size="sm">
                      Iniciar Sesión
                    </Button>
                  </SignInButton>
                  <SignUpButton>
                    <Button size="sm">
                      Registrarse
                    </Button>
                  </SignUpButton>
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
                <SignInButton>
                  <Button variant="light" fullWidth onClick={close}>
                    Iniciar Sesión
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button fullWidth onClick={close}>
                    Registrarse
                  </Button>
                </SignUpButton>
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