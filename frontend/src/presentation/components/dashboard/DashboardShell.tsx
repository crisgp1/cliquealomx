'use client';

import { useState } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  ScrollArea,
  UnstyledButton,
  Avatar,
  Menu,
  rem,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCar,
  IconDashboard,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconPlus,
  IconList,
  IconAnalyze,
  IconUsers,
} from '@tabler/icons-react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

interface DashboardShellProps {
  children: React.ReactNode;
}

const navigationData = [
  { 
    icon: IconDashboard, 
    label: 'Panel Principal', 
    href: '/dashboard',
    description: 'Vista general de tu cuenta'
  },
  { 
    icon: IconCar, 
    label: 'Mis Anuncios', 
    href: '/dashboard/listings',
    description: 'Gestiona tus publicaciones de autos'
  },
  { 
    icon: IconPlus, 
    label: 'Crear Anuncio', 
    href: '/dashboard/create',
    description: 'Publica un nuevo auto'
  },
  { 
    icon: IconAnalyze, 
    label: 'Estadísticas', 
    href: '/dashboard/analytics',
    description: 'Visualizaciones y reportes'
  },
  { 
    icon: IconUsers, 
    label: 'Mis Compradores', 
    href: '/dashboard/buyers',
    description: 'Gestiona tus contactos'
  },
  { 
    icon: IconSettings, 
    label: 'Configuración', 
    href: '/dashboard/settings',
    description: 'Ajustes de la cuenta'
  },
];

export function DashboardShell({ children }: DashboardShellProps) {
  const [opened, { toggle }] = useDisclosure();
  const { user } = useUser();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
          
          <Group justify="space-between" style={{ flex: 1 }}>
            <Group>
              <Text
                size="xl"
                fw={700}
                c="blue"
                style={{ cursor: 'pointer' }}
              >
                Cliquéalo.mx
              </Text>
              <Text size="sm" c="dimmed">
                Dashboard
              </Text>
            </Group>

            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Text size="sm" c="red">
                No autenticado
              </Text>
            </SignedOut>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section>
          <Group>
            <Avatar
              src={user?.imageUrl}
              alt={user?.fullName || 'Usuario'}
              radius="xl"
              size="sm"
            />
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                {user?.fullName || 'Usuario'}
              </Text>
              <Text size="xs" c="dimmed">
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </div>
          </Group>
        </AppShell.Section>

        <AppShell.Section grow my="md" component={ScrollArea}>
          <Stack gap="xs">
            {navigationData.map((item) => (
              <NavLink
                key={item.label}
                href={item.href}
                label={item.label}
                description={item.description}
                leftSection={<item.icon size="1.25rem" stroke={1.5} />}
                style={{
                  borderRadius: '8px',
                  padding: '12px',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: 'var(--mantine-color-blue-0)',
                    },
                  },
                  label: {
                    fontSize: '14px',
                    fontWeight: 500,
                  },
                  description: {
                    fontSize: '12px',
                    color: 'var(--mantine-color-gray-6)',
                  },
                }}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Text size="xs" c="dimmed" ta="center">
            © 2025 Cliquéalo.mx
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}