# Notas del Proceso de Refactorizacion

Registro de observaciones, decisiones tecnicas y anomalias detectadas durante la separacion modular de public/app.js.

## 1. Cosas raras o anomalias detectadas y no tocadas
* Boton de cierre de modal en index.html: En la linea 298 de public/index.html existe el elemento con onclick="closeCalcModal()". Dicha funcion nunca estuvo definida en el public/app.js original. Siguiendo las reglas de refactorizacion pura, no se agrego ninguna funcion nueva y se dejo tal como estaba.
* Busqueda publica de alumnos: La funcion handleStudentSearch consulta directamente a /api/students/search con manejo interno de excepciones mediante console.warn. Se preservo exactamente la misma logica y formato de respuesta.
* Estructuras en estado inicial: El objeto inicial de appData define campos como tarreoCopa, sanciones y reclamos que la vista publica actual no dibuja directamente, pero que forman parte del contrato de datos. Se mantuvieron intactos en el estado central.

## 2. Decisiones tomadas
* Ubicacion de los modulos en public/src/: Se eligio colocar los modulos en public/src/ para que el servidor Express existente en server.js los entregue de manera nativa sin alterar la configuracion del servidor ni requerir herramientas de empaquetado adicionales.
* Compatibilidad con eventos inline: El HTML y las plantillas dinamicas utilizan atributos onclick y oninput que esperan encontrar funciones en el ambito global. En public/src/main.js se asignaron explicitamente estas funciones al objeto window para asegurar que la aplicacion funcione exactamente igual sin reescribir las plantillas.
* Archivo public/app.js residual: En lugar de eliminar por completo public/app.js, se redujo a una linea que delega la carga importando public/src/main.js. Esto asegura retrocompatibilidad si algun script o marcador externo intentara cargarlo.
* Configuracion de modulos en public/src/package.json: Se incluyo un package.json local indicando type module para formalizar el uso de ES modules en la carpeta cliente.

## 3. Renombres de funciones o variables
* No se realizo ningun renombre. Todas las funciones, parametros y propiedades conservaron sus nombres originales.
