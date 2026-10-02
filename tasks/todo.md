# Tareas — primera entrega local

Estado: T01–T04 completados y fusionados; T05 implementado, pendiente de verificar
el formulario en navegador; T06–T12 pendientes.
Arquitectura y definición de terminado: [plan.md](plan.md).
Los comandos de T01–T05 ya funcionan; los de T06–T12 son contratos futuros.
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
- [ ] Aceptación: el formulario muestra resultado solo después de persistir y evita envíos repetidos mientras espera.
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

Pendiente: crear desde el formulario, contrastar su fila y revisar estados de
espera/error y presentación móvil/teclado. Matteo confirma que ve la página
activa, pero la herramienta de navegador sigue bloqueada por política de URL
en una página interna `data:` de error de conexión anterior. No se declara esa
verificación realizada; la PR queda en borrador hasta completarla. T06 no se
ha iniciado y los enlaces generados todavía no redirigen.

## T06 — Abrir el enlace corto

Resolver un código y redirigir a la URL persistida sin descargarla en el backend.

- [ ] Aceptación: enlace existente responde 302 con destino completo y `Cache-Control: no-store`.
- [ ] Aceptación: código inválido o inexistente muestra 404; fallos de base de datos no se confunden con inexistentes.
- [ ] Aceptación: reiniciar el backend conserva el funcionamiento de enlaces ya creados.
- Verificación: `npm run test:integration -- tests/redirect.integration.test.ts`; crear, abrir, reiniciar y volver a abrir un enlace.
- Dependencias: T05.
- Archivos: `src/server/app.ts`, `src/server/db.ts`, `tests/redirect.integration.test.ts`.
- Tamaño: M, 3 archivos.

### Checkpoint C — Primer recorrido funcional

- [ ] Crear y abrir un enlace funciona de extremo a extremo y tras reinicio.
- [ ] Demostrar el recorrido a Matteo; revisar decisiones antes de ampliar casos.

## T07 — Rechazar entradas inválidas con feedback útil

Completar la validación del contrato y presentar errores comprensibles en la UI.

- [ ] Aceptación: cubrir tipos incorrectos, JSON mal formado, vacío, longitud, credenciales y protocolos no permitidos.
- [ ] Aceptación: cuerpos mayores del límite reciben 413; errores esperados usan el formato acordado.
- [ ] Aceptación: el formulario conserva la entrada y anuncia el error sin fingir éxito.
- Verificación: `npm test -- tests/validation.test.ts`; `npm run test:integration -- tests/create-link.integration.test.ts`; revisión manual de errores.
- Dependencias: T06.
- Archivos: `src/server/links.ts`, `src/server/app.ts`, `src/client/App.tsx`, `tests/validation.test.ts`, `tests/create-link.integration.test.ts`.
- Tamaño: M, 5 archivos.

## T08 — Comprobar colisiones y fallos de persistencia

Probar los riesgos que el flujo normal difícilmente reproduce.

- [ ] Aceptación: colisión forzada reintenta hasta el límite sin sobrescribir el enlace anterior.
- [ ] Aceptación: agotamiento de intentos o base indisponible produce 503 sin filtrar detalles.
- [ ] Aceptación: creaciones concurrentes conservan asociaciones correctas entre códigos y destinos.
- Verificación: `npm run test:integration -- tests/link-resilience.integration.test.ts`; pruebas con PostgreSQL real y generador controlado para provocar colisiones.
- Dependencias: T07.
- Archivos: `src/server/links.ts`, `src/server/db.ts`, `tests/link-resilience.integration.test.ts`.
- Tamaño: M, 3 archivos.

### Checkpoint D — Contrato resistente a errores

- [ ] Integración y regresiones pasan; revisar evidencia de concurrencia y errores.
- [ ] Comprobar con Matteo que la complejidad añadida responde a casos verificables.

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
