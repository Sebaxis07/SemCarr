# Plan de Refactorizacion Modular de app.js

Este documento detalla el analisis tecnico y la propuesta de refactorizacion de public/app.js para separar sus 3558 lineas en modulos limpios y desacoplados.

## 1. Inventario actual de public/app.js por responsabilidad

Actualmente public/app.js contiene todo el codigo del cliente en un solo bloque. A continuacion se detalla el inventario completo:

### Configuracion y constantes
* targetDate: fecha y hora de inicio del evento fijada en 2026-11-19T09:30:00-03:00.
* Intervalos de tiempo: refresco de estadisticas cada 4000 ms, rotacion automatica de proyector cada 15000 ms, refresco de cuenta regresiva cada 1000 ms, debounce de busqueda de alumnos en 250 ms.
* Constantes de vistas de proyector: leaderboard, podium y cancha.
* Limites de puntaje: MAX_EVENT_POINTS fijado en 32000.

### Estado de la aplicacion
* appData: objeto principal con alianzas, actividades, desafios creativos, copa tarreo, anuncios, sorpresas, sanciones y reclamos.
* currentTab: pestana activa actual (inicio, actividades, desafios, mialianza, reglas, premios, proyector).
* refreshInterval: referencia al timer de sondeo de estadisticas.
* countdownInterval: referencia al timer de la cuenta regresiva general.
* proyectorState: objeto con viewMode, autoCycle, autoCycleInterval, soundEnabled y lastTotals.
* proyectorAudioCtx: instancia de AudioContext para efectos de sonido sinteticos.
* currentActFilter: filtro seleccionado de actividades en cancha (all, Juegos, Deportes, Gymkanas, Musica, Creativo).
* allStudentsByAlliance: cache en memoria de la nomina completa de 281 alumnos.
* currentAllianceFilter: filtro de visualizacion de nominas (all, Terror, Shooter, Action).
* studentSearchDebounce: identificador del timer para evitar llamadas repetidas al escribir.

### Funciones auxiliares y utilidades
* playProyectorSound(type): sintetizador de audio Web Audio API para alertas de puntos y sorpresas.
* toggleProyectorFullscreen(): activa o cancela la pantalla completa en el navegador.
* getActivityPodium(act): calcula primer, segundo y tercer lugar de una actividad terminada resolviendo empates.
* initCountdown(): calcula y actualiza los textos del reloj hacia el inicio del evento.
* updateLiveAnnouncement(): refresca el cintillo superior de avisos oficiales o sorpresa activa.
* updatePublicSorpresaCountdown(): actualiza el segundero de preparacion de una prueba sorpresa.

### Acceso a datos y servicios
* loadStats(): consulta GET /api/stats, detecta variaciones en puntajes para activar alertas sonoras y actualiza appData.
* loadAllStudentsByAlliance(): consulta GET /api/students/by-alliance y almacena el resultado en cache.
* handleStudentSearch(val): consulta GET /api/students/search con retraso de 250 ms.

### Logica de negocio y navegacion
* navigate(tab): cambia de pantalla, actualiza clases de botones de navegacion y dispara el renderizado.
* setProyectorView(mode): cambia la vista activa del proyector y redibuja la pantalla si corresponde.
* toggleProyectorAutoCycle(): alterna la rotacion ciclica automatica de vistas cada 15 segundos.
* toggleProyectorSound(): activa o silencia el sistema de audio sintetico.
* setActFilter(group): actualiza la categoria activa y refresca el listado de actividades.
* setAllianceFilter(filter): cambia la alianza activa en el roster de estudiantes y actualiza estilos.
* selectStudentForSearch(name): rellena la barra de busqueda con un nombre y ejecuta la consulta.
* clearStudentSearch(): limpia el campo de busqueda de alumnos y sus resultados.

### Dibujo de la interfaz (UI)
* renderCurrentTab(): orquesta que vista renderizar en el contenedor principal segun currentTab.
* renderInicio(): genera el HTML completo de la pantalla de bienvenida, podio actual, accesos y clasificacion por actividad.
* renderBigScreen(): genera el HTML del modo proyector en vivo con ranking, barras comparativas, podio y estado de cancha.
* renderActividades(): genera el HTML de la grilla de actividades con tarjetas individuales y filtros.
* renderDesafios(): genera el HTML de los desafios creativos con inteligencia artificial y rubricas de evaluacion.
* renderMiAlianza(): genera el HTML de la seccion Mi Alianza con buscador de alumnos y carnets deportivos.
* renderAlliancesRoster(): inserta el contenido de las nominas completas en su contenedor.
* renderAlliancesRosterContent(): genera las tarjetas de las 3 alianzas y el listado de alumnos.
* renderReglas(): genera la documentacion completa de distribucion de puntajes, desempates y preguntas frecuentes.
* renderPremios(): genera la vista de bonificaciones en notas finales, cuadro de honor y veredicto definitivo.
* openActivityDetail(id): construye e inyecta el modal informativo con reglamento de cada actividad.
* openCreativeDetail(): construye e inyecta el modal informativo sobre las entregas de desafios creativos.

### Manejo de eventos e inicializacion
* document.addEventListener('DOMContentLoaded'): dispara loadStats(), inicia el intervalo de 4 segundos, actualiza iconos Lucide y registra listeners de teclado.
* window.addEventListener('keydown'): atajos de teclado para proyector (P, 1, 2, 3, R, M, F, Escape).
* setInterval(updatePublicSorpresaCountdown, 1000): reloj en vivo para pruebas sorpresas.

---

## 2. Mapa de dependencias y estado compartido

Actualmente existe acoplamiento debido a que variables globales son leidas y mutadas desde multiples funciones:
* appData es leido por todas las funciones de renderizado (renderInicio, renderBigScreen, renderActividades, renderDesafios, renderMiAlianza, renderPremios, openActivityDetail, openCreativeDetail).
* currentTab determina el comportamiento reactivo de loadStats(), navigate(), setProyectorView() y atajos de teclado.
* proyectorState comparte configuracion de audio y vistas entre la logica del proyector, los atajos de teclado y la UI del proyector.
* Los atributos onclick y oninput en el HTML generado dinamicamente invocan directamente funciones en el ambito global de window.

Solucion de desacoplamiento:
* El estado residira en un modulo central de estado con funciones de acceso y actualizacion controladas.
* Para preservar compatibilidad total con los templates HTML sin tocar su estructura, el punto de entrada principal expondra en window las funciones que son invocadas desde inline handlers.

---

## 3. Estructura de carpetas y modulos propuesta

La estructura se ubicara bajo public/src/ para ser servida directamente por el servidor estatico actual sin requerir cambios de configuracion en el backend:

public/src/
  main.js
  Punto de entrada de la aplicacion. Inicializa modulos, expone funciones globales necesarias en window y arranca la app.
  
  config/
    constantes.js
    Contiene valores constantes como fechas, tiempos de intervalo, claves de alianzas y configuraciones fijas. Exporta EVENT_CONFIG y PROYECTOR_CONFIG.
    
  estado/
    estado.js
    Almacena el estado reactivo centralizado. Exporta getAppData, setAppData, getCurrentTab, setCurrentTab, getProyectorState, getCurrentActFilter, setCurrentActFilter, getAllStudentsByAlliance, setAllStudentsByAlliance, getCurrentAllianceFilter, setCurrentAllianceFilter.
    
  servicios/
    api.js
    Gestiona todas las peticiones fetch al servidor. Exporta fetchStats, fetchStudentsByAlliance y fetchStudentsSearch.
    
  utils/
    audio.js
    Sintetizador Web Audio API para alertas sonoras. Exporta playProyectorSound.
    pantalla.js
    Control de modo pantalla completa. Exporta toggleProyectorFullscreen.
    podio.js
    Calculo de posiciones y desempates de actividades terminadas. Exporta getActivityPodium.
    cuenta_regresiva.js
    Logica de timers y cuenta regresiva. Exporta initCountdown y updatePublicSorpresaCountdown.
    
  logica/
    proyector.js
    Reglas de negocio y cambios de estado del proyector. Exporta setProyectorView, toggleProyectorAutoCycle y toggleProyectorSound.
    filtros.js
    Gestion de filtros de actividades y de alianzas. Exporta setActFilter y setAllianceFilter.
    estudiantes.js
    Logica de consulta de alumnos y autocompletado. Exporta handleStudentSearch, selectStudentForSearch, clearStudentSearch y loadAllStudentsByAlliance.
    sincronizacion.js
    Sondeo periodico de datos y deteccion de cambios en vivo. Exporta loadStats y updateLiveAnnouncement.
    navegacion.js
    Enrutamiento interno entre pantallas. Exporta navigate y renderCurrentTab.
    
  ui/
    inicio.js
    Generador de la vista de inicio y resumen de actividades. Exporta renderInicio.
    proyector.js
    Generador de la vista de pantalla grande para transmision. Exporta renderBigScreen.
    actividades.js
    Generador del catalogo de competencias y tarjetas de eventos. Exporta renderActividades.
    desafios.js
    Generador de la seccion de desafios creativos con IA. Exporta renderDesafios.
    alianzas.js
    Generador de la pantalla Mi Alianza y listados de integrantes. Exporta renderMiAlianza, renderAlliancesRoster y renderAlliancesRosterContent.
    reglas.js
    Generador de las bases de puntajes y preguntas frecuentes. Exporta renderReglas.
    premios.js
    Generador del cuadro de honor y premios en nota final. Exporta renderPremios.
    modales.js
    Generadores de ventanas modales con reglamentos detallados. Exporta openActivityDetail y openCreativeDetail.
    
  eventos/
    teclado.js
    Controlador de atajos de teclado para el modo proyector. Exporta registrarAtajosTeclado.

---

## 4. Orden de migracion propuesto

La migracion se realizara de forma incremental, de lo mas independiente a lo mas conectado, verificando que la aplicacion continue funcionando en cada etapa:

1. Paso 2.1: Crear constantes y estado base.
   Crear config/constantes.js y estado/estado.js.
   
2. Paso 2.2: Migrar utilidades puras.
   Crear utils/podio.js, utils/pantalla.js, utils/audio.js y utils/cuenta_regresiva.js.
   
3. Paso 2.3: Migrar capa de servicios de datos.
   Crear servicios/api.js.
   
4. Paso 2.4: Migrar modulos de logica sin DOM.
   Crear logica/proyector.js, logica/filtros.js, logica/estudiantes.js y logica/sincronizacion.js.
   
5. Paso 2.5: Migrar componentes de UI independientes.
   Crear ui/reglas.js, ui/premios.js, ui/desafios.js, ui/actividades.js y ui/modales.js.
   
6. Paso 2.6: Migrar componentes de UI mayores.
   Crear ui/inicio.js, ui/proyector.js y ui/alianzas.js.
   
7. Paso 2.7: Migrar navegacion y eventos.
   Crear logica/navegacion.js y eventos/teclado.js.
   
8. Paso 2.8: Crear main.js y conectar carga en public/index.html.
   Crear main.js vinculando las funciones necesarias en window para garantizar la compatibilidad con los eventos inline del HTML. Actualizar la etiqueta script en index.html a type="module" apuntando a /src/main.js.
   
9. Paso 2.9: Depuracion, verificacion en consola y pruebas automatizadas.
   Confirmar ausencia de errores y verificar concordancia de comportamiento.

---

## 5. Analisis de riesgos y mitigaciones

* Riesgo 1: Funciones globales llamadas desde onclick y oninput en el HTML.
  Mitigacion: main.js asignara explicitamente al objeto window cada una de las funciones invocadas desde el HTML (navigate, setAllianceFilter, openActivityDetail, openCreativeDetail, setProyectorView, toggleProyectorAutoCycle, toggleProyectorSound, toggleProyectorFullscreen, setActFilter, clearStudentSearch, selectStudentForSearch, handleStudentSearch). De este modo el HTML y las plantillas no sufriran ninguna alteracion.
  
* Riesgo 2: Dependencias circulares entre estado, logica y UI.
  Mitigacion: Se mantendra un flujo unidireccional estricto. La UI lee el estado pero delega las mutaciones a la logica. La logica actualiza el estado y solicita redibujado a traves del enrutador. Ningun modulo de utils o servicios dependera de la UI.
  
* Riesgo 3: Restriccion CORS al abrir via protocolo file://.
  Mitigacion: Los modulos ES requieren ejecucion bajo servidor HTTP. El proyecto cuenta con el servidor Express en server.js iniciado mediante iniciar_servidor.bat en http://localhost:5173. Se documentara claramente este requisito en el README.
  
* Riesgo 4: Iconos dinamicos de Lucide Icons.
  Mitigacion: Cada funcion de UI que altere el DOM mantendra su llamado a lucide.createIcons() exactamente como opera en el codigo original.
