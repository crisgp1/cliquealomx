import { Container, Title, Text, Box } from '@mantine/core';

export default function ContactoPage() {
  return (
    <Container size="xl" py="xl">
      <Box>
        <Title order={1} mb="md">
          Contacto
        </Title>
        <Text>
          ¿Tienes alguna pregunta o comentario? Contáctanos y te responderemos lo antes posible.
        </Text>
      </Box>
    </Container>
  );
}

export const metadata = {
  title: 'Contacto - Cliquéalo.mx',
  description: 'Contacta con el equipo de Cliquéalo.mx',
};