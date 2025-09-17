import dynamic from 'next/dynamic';

export const DynamicHeader = dynamic(
  () => import('./Header').then((mod) => mod.Header),
  {
    ssr: false,
    loading: () => <div style={{ height: '60px', backgroundColor: 'white', borderBottom: '1px solid var(--mantine-color-gray-3)' }} />
  }
);