import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administración y Comandas | Ferretería Mica',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
