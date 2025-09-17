import { SignUp } from '@clerk/nextjs';
import { Container, Center } from '@mantine/core';

export default function SignUpPage() {
  return (
    <Container size="xs" py={60}>
      <Center>
        <SignUp
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
              },
              card: {
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                border: '1px solid #e5e7eb',
              },
            },
            variables: {
              colorPrimary: '#22c55e',
              colorText: '#111827',
            },
          }}
        />
      </Center>
    </Container>
  );
}