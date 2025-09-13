import { Container, Title, Text, Box } from '@mantine/core';

export default function NosotrosPage() {
  return (
    <Container size="xl" py="xl">
      <Box>
        <Title order={1} mb="md">
          Nosotros
        </Title>
        <Text>
          En Cliquéalo.mx somos tu plataforma confiable para encontrar el auto perfecto. 
          Conectamos compradores y vendedores con la mejor experiencia del mercado.
        </Text>
      </Box>
    </Container>
  );
}

export const metadata = {
  title: 'Nosotros - Cliquéalo.mx',
  description: 'Conoce más sobre Cliquéalo.mx y nuestra misión',
};