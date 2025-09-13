import { Container, Title, Text, Box, Badge } from '@mantine/core';

export default function LoungeClubPage() {
  return (
    <Container size="xl" py="xl">
      <Box>
        <Title order={1} mb="md">
          Lounge Club <Badge color="yellow" size="sm" ml="xs">★</Badge>
        </Title>
        <Text>
          Únete a nuestro exclusivo Lounge Club y accede a beneficios especiales, 
          ofertas exclusivas y servicios premium.
        </Text>
      </Box>
    </Container>
  );
}

export const metadata = {
  title: 'Lounge Club ★ - Cliquéalo.mx',
  description: 'Únete a nuestro exclusivo Lounge Club y accede a beneficios especiales',
};