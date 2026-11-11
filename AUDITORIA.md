# Auditoría: Plataforma Semana de la Carrera 2026 vs Bases Oficiales

Fecha de auditoría inicial: 2026-11-11  
Fecha de actualización y resolución: 2026-11-11  
Sede: INACAP Antofagasta  
Alcance: `server.js`, `config/rules.js`, `public/admin/admin.js`, `public/app.js`, `public/index.html`, `data.json`, `test/*.test.js`.

Estado general de la plataforma: **Conforme a Bases Oficiales tras implementación de prioridades P0, P1, P2 y P3.**

---

## Matriz de Hallazgos y Estado Final

| ID | Área / Requisito | Estado Inicial | Estado Final | Resolución Técnica y Referencias |
|---|---|---|---|---|
| **P0.1** | Fuga de datos personales en web pública (`students-data.js`) | Crítico | **Resuelto** | Se eliminó `public/students-data.js` y su etiqueta `<script>` en `public/index.html`. El buscador público `/api/students/search` retorna solo `nombre`, `alianza` y `carrera` (nunca RUT ni correo), sin confirmar existencia de RUT por fuerza bruta y con rate limit por IP. Verificado con `test/security_privacy.test.js`. *Nota: Se detectó presencia previa en commits pasados (ver sección de Dudas/Acciones).* |
| **P1.2** | Desempate general del ranking (Sección 8 Bases) | Falta | **Resuelto** | Se implementó el desempate de 3 niveles en `config/rules.js` (`resolveGeneralRanking`) y `server.js`: (1) Mayor cantidad de 1° lugares, (2) Mayor puntaje en deportes (Baby fútbol + Quemadas), (3) Mejor posición en Torneo Retro. Muestra en ranking público y admin la razón del desempate. Verificado con `test/ranking_tiebreak.test.js`. |
| **P1.3** | Quemadas: Sistema de tabla y desempate | Incorrecto | **Resuelto** | Se corrigió el servidor para calcular: Victoria 3 pts, Empate 1 pt, Derrota 0 pts. Desempate: Más rondas ganadas y luego más jugadores en pie. Se unificó `config/rules.js`, `server.js` y `public/admin/admin.js`. Verificado con `test/quemadas_babyfutbol_ties.test.js`. |
| **P1.4** | Obra favorita: Tope de 500 pts y reparto en empates | Incorrecto | **Resuelto** | Tope estricto de 500 pts en `config/rules.js` (`evaluateCreativeWorks`). Si empatan dos alianzas reciben 250 pts cada una: si empatan tres reciben 166,67 pts cada una: una sola recibe 500 pts. Verificado con `test/creative_rubric_favorite.test.js`. |
| **P1.5** | Rúbrica docente y discrepancia > 20 puntos | Distinto / Incorrecto | **Resuelto** | Se limitó la rúbrica estrictamente a los 4 niveles de las Bases: Excelente (100%), Bueno (80%), Regular (50%), Básico (20%). Se eliminó `Insatisfactorio`. Diferencia > 20 pts bloquea la nota en "revisión conjunta pendiente", queda provisional en ranking y no clasifica a obra favorita hasta que se registre el acuerdo en `/api/admin/docentes/acordar-nota`. |
| **P1.6** | Reclamos con ventana de 15 min y rango de sanciones | Falta | **Resuelto** | Cada actividad registra `actualEnd`. Los reclamos registran `timestamp` y `/api/admin/reclamos` evalúa la ventana: a 15 min exactos está dentro de plazo, a 16 min queda "fuera de plazo" con motivo obligatorio. Sanciones restringidas rígidamente al rango de 200 a 600 puntos. Verificado con `test/reclamos_sanciones.test.js`. |
| **P2.7** | Gymkanas con trazabilidad por persona y por puesto | Distinto | **Resuelto** | Registro de 4 puestos con flags `attempted` (1 pt) y `resolved` (1 pt extra), tope 8 pts por persona calculado automáticamente. Puntos de alianza: `3000 × (promedio / 8)`. Migración de datos con respaldo previo `data.json.bak_p2_gymkanas`. Verificado con `test/gymkanas.test.js`. |
| **P2.8** | Paridad de jugadores y alineaciones mínimas | Falta | **Resuelto** | Validación de paridad entre contendientes y mínimos por bases (Baby fútbol 5 a 7, Quemadas 6 a 8, Retro 4 a 5, Taca-taca y Ping Pong 2 a 3). Bloqueo automático ante disparidad: admite excepción administrativa autorizada con motivo en log de auditoría. Endpoint de ingreso de suplente `/api/admin/matches/substitute`. Verificado con `test/match_lineups.test.js`. |
| **P2.9** | Premios de nota académica (1.0, 0.5, 0.3) | Falta | **Resuelto** | Al cerrar el evento por administración (`/api/admin/event/close`), se calculan los premios de nota: 1° alianza 1,0: 2° alianza 0,5: 3° alianza 0,3. El sistema filtra y lista únicamente a los estudiantes que participaron efectivamente en al menos una actividad. Verificado con `test/grade_prizes.test.js`. |
| **P2.10** | Trazabilidad y cálculo automático en resto de actividades | Distinto | **Resuelto** | Implementado registro detallado en `config/rules.js` y `/api/admin/activity/detail`: Trivia (aciertos de 3 representantes + pregunta extra), Retro (4 duelos, rondas ganadas + duelo extra), Taca-taca y Ping Pong (victorias máx 8, diferencia de puntos + partido extra), Canto (participantes restantes en fila + canción extra), Barra y ruido (3 mediciones decibelímetro, promedio + nota jurado). Verificado con `test/detailed_activities.test.js`. |
| **P3.11** | Panel y reportes para jefatura y coordinación | Falta | **Resuelto** | Creado endpoint consolidado `GET /api/reports/jefatura` y pestaña dedicada en la interfaz administrativa con matriz de puntos por alianza y actividad, inscritos vs asistentes reales, tasa de participación, estado de actividades, detalle de sanciones y reclamos (dentro y fuera de plazo). Verificado con `test/reports_jefatura.test.js`. |
| **P3.12** | Revisión final de redacción y textos | Pendiente | **Resuelto** | Revisión integral de textos en español de Chile, directos y breves, sin punto y coma ni guiones como puntuación (uso de dos puntos). Corrección de leyendas de desempate en `public/app.js` y `public/admin/admin.js`. |

---

## Precisiones Numéricas y Fórmulas Auditadas

1. **Baby fútbol:**
   - Sin empate: 1° 4000 pts, 2° 2400 pts, 3° 1200 pts.
   - Empate en 1° lugar entre dos: 3200 pts cada una y la otra 1200 pts.
   - Empate en 2° lugar entre dos: 1800 pts cada una y la primera 4000 pts.
   - Empate triple: 2533,33 pts cada una (almacenado con decimales, redondeado a 2533 para visualización).
2. **Quemadas:**
   - 1° 3000 pts, 2° 1800 pts, 3° 900 pts.
   - Tabla: Victoria 3, Empate 1, Derrota 0. Desempate: Rondas ganadas y luego jugadores en pie.
3. **Taca-taca y Ping Pong:** 1000 / 600 / 300 pts.
4. **Trivia:** 2000 / 1200 / 600 pts.
5. **Gymkanas:** Promedio 6,0 = 2250 pts; Promedio 8,0 = 3000 pts; Ningún estudiante supera 8 pts.
6. **Desafío Creativo:**
   - Entrega a tiempo: 1000 pts.
   - Nota docente: 2000 pts al promediar 80.
   - Ejemplo de bases: Terror (83 y 87 = 85 prom) recibe 2125 pts; Shooter (85 y 89 = 87 prom) recibe 2175 pts; Action (85 y 91 = 88 prom) recibe 2200 pts. Action se adjudica los 500 pts completos de obra favorita.
   - Obra favorita empatada entre dos: 250 pts c/u; entre tres: 166,67 pts c/u.
   - Discrepancia > 20 pts: estado "revisión conjunta pendiente", puntaje provisional y fuera de obra favorita.
7. **Rúbrica Docente:** 4 niveles exactos (Excelente 100%, Bueno 80%, Regular 50%, Básico 20%). Cualquier otro nivel es rechazado.
8. **Sanciones:** Rechazo automático de cualquier monto inferior a 200 o superior a 600 pts.
9. **Reclamos:** Ventana estricta de 15 minutos tras el término real de la actividad.

---

## Dudas Abiertas y Decisiones para Jefatura / Usuario

1. **Criterios de rúbrica no entregados:**
   - *Situación:* Si una alianza no entrega un criterio de la rúbrica docente, las Bases oficiales no definen un nivel "Insatisfactorio" (0%).
   - *Estado provisorio adoptado:* Se deja el criterio como `"sin evaluar"` y no se inventa puntaje arbitrario. Se requiere ratificación de jefatura para definir si en esos casos se aplica 0 puntos formalmente o si se recalcula la base sobre los criterios entregados.
2. **Purga del historial Git por exposición de datos personales:**
   - *Situación:* El archivo `public/students-data.js` estuvo presente en commits anteriores del repositorio (`e7db218` y `042ed01`). Aunque fue borrado del árbol de trabajo en el commit `0249937`, sigue accesible en el historial de Git para quien clone el repositorio.
   - *Acción recomendada:* Ejecutar una reescritura de historial con `git-filter-repo` o `bfg-repo-cleaner` en el repositorio remoto antes de publicar el código, y notificar a la administración si la plataforma ya estuvo desplegada públicamente en la web.
3. **Empate general total persistente:**
   - *Situación:* Si tras aplicar los 3 niveles de desempate oficial (más primeros lugares, más puntos en deportes, mejor lugar en retro) persiste un empate absoluto entre alianzas en la cima del ranking global.
   - *Estado provisorio:* El sistema conserva el empate con indicador visual. Se sugiere a jefatura estipular un mecanismo de desempate relámpago presencial en caso de ocurrir.
