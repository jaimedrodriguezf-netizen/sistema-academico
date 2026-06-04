import MateriasClient from './MateriasClient';

// Import shared CSS for dashboard, tables and badges
import '@/app/styles/usuarios.css';
import '@/app/styles/estudiantes.css';

export const metadata = {
  title: 'Gestión de Materias | Panel Admin',
  description: 'Gestión de asignación de materias por nivel escolar',
};

export default function MateriasPage() {
  return (
    <MateriasClient />
  );
}
