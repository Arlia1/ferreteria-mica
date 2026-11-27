import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administración y Comandas',
  alternates: {
    canonical: 'https://ferreteria-mica.vercel.app/admin',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
