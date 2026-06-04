import EstudiantesClient from './EstudiantesClient';
import '@/app/styles/usuarios.css';
import '@/app/styles/estudiantes.css';

export const metadata = {
  title: 'Estudiantes | Panel Administrativo',
};

export default function AdminEstudiantesPage() {
  return <EstudiantesClient />;
}
