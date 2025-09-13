import { Container, Title, Text, Box } from '@mantine/core';

export default function TerminosPage() {
  return (
    <Container size="xl" py="xl">
      <Box>
        <Title order={1} mb="md">
          Términos de Uso
        </Title>
        <Text>
          Términos y condiciones de uso de la plataforma Cliquéalo.mx.
        </Text>
      </Box>
    </Container>
  );
}

export const metadata = {
  title: 'Términos de Uso - Cliquéalo.mx',
  description: 'Términos y condiciones de uso de Cliquéalo.mx',
};