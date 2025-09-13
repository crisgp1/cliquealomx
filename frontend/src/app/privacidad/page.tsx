import { Container, Title, Text, Box } from '@mantine/core';

export default function PrivacidadPage() {
  return (
    <Container size="xl" py="xl">
      <Box>
        <Title order={1} mb="md">
          Política de Privacidad
        </Title>
        <Text>
          Política de privacidad y manejo de datos de Cliquéalo.mx.
        </Text>
      </Box>
    </Container>
  );
}

export const metadata = {
  title: 'Política de Privacidad - Cliquéalo.mx',
  description: 'Política de privacidad y manejo de datos de Cliquéalo.mx',
};