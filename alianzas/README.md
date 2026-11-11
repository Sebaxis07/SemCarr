# Módulo Público: Mi Alianza 2026

Sitio público oficial y seguro para la consulta de alianzas y gestión de solicitudes de cambio para la **Semana de las Carreras 2026 (TI & Diseño Digital - Sede Antofagasta)**.

## 🛡️ Principios de Privacidad y Seguridad

- **Cero exposición de datos personales:** Ningún RUT (ni completo ni enmascarado) se muestra en pantalla. El padrón completo de estudiantes reside exclusivamente en el backend seguro y nunca se expone en el cliente.
- **Autenticación con RUT institucional:** El estudiante digita su RUT únicamente en el formulario de acceso como credencial temporal.
- **Ficha personal limpia:** Una vez autenticado, solo se visualiza su **Nombre**, **Carrera**, **Alianza Oficial** y la mascota oficial.
- **Sesión Temporal:** Sesión protegida de 15 minutos en memoria que caduca automáticamente.
- **Validación humana obligatoria:** Toda solicitud de cambio queda en cola ("Pendiente de revisión" o "En lista de espera") y requiere aprobación explícita de un administrador en la plataforma principal.

## 📁 Estructura de la carpeta `alianzas/`

```text
alianzas/
├── index.html        # Portal público (Inicio, Ficha personal, Modales, Stepper de estado)
├── alianzas.js       # Lógica cliente para interacción con APIs seguras (/api/public/alliance/*)
├── README.md         # Documentación del módulo
└── img/              # Renders oficiales transparentes de las mascotas
    ├── mascota-terror.png
    ├── mascota-shooter.png
    └── mascota-action.png
```

## 🚀 Acceso y Despliegue

- **Acceso Local:**
  Disponible en: [http://localhost:5173/alianzas](http://localhost:5173/alianzas)
- **Panel Administrativo:**
  Gestión y aprobación de solicitudes en: [http://localhost:5173/admin](http://localhost:5173/admin) (Pestaña "Solicitudes Públicas" en "Cambio de Alianzas").
