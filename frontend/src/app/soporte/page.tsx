import { Container, Title, Text, Box } from '@mantine/core';

export default function SoportePage() {
  return (
    <Container size="xl" py="xl">
      <Box>
        <Title order={1} mb="md">
          Centro de Ayuda
        </Title>
        <Text>
          ¿Necesitas ayuda? Estamos aquí para resolver todas tus dudas y 
          brindarte el mejor soporte posible.
        </Text>
      </Box>
    </Container>
  );
}

export const metadata = {
  title: 'Centro de Ayuda - Cliquéalo.mx',
  description: 'Centro de ayuda y soporte de Cliquéalo.mx',
};