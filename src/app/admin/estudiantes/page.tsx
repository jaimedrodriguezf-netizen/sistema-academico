import EstudiantesClient from './EstudiantesClient';
import './estudiantes.css';

export const metadata = {
  title: 'Estudiantes | Panel Administrativo',
};

export default function AdminEstudiantesPage() {
  return <EstudiantesClient />;
}
