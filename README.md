# Plataforma de Administracion y Control: Semana de la Carrera 2026
## INACAP Sede Antofagasta: Area Tecnologias de la Informacion y Ciberseguridad / Diseno Digital

Sistema web integral para la administracion, arbitraje en vivo, trazabilidad de resultados, auditoria de cambios y publicacion del ranking general de las alianzas durante la Semana de la Carrera 2026.

La plataforma implementa la logica reglamentaria de las Bases Oficiales, asegurando calculos centralizados en el servidor, registro historico de cambios y proteccion de datos personales de los estudiantes.

---

## Tabla de Contenidos

1. Caracteristicas Principales
2. Cuentas de Acceso y Roles (Credenciales del Sistema)
3. Arquitectura del Proyecto
4. Requisitos del Sistema
5. Instalacion y Ejecucion
6. Suite de Pruebas Automatizadas
7. Sistema de Puntuacion y Reglas de Negocio
8. Seguridad, Privacidad y Auditoria
9. Despliegue en Produccion

---

## 1. Caracteristicas Principales

* Motor de calculo centralizado: Toda la logica de puntuaciones, desempates y porcentajes se ejecuta en el servidor (`config/rules.js`), evitando manipulaciones en cliente.
* Desempate general en 3 niveles: En caso de empate en el total acumulado, el sistema aplica la jerarquia oficial: (1) Mayor cantidad de primeros lugares, (2) Mayor puntaje en deportes combinados (Baby futbol y Quemadas), (3) Mejor ubicacion en el Torneo Retro.
* Arbitraje y planillas en vivo: Registro de resultados detallados para Baby futbol, Quemadas (con desempate por rondas y jugadores en pie), Torneo Retro, Trivia de conocimiento, Taca-taca, Ping pong, Canto, Barra y ruido, y Gymkanas (con trazabilidad por puesto).
* Evaluacion docente con rubrica oficial: Rango de 4 niveles reglamentarios (Excelente 100%, Bueno 80%, Regular 50%, Basico 20%). Deteccion automatica de discrepancias mayores a 20 puntos, bloqueando la nota a estado provisional hasta resolucion conjunta.
* Obra favorita con tope estricto: Asignacion de 500 puntos maximos, divididos equitativamente en caso de empate en la nota maxima docente.
* Control de reclamos y sanciones: Registro de hora de finalizacion de cada actividad y evaluacion de la ventana reglamentaria de 15 minutos para admision de reclamos. Validacion rigida de sanciones disciplinarias entre 200 y 600 puntos.
* Panel de jefatura y coordinacion: Tablero con metricas consolidadas, tasa de participacion de estudiantes, comparativa de inscritos frente a asistentes reales, matriz de puntos y estado de reclamos.
* Cierre de evento y premios de nota: Asignacion automatica de bonificacion academica (1.0 punto a la primera alianza, 0.5 a la segunda y 0.3 a la tercera), filtrando exclusivamente a los alumnos que registraron participacion real en actividades.
* Proteccion de datos personales: Eliminacion total de exposicion de RUTs y correos institucionales en interfaces publicas y respuestas de API, con limitador de tasa de peticiones (rate limiting) en el buscador publico.

---

## 2. Cuentas de Acceso y Roles (Credenciales del Sistema)

El acceso administrativo se encuentra protegido mediante autenticacion basada en roles (RBAC) y almacenamiento seguro de contrasenas con hash criptografico scrypt.

A continuacion se detallan las cuentas configuradas en el entorno:

| Usuario | Rol | Contrasena por Defecto | Perfil y Alcance de Permisos |
|---|---|---|---|
| admin | admin | InacapAdmin2026! | Superadministrador: Control total del sistema, configuracion global, aprobacion de solicitudes de cambio de alianza, cierre del evento, asignacion de sanciones y visualizacion de auditoria. |
| coordinacion | coordinacion | CoordSemana2026# | Coordinacion de Carrera: Gestion de cronograma, resolucion de reclamos, supervision de planillas y acceso al panel de reportes ejecutivos para jefatura. |
| mesa | mesa | MesaCancha2026* | Mesa de Control y Jueces de Cancha: Carga de alineaciones, registro de resultados de partidos, registro de tiempos, ingreso de suplentes y recepcion de reclamos. |
| docente1 | docente | DocenteJuez1_2026 | Docente Evaluador 1: Evaluacion del Desafio Creativo mediante rubrica oficial y participacion en la resolucion de discrepancias. |
| docente2 | docente | DocenteJuez2_2026 | Docente Evaluador 2: Evaluacion del Desafio Creativo mediante rubrica oficial y acuerdo conjunto en notas discrepantes. |
| staff | staff | StaffPuntos2026! | Staff de Apoyo: Registro de asistencia en puestos de control, toma de asistencia en tarreo y carga de puntajes individuales de Gymkanas. |

Nota: Las sesiones expiran automaticamente por inactividad. En entornos de produccion expuestos, se recomienda rotar las contrasenas por defecto mediante el script de seguridad o actualizando `credentials.json`.

---

## 3. Arquitectura del Proyecto

```text
.
├── config/
│   └── rules.js              # Reglas de negocio oficiales, distribucion de puntos y desempates
├── public/                   # Frontend publico y estaticos
│   ├── index.html            # Pagina publica del evento y visor del ranking general
│   ├── app.js                # Logica del cliente publico (consumo de API y renderizado)
│   ├── style.css             # Estilos y variables de diseno
│   └── admin/                # Consola de administracion y mesa de control
│       ├── index.html        # Portal de acceso administrativo
│       └── admin.js          # Logica administrativa, modales de planilla y reportes
├── alianzas/                 # Portal complementario informativo de alianzas
│   └── index.html
├── test/                     # Bateria de pruebas automatizadas
│   ├── security_privacy.test.js
│   ├── ranking_tiebreak.test.js
│   ├── quemadas_babyfutbol_ties.test.js
│   ├── creative_rubric_favorite.test.js
│   ├── reclamos_sanciones.test.js
│   ├── gymkanas.test.js
│   ├── match_lineups.test.js
│   ├── grade_prizes.test.js
│   ├── detailed_activities.test.js
│   └── reports_jefatura.test.js
├── api/                      # Punto de entrada para despliegues serverless (Vercel)
│   └── index.js
├── server.js                 # Servidor Express, endpoints REST y persistencia
├── server_security.js        # Modulo de autenticacion, control de tasa y hash scrypt
├── credentials.json          # Almacenamiento seguro de credenciales con hash
├── data.json                 # Estado global de la competencia y bitacora de auditoria
├── students.json             # Padron oficial de estudiantes (privado, solo servidor)
├── AUDITORIA.md              # Matriz de trazabilidad frente a Bases Oficiales
├── BASES_REGLAS.md           # Transcripcion formal de las Bases del evento
└── package.json              # Dependencias y scripts de ejecucion
```

---

## 4. Requisitos del Sistema

* Node.js: Version 18.0.0 o superior (recomendado Node.js 20 LTS o superior).
* Gestor de paquetes: npm version 9.0.0 o superior.
* Sistema operativo: Linux, macOS o Windows.

---

## 5. Instalacion y Ejecucion

### 5.1. Clonar el repositorio
```bash
git clone https://github.com/tu-organizacion/semcar.git
cd semcar
```

### 5.2. Instalar dependencias
```bash
npm install
```

### 5.3. Iniciar el servidor local
```bash
npm start
```

El servidor quedara disponible en:
* Interfaz publica y ranking: `http://localhost:3000`
* Mesa de control y administracion: `http://localhost:3000/admin`
* Portal de alianzas: `http://localhost:3000/alianzas`

---

## 6. Suite de Pruebas Automatizadas

El proyecto utiliza el corredor nativo `node:test` de Node.js, cubriendo 37 especificaciones exactas derivadas de las Bases Oficiales.

Para ejecutar todas las pruebas:
```bash
npm test
```

Tambien es posible ejecutar suites especificas de forma individual:
```bash
node --test test/security_privacy.test.js
node --test test/ranking_tiebreak.test.js
node --test test/quemadas_babyfutbol_ties.test.js
node --test test/creative_rubric_favorite.test.js
node --test test/reclamos_sanciones.test.js
node --test test/gymkanas.test.js
node --test test/match_lineups.test.js
node --test test/grade_prizes.test.js
node --test test/detailed_activities.test.js
node --test test/reports_jefatura.test.js
```

### Casos criticos cubiertos en pruebas:
* Distribucion exacta en Baby futbol sin empate (4000, 2400, 1200) y empates (3200 cada una en 1.er lugar; 1800 cada una en 2.do lugar; 2533,33 en triple empate).
* Puntuacion de Quemadas (3000, 1800, 900) con desempate por rondas ganadas y jugadores en pie.
* Evaluacion del Desafio Creativo: nota promedio 80 otorga 2000 puntos; desempate de Obra Favorita otorga 250 puntos si empatan dos alianzas o 166,67 si empatan tres.
* Bloqueo de discrepancias docentes mayores a 20 puntos a revision conjunta.
* Restriccion de rubrica a los 4 niveles oficiales (rechazo de valores anomalos).
* Trazabilidad de Gymkanas por puesto (1 pt intento + 1 pt resuelto) con tope de 8 puntos por alumno.
* Validacion de paridad de jugadores y minimos reglamentarios por cancha.
* Ventana de reclamos (admitido a los 15 minutos exactos, fuera de plazo a los 16 minutos).
* Rango valido de sanciones disciplinarias (200 a 600 puntos).
* Cero exposicion de datos sensibles (RUT y correo) en respuestas web y endpoints publicos.

---

## 7. Sistema de Puntuacion y Reglas de Negocio

El evento distribuye un maximo reglamentario de 25.000 puntos de base mas bonificaciones controladas:

### 7.1. Distribucion de Actividades Principales
* Baby futbol: 1.er lugar 4000 pts, 2.do lugar 2400 pts, 3.er lugar 1200 pts.
* Quemadas: 1.er lugar 3000 pts, 2.do lugar 1800 pts, 3.er lugar 900 pts.
* Torneo Retro (Mortal Kombat): 1.er lugar 3000 pts, 2.do lugar 1800 pts, 3.er lugar 900 pts.
* Trivia de Conocimiento: 1.er lugar 2000 pts, 2.do lugar 1200 pts, 3.er lugar 600 pts.
* Taca-taca: 1.er lugar 1000 pts, 2.do lugar 600 pts, 3.er lugar 300 pts.
* Ping Pong: 1.er lugar 1000 pts, 2.do lugar 600 pts, 3.er lugar 300 pts.
* Canto: 1.er lugar 1000 pts, 2.do lugar 600 pts, 3.er lugar 300 pts.
* Barra y Ruido: 1.er lugar 1000 pts, 2.do lugar 600 pts, 3.er lugar 300 pts.
* Gymkanas: Hasta 3000 pts proporcionales al desempeno: `3000 * (promedio / 8)`.

### 7.2. Desafio Creativo (3500 pts maximo)
* Entrega a tiempo: 1000 pts.
* Evaluacion docente: Hasta 2000 pts segun promedio de rubrica `(nota / 100) * 2000`.
* Obra Favorita: 500 pts a la mejor calificacion promedio (repartido en caso de empate).

### 7.3. Criterio de Redondeo
Los puntajes parciales y sumatorias intermedias se calculan y preservan en memoria con precision decimal completa. El redondeo al entero mas cercano (0.5 hacia arriba) se aplica exclusivamente en la capa de presentacion visual al usuario.

---

## 8. Seguridad, Privacidad y Auditoria

* Modelo OWASP ASVS: Proteccion de rutas administrativas mediante autorizacion previa y verificacion de token de sesion seguro.
* Fuga de datos mitigada: Los padrones completos (`students.json`) residen en almacenamiento interno del servidor. El buscador publico `/api/students/search` devuelve unicamente: `name`, `alliance` y `career`.
* Rate Limiting: Proteccion contra enumeracion y ataques de fuerza bruta en endpoints de consulta publica y autenticacion.
* Bitacora de auditoria (`auditLogs`): Toda modificacion de resultados, ingreso de sanciones, autorizacion de excepciones en cancha o cambios de puntaje registra en `data.json`:
  * Identificador del usuario responsable.
  * Marca de tiempo en formato ISO 8601.
  * Valor anterior y valor nuevo.
  * Justificacion reglamentaria.

---

## 9. Despliegue en Produccion

El proyecto incluye compatibilidad directa con entornos serverless (como Vercel) mediante la configuracion en `api/index.js` y `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" },
    { "src": "public/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/admin/(.*)", "dest": "/public/admin/$1" },
    { "src": "/admin", "dest": "/public/admin/index.html" },
    { "src": "/alianzas/(.*)", "dest": "/alianzas/$1" },
    { "src": "/alianzas", "dest": "/alianzas/index.html" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

Para asegurar persistencia en despliegues distribuidos sin disco local persistente, se recomienda vincular `data.json` a un servicio de almacenamiento o base de datos externa (PostgreSQL / Redis / S3).

---

## 10. Licencia y Creditos

Desarrollado para la **Semana de la Carrera 2026**, Area Tecnologias de la Informacion y Diseno Digital, **INACAP Sede Antofagasta**.
Uso institucional restringido a fines academicos y de coordinacion estudiantil.
