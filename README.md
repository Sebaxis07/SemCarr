# Semana de las Carreras 2026 — Mesa de Control Administrativa

Sistema centralizado de administración, control de asistencia, registro de puntajes y evaluación docente para la **Semana de las Carreras 2026 (TI & Diseño Digital)**.

> El sistema opera exclusivamente en modo administrativo bajo `/admin` con autenticación y control de acceso por roles (RBAC). Las rutas públicas (`/`, `/alianzas`) devuelven `404`.

---

## Inicio Rápido (Windows)

Ejecuta [iniciar_servidor.bat](iniciar_servidor.bat):
1. Verifica que **Node.js** esté instalado.
2. Ejecuta `npm install --no-audit --no-fund`.
3. Verifica o instala **cloudflared** (vía `winget` o descarga portátil en `bin/cloudflared.exe`) para habilitar el túnel remoto.
4. Abre el navegador en `http://localhost:5173/admin` e inicia `node server.js`.

También puedes iniciarlo manualmente con:
```bash
npm install
node server.js
```

---

## Módulos de Administración (`/admin`)

- **Asistencia del Evento:** Consolidado de asistencia real, filtros por alianza/actividad y registro directo en puerta.
- **Lista de Alianzas:** Resumen de puntajes, puestos y listado de integrantes por alianza (`Terror`, `Shooter`, `Action`) mostrando en qué actividades participó cada persona.
- **Participantes por Actividad:** Búsqueda en el padrón oficial y registro en el momento (*walk-in* en cancha) con asignación automática de alianza.
- **Cambio de Alianzas:** Traslados individuales y permutas 1 a 1 con trazabilidad.
- **Registro de Puntos:** Carga de puestos, deportes triangulares y gymkanas según reglas en [config/rules.js](config/rules.js).
- **Evaluación Docente:** Rúbricas de evaluación de desafíos y mención de honor para docentes (`docente1`, `docente2`).
- **Modo Proyector:** Vista en vivo de marcador y ranking para pantalla de cancha.
- **Acceso Docentes (QR):** Modal para `admin` y `coordinacion` que levanta un túnel HTTPS temporal (`cloudflared`) y genera un código QR + enlace copiable hacia `/admin` para que los docentes evalúen desde sus dispositivos y las notas se guarden directo en el servidor local.

---

## Roles (RBAC)

Definidos en [server_security.js](server_security.js) y [credentials.json](credentials.json):
- `admin`: Acceso total + control del túnel/QR y cierre/reapertura del evento.
- `coordinacion`: Gestión operativa completa + control del túnel/QR.
- `mesa`: Asistencia, lista de alianzas, participantes y puntos.
- `staff`: Lista de alianzas, participantes, puntos y traslados.
- `docente`: Acceso exclusivo a **Evaluación Docente**.

---

## Datos y Gestión del Padrón

- **Sincronización CSV:** [server.js](server.js) detecta automáticamente el archivo CSV más reciente en `Inf/` (por ejemplo `Inf/participantes-semana-carrera-2026-11-18.csv`) y fusiona nuevos participantes en [students.json](students.json) preservando cambios de alianza e inscripciones *walk-in*.
- **Utilidad de datos:** [gestionar_datos.bat](gestionar_datos.bat) / [manage_data.py](manage_data.py) para administración y respaldo manual de datos.

---

## Pruebas Automatizadas

Ejecutar toda la suite de pruebas (`46` casos):
```bash
node --test test/*.test.js
```
