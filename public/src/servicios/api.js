// Servicios de comunicacion con las rutas de API del servidor
export async function fetchStats() {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Error al cargar datos');
  return await res.json();
}

export async function fetchStudentsByAlliance() {
  const res = await fetch('/api/students/by-alliance');
  if (!res.ok) throw new Error('Error cargando estudiantes por alianza');
  return await res.json();
}

export async function fetchStudentsSearch(query) {
  const res = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return await res.json();
}
