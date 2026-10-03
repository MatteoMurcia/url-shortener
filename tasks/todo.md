# Tareas — primera entrega local

Estado: T01–T04 completados y fusionados; T05 completado y verificado en navegador; T06 y checkpoint C verificados en navegador; T07 fusionado; T08 fusionado y checkpoint D completado; T09–T12 pendientes.
Arquitectura y definición de terminado: [plan.md](plan.md).
Los comandos de T01–T08 ya funcionan; los de T09–T12 son contratos futuros.
Los archivos indicados son estimaciones, no archivos ya creados. Si una tarea
supera cinco archivos de implementación o una sesión enfocada, dividirla antes
de ejecutarla. No se estiman horas sin conocer dedicación y restricciones.

## T01 — Preparar herramientas

Definir el paquete npm y las comprobaciones estáticas del proyecto.

- [x] Aceptación: dependencias fijadas en lockfile; TypeScript estricto y lint configurados.
- [x] Aceptación: scripts de esta entrega declarados y secretos/dependencias excluidos de Git.
- Verificación: `npm ci`; `npm run typecheck`; `npm run lint` sobre la configuración inicial.
- Dependencias: revisión del plan y petición explícita de iniciar implementación.
- Archivos: `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `.gitignore`.
- Tamaño: M, 5 archivos.

Resultado T01 (2026-10-01): `npm ci`, `npm run typecheck` y `npm run lint`
completados con éxito. `git check-ignore` confirma exclusión de `.env`, variantes,
`.npmrc`, claves, `node_modules` y `dist`, y permite `.env.example`. Se comprueba
la configuración ESLint con TypeScript (`allowJs` + `checkJs`) mientras aún no
hay fuentes de aplicación. Se fijó TypeScript 6.0.3 por compatibilidad con
typescript-eslint 8.71.0. No hay build ni tests de aplicación en esta tarea.

Ampliación autorizada: inicializar Git y conectar GitHub. Incluye README inicial
y actualización del estado de estos documentos; no implementa T02. Los scripts
de desarrollo, build y pruebas se introducirán con sus tareas para evitar
comandos que aparenten funcionar sin implementación.

## T02 — Ejecutar la aplicación mínima

Poner en marcha una página React servida junto a un backend Express mínimo.

- [x] Aceptación: desarrollo muestra una página y un endpoint de salud responde 200.
- [x] Aceptación: build local arranca y sirve la página; configuración básica de entorno validada.
- Verificación: `npm run dev`; `npm run build`; `npm start`; abrir la página y `/api/health`.
- Dependencias: T01.
- Archivos: `src/server/main.ts`, `src/server/app.ts`, `src/client/main.tsx`, `src/client/App.tsx`, `index.html`.
- Tamaño: M, 5 archivos. Si scripts necesitan ajustes, separarlos de esta tarea.

Desglose de T02 acordado con su implementación:
- T02a: dependencias, scripts y configuración TypeScript (4 archivos).
- T02b: backend, configuración de entorno y pruebas HTTP/configuración (5 archivos).
- T02c: página React, estilos, entrada HTML y tipos de recursos (5 archivos).
- Documentación y evidencias se actualizan al verificar el conjunto.

Ajuste técnico: Express incorpora Vite como middleware en desarrollo, compartiendo
puerto con la API; no se necesita proxy en T03. Vitest se introduce ahora para
probar el contrato de salud y la validación de entorno. En T03 se ampliará para
las pruebas con PostgreSQL. La interfaz inicial será una página de presentación
accesible, con colores neutros y acento verde, sin simular creación de enlaces.

Verificación T02 (2026-10-01): 13 pruebas Vitest pasan. `npm run build` incluye
comprobación de tipos; `npm run lint` pasa. Se comprobaron HTTP 200 para `/` y
`/api/health`, y JSON 404 para `/api/missing`, tanto en desarrollo (3000) como
en producción local (3001). Navegador real: React visible en ambos modos, consola
sin errores ni advertencias, sin desbordamiento horizontal a 320/768/1024/1440 px
y navegación mediante teclado. No hay persistencia ni acortamiento todavía.

### Checkpoint A — Base ejecutable

- [x] Tipos, lint y build pasan; arranque comprobado en desarrollo y build local.
- [x] Revisar con Matteo la estructura antes de incorporar persistencia. PR #1 fusionada por Matteo; autorizado continuar con T03.

## T03 — Preparar datos y entorno de pruebas

Conectar PostgreSQL local y ampliar la configuración de pruebas para persistencia.

Desglose: T03a configura Compose y entorno; T03b añade pool y pruebas de conexión
con base aislada; T03c separa proyectos Vitest y actualiza scripts/configuración.
Cada parte mantiene un alcance de hasta cinco archivos de implementación.
Dos instancias PostgreSQL locales separan desarrollo (volumen persistente) de
pruebas (almacenamiento temporal); no se implementa aún el esquema de enlaces.

- [x] Aceptación: Compose inicia PostgreSQL con comprobación de salud y volumen persistente.
- [x] Aceptación: configuración de ejemplo distingue base de desarrollo y de pruebas.
- [x] Aceptación: pool de conexiones funciona; el runner existente distingue pruebas unitarias y de integración.
- Verificación: `docker compose up -d db`; `docker compose ps`; probar conexión y aislamiento; `npm run build`.
- Dependencias: T02.
- Archivos: `compose.yaml`, `.env.example`, `src/server/db.ts`, `package.json`, `vitest.config.ts`.
- Tamaño: M, 5 archivos.

Evidencia T03 (2026-10-01): 26 pruebas sin PostgreSQL y 2 de integración pasan;
lint y build (incluido typecheck) pasan. Ambos contenedores están saludables.
La identidad del clúster de desarrollo se mantiene tras reemplazar el contenedor,
demostrando reutilización del volumen. Las pruebas verifican bases distintas,
consultas parametrizadas y rollback sin tablas persistentes. `.env` es local e
ignorado; el pool se conectará a las rutas al implementar enlaces.

## T04 — Crear el esquema reproducible

Versionar el esquema de enlaces y comprobar su instalación en una base vacía.

- [x] Aceptación: migración crea las columnas de `links` y la clave única especificadas.
- [x] Aceptación: historial evita reaplicar migraciones; fallo revierte la transacción.
- [x] Aceptación: preparación de pruebas rechaza limpiar la base de desarrollo.
- Verificación: `npm run db:migrate` dos veces; `npm run test:integration -- tests/migrations.integration.test.ts`.
- Dependencias: T03.
- Archivos: `db/migrations/001_links.sql`, `scripts/migrate.ts`, `tests/database.ts`, `tests/migrations.integration.test.ts`.
- Tamaño: M, 4 archivos.

T04 se entregó en pasos separados: esquema y helper aislado; ejecutor y CLI;
pruebas de rollback; documentación. PR #2 confirmada como fusionada antes de
crear la rama. Evidencia (2026-10-02): 27 pruebas sin PostgreSQL y 7 de integración
pasan; lint y build (con typecheck) pasan. `npm run db:migrate` aplicó
`001_links.sql` en `url_shortener` local y una segunda ejecución no hizo cambios.
Pruebas reales verifican restricciones, concurrencia, rollback desde una base
vacía y preservación de datos/historial ya existentes. La limpieza solo elimina
el esquema generado por cada prueba dentro de `url_shortener_test`.

### Checkpoint B — Persistencia preparada

- [x] Base vacía reproducible, migración repetible y aislamiento de pruebas comprobados.
- [x] Revisar modelo y contrato HTTP con Matteo antes de conectar el flujo principal: PR #3 fusionada; Matteo autorizó T05.

## T05 — Crear un enlace desde la interfaz

Implementar una entrega vertical: formulario, API, generación de código e inserción.

- [x] Aceptación: URL válida genera 201 con código, destino y enlace basado en `BASE_URL`.
- [x] Aceptación: el formulario muestra resultado solo después de persistir y evita envíos repetidos mientras espera.
- [x] Aceptación: generación criptográfica e inserción respetan el contrato; el error básico no filtra detalles internos.
- Verificación: `npm run test:integration -- tests/create-link.integration.test.ts`; crear un enlace desde la página y comprobar la fila guardada.
- Dependencias: T04.
- Archivos: `src/server/links.ts`, `src/server/app.ts`, `src/server/db.ts`, `src/client/App.tsx`, `tests/create-link.integration.test.ts`.
- Tamaño: M, 5 archivos.

Desglose T05: servicio de creación y pruebas; configuración `BASE_URL`;
conexión de la API al pool y prueba HTTP; formulario React; documentación.
Cada paso se registra en un commit separado. Se incorporó la validación básica
necesaria para guardar datos seguros; T07 ampliará los casos y T08 comprobará
colisiones forzadas y concurrencia. No se añadieron dependencias.

Evidencia (2026-10-02): 44 pruebas unitarias y 9 de integración pasan, junto a
lint y build (incluye typecheck). La prueba HTTP verifica 201 después de guardar,
origen independiente de Host y 503 sin detalles de SQL. Smoke del build local:
página 200, creación 201, fila persistida, origen configurado, JSON mal formado
400 y cuerpo grande 413. Se eliminó solo la fila creada por ese smoke.

Verificación de navegador completada (2026-10-02): con un bloqueo temporal de
inserción en PostgreSQL, el formulario mostró Saving, deshabilitó campo/botón y
no mostró resultado. Tras otro clic y Enter, se comprobó exactamente una
inserción esperando y cero filas guardadas. Al liberar el bloqueo apareció el
enlace; su código m0HZ0VzI2-xd coincidió con la única fila del destino de prueba.
También se comprobó error FTP sin falso éxito, entrada conservada, envío con
Tab/Enter y presentación a 375 px sin desbordamiento horizontal. No hubo errores
nuevos de consola al recargar; permanecían dos errores antiguos de Vite de la
página anterior. No se modificó código ni se dejaron bloqueos activos.
La evidencia de T05 se entregó en PR #5. La redirección se incorpora en T06.

## T06 — Abrir el enlace corto

Resolver un código y redirigir a la URL persistida sin descargarla en el backend.

- [x] Aceptación: enlace existente responde 302 con destino completo y `Cache-Control: no-store`.
- [x] Aceptación: código inválido o inexistente muestra 404; fallos de base de datos no se confunden con inexistentes.
- [x] Aceptación: reiniciar el backend conserva el funcionamiento de enlaces ya creados.
- Verificación: `npm run test:integration -- tests/redirect.integration.test.ts`; crear, abrir, reiniciar y volver a abrir un enlace.
- Dependencias: T05.
- Archivos: `src/server/app.ts`, `src/server/db.ts`, `tests/redirect.integration.test.ts`.
- Tamaño: M, 3 archivos.

Evidencia T06 (2026-10-02): prueba de integración primero falló con 404 en lugar
de 302 y después pasó. Se verifican Location completo, no-store, 404 por código
inválido/ausente y 503 genérico ante fallo de consulta. Dos instancias sucesivas
del servidor reutilizan los datos. Smoke del proceso compilado: crear, seguir
redirección a un destino local, terminar el proceso, arrancar otro y abrir el
mismo código con éxito. 44 pruebas unitarias y 10 de integración pasan; build y
lint pasan. Un worker de integración avisó de cierre lento; su archivo aislado
se repitió sin advertencia. Sin nuevas dependencias.

La limitación de navegación inicial se resolvió en el checkpoint C usando un
destino HTML local controlado. PR #6 fusionada en la rama de documentación;
la PR del checkpoint lleva T06 y esta evidencia a main.

### Checkpoint C — Primer recorrido funcional

- [x] Crear y abrir un enlace funciona de extremo a extremo y tras reinicio.
- [x] Demostrar el recorrido a Matteo; revisar decisiones antes de ampliar casos.

Evidencia del checkpoint (2026-10-03): se creó desde el formulario el código
`xGcmNW162GUA`, con destino HTML local
`http://127.0.0.1:3002/checkpoint-c?source=short-link#verified`. Al pulsar
Open short link el navegador mostró Destino de prueba alcanzado, conservando
query y fragmento. Se detuvieron el proceso Node del backend y su watcher, se
arrancó de nuevo con npm run dev y se abrió el mismo enlace: volvió a mostrar
el destino correcto. No se recreó el enlace ni la base de datos. La captura
del resultado se presentó a Matteo en el chat.

Revisión de decisiones: mantener monolito, PostgreSQL como fuente de verdad,
302 con no-store y resolución sin descargar el destino. No se necesitan caché,
colas ni servicios nuevos para este recorrido. Esta revisión no implica aprobar
T07 ni completar las pruebas E2E automatizadas previstas en T10. El destino
del puerto 3002 es un servidor temporal de demostración, no parte del producto.

## T07 — Rechazar entradas inválidas con feedback útil

Completar la validación del contrato y presentar errores comprensibles en la UI.

- [x] Aceptación: cubrir tipos incorrectos, JSON mal formado, vacío, longitud, credenciales y protocolos no permitidos.
- [x] Aceptación: cuerpos mayores del límite reciben 413; errores esperados usan el formato acordado.
- [x] Aceptación: el formulario conserva la entrada y anuncia el error sin fingir éxito.
- Verificación: `npm test -- tests/validation.test.ts`; `npm run test:integration -- tests/create-link.integration.test.ts`; revisión manual de errores.
- Dependencias: T06.
- Archivos: `src/server/links.ts`, `src/server/app.ts`, `src/client/App.tsx`, `tests/validation.test.ts`, `tests/create-link.integration.test.ts`.
- Tamaño: M, 5 archivos.

Evidencia T07 (2026-10-03): la implementación básica de T05 ya satisface el
contrato; se amplió su cobertura sin modificar código de aplicación ni añadir
dependencias. Se renombró links.test.ts a validation.test.ts y se cubrieron
20 casos unitarios, incluido el límite exacto de 2048 caracteres tras trim.
La prueba HTTP comprueba 21 cuerpos inválidos: tipos, vacío, formato, credenciales,
protocolos, longitud y límite de 8 KiB con ASCII y UTF-8 multibyte. Verifica
status, Content-Type, formato exacto del error y cero filas insertadas.

Navegador real: después de crear un enlace, una URL con credenciales elimina el
resultado previo, conserva el texto y muestra role=alert con aria-invalid=true.
Vacío activa validación nativa; FTP recibe feedback del servidor. Corregir la
URL limpia el error y permite crear de nuevo. Se inspeccionaron los atributos
accesibles; no se afirma una prueba con lector de pantalla. 54 pruebas unitarias,
11 de integración, build (incluye typecheck) y lint pasan.

## T08 — Comprobar colisiones y fallos de persistencia

Probar los riesgos que el flujo normal difícilmente reproduce.

- [x] Aceptación: colisión forzada reintenta hasta el límite sin sobrescribir el enlace anterior.
- [x] Aceptación: agotamiento de intentos o base indisponible produce 503 sin filtrar detalles.
- [x] Aceptación: creaciones concurrentes conservan asociaciones correctas entre códigos y destinos.
- Verificación: `npm run test:integration -- tests/link-resilience.integration.test.ts`; pruebas con PostgreSQL real y generador controlado para provocar colisiones.
- Dependencias: T07.
- Archivos: `src/server/links.ts`, `src/server/db.ts`, `tests/link-resilience.integration.test.ts`.
- Tamaño: M, 3 archivos.

Evidencia T08 (2026-10-03): cuatro pruebas con PostgreSQL real en esquemas
aislados. Generador controlado únicamente en el archivo de pruebas, sin cambios
de producción. Dos colisiones seguidas permiten éxito en el tercer intento;
tres colisiones producen exactamente tres intentos y HTTP 503 genérico, sin
sobrescribir la fila original. Una conexión real cerrada produce el mismo 503
sin detalles internos y sin reintentos de consulta.

Concurrencia: cuatro conexiones independientes comparten esquema y código
inicial; una gana y las otras tres reintentan con códigos distintos controlados.
Se comprueban cuatro asociaciones código/destino exactas y siete intentos totales.
Se espera a todas las operaciones antes de limpiar incluso si alguna falla.
54 pruebas unitarias, 15 de integración, build/typecheck y lint pasan. Sin
cambios de UI, nuevas dependencias ni cambios en la base de desarrollo. El
checkpoint D se revisó a continuación.

### Checkpoint D — Contrato resistente a errores

- [x] Integración y regresiones pasan; revisar evidencia de concurrencia y errores.
- [x] Comprobar con Matteo que la complejidad añadida responde a casos verificables.

Revisión del checkpoint D (2026-10-03), sobre main con PR #9 fusionada:
54 pruebas unitarias y 15 de integración, build/typecheck y lint pasan. Se
revisaron validación antes de insertar, consultas parametrizadas, unicidad de
PostgreSQL, tres intentos acotados, respuestas 400/413/503 y limpieza de esquemas.
No se identificaron bloqueos para este hito local.

Prueba de sensibilidad: se cambió temporalmente el límite de tres intentos a
dos. Fallaron las dos pruebas esperadas (éxito en tercer intento y agotamiento).
Se restauró el archivo byte a byte; git confirmó ausencia de cambios en
producción y las cuatro pruebas de resiliencia volvieron a pasar.

Revisión compartida con Matteo: T07/T08 añadieron pruebas y documentación, sin
cambiar producción ni dependencias. El generador controlado permite reproducir
colisiones; las cuatro conexiones prueban asociaciones concurrentes; el helper
HTTP comprueba el contrato 503; los esquemas aislados protegen los datos locales.
No se necesitan caché, cola ni capa de reintentos adicional. Límites de evidencia:
cuatro conexiones no equivalen a una prueba de carga; conexión cerrada no prueba
recuperación del clúster; no se declara el proyecto listo para producción.
T09–T12 mantienen su alcance pendiente.

## T09 — Completar copia y accesibilidad

Hacer utilizable la experiencia en móvil y mediante teclado.

- [ ] Aceptación: botón de copia confirma éxito solo si Clipboard funciona; alternativa manual visible si falla.
- [ ] Aceptación: etiquetas, foco visible y anuncios accesibles para estados y errores.
- [ ] Aceptación: URLs largas no rompen el diseño en móvil o escritorio.
- Verificación: recorrido manual con teclado y anchuras de 360 y 1280 píxeles; probar copia disponible y denegada; `npm run build`.
- Dependencias: T08.
- Archivos: `src/client/App.tsx`, `src/client/styles.css`, `src/client/main.tsx`.
- Tamaño: M, 3 archivos.

## T10 — Automatizar el recorrido web

Verificar la aplicación completa desde el navegador usando un destino controlado.

- [ ] Aceptación: prueba crea el enlace y sigue la redirección hasta un servidor local de prueba.
- [ ] Aceptación: pruebas cubren error de validación, 404 y copia exitosa/fallida.
- [ ] Aceptación: pruebas utilizan datos aislados y no dependen de sitios externos.
- Verificación: `npx playwright install chromium`; `npm run test:e2e`; inspeccionar resultados y trazas solo si hay fallos.
- Dependencias: T09.
- Archivos: `playwright.config.ts`, `e2e/links.spec.ts`, `e2e/destination-server.ts`, `e2e/setup.ts`.
- Tamaño: M, 4 archivos.

### Checkpoint E — Experiencia comprobada

- [ ] Flujo web automatizado pasa; revisión móvil y teclado completada.
- [ ] Revisar con Matteo el resultado y las limitaciones antes de preparar entrega local.

## T11 — Completar operación local

Añadir señales mínimas para diagnosticar fallos y terminar el proceso limpiamente.

- [ ] Aceptación: petición produce log con identificador, estado y duración sin destinos completos ni secretos.
- [ ] Aceptación: configuración inválida impide arrancar con error comprensible; proceso cierra servidor y pool.
- [ ] Aceptación: rutas desconocidas de API no devuelven la página frontend como respuesta exitosa.
- Verificación: `npm run test:integration -- tests/operations.integration.test.ts`; `npm run build`; `npm start`; comprobar cierre y logs.
- Dependencias: T10.
- Archivos: `src/server/main.ts`, `src/server/app.ts`, `src/server/db.ts`, `tests/operations.integration.test.ts`.
- Tamaño: M, 4 archivos.

## T12 — Preparar una entrega reproducible

Documentar el proyecto y preparar CI para cuando se publique en GitHub.

- [ ] Aceptación: README explica arranque desde cero, configuración, pruebas, API y limitaciones de la demo local.
- [ ] Aceptación: decisiones documentan códigos aleatorios, 302, PostgreSQL y ausencia de caché con sus compromisos.
- [ ] Aceptación: workflow configura PostgreSQL de pruebas y ejecuta tipos, lint, pruebas y build; primera ejecución remota queda pendiente hasta publicar.
- Verificación: seguir README desde un entorno limpio; ejecutar `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:integration`, `npm run test:e2e`, `npm run build`; revisar workflow sin afirmar que corrió en GitHub.
- Dependencias: T11.
- Archivos: `README.md`, `docs/architecture.md`, `.github/workflows/ci.yml`, `.env.example`.
- Tamaño: M, 4 archivos.

### Checkpoint F — Primera entrega local terminada

- [ ] Todos los criterios de SPEC.md están vinculados a evidencia y comprobaciones satisfactorias.
- [ ] Matteo puede ejecutar y explicar el proyecto; limitaciones y pendientes quedan documentados.
- [ ] Distinguir entrega local, publicación del repositorio y despliegue público; no afirmar que los dos últimos se han realizado.

## Trazabilidad de la especificación

| Criterio de SPEC.md | Tareas que lo implementarán y comprobarán |
|---|---|
| 1: creación persistente y origen configurado | T05, T10 |
| 2: validación de URLs | T07, T10 |
| 3: redirección y 404 | T06, T10 |
| 4: generación y colisiones | T05, T08 |
| 5: persistencia tras reinicio | T03, T04, T06 |
| 6: accesibilidad y copia | T09, T10 |
| 7: errores de persistencia y tamaño JSON | T07, T08, T11 |
| 8: recorrido web controlado | T10 |
