import MateriasClient from './MateriasClient';

// Import shared CSS for dashboard, tables and badges
import '../usuarios/usuarios.css';
import '../estudiantes/estudiantes.css';

export const metadata = {
  title: 'Gestión de Materias | Panel Admin',
  description: 'Gestión de asignación de materias por nivel escolar',
};

export default function MateriasPage() {
  return (
    <MateriasClient />
  );
}
