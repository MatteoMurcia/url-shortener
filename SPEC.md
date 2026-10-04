# URL Shortener — primera entrega

Estado: T01–T10 y checkpoint E fusionados; T11 implementado en su rama con smoke interactivo pendiente.
TypeScript y Node.js elegidos por Matteo.

Modo de trabajo actual: T11 autorizado; logs y cierre verificados automáticamente.
La comprobación interactiva del cierre y T12 siguen pendientes.
La arquitectura propuesta está en [tasks/plan.md](tasks/plan.md) y las tareas
futuras en [tasks/todo.md](tasks/todo.md). El resto del stack y el alcance siguen
siendo propuestas; estos documentos no representan su aprobación.

## Objetivo

Construir una primera entrega completa que permita introducir una URL, obtener
un enlace corto persistente y usarlo para llegar al destino. El repositorio debe
servir como evidencia de desarrollo full stack: comportamiento comprobable,
interfaz accesible y decisiones técnicas explicadas.

Supuestos propuestos: aplicación web, React en frontend, PostgreSQL como base de
datos y ejecución local para esta entrega. Código, interfaz y documentación
pública en inglés; conversación de trabajo en español.

## Alcance

Una sola capacidad: crear y resolver enlaces cortos, de extremo a extremo.

- Formulario adaptable a móvil y escritorio, con etiqueta visible, errores
  accesibles, estado de envío, resultado y botón para copiar.
- API para crear enlaces y resolver sus códigos.
- Persistencia en PostgreSQL mediante una migración SQL versionada.
- Pruebas de validación, persistencia, colisiones y recorrido en navegador.
- Instrucciones reproducibles de ejecución y comprobación.

Cuentas, panel privado, analítica, alias personalizados, caducidad, caché e IA
quedan fuera de esta primera entrega. No habrá un listado público de enlaces.
Esta demo local no se presentará como un servicio público listo para producción.

## Stack propuesto

- Node.js 24 LTS y TypeScript con comprobación estricta.
- Express 5 para la API; React y Vite para el frontend.
- PostgreSQL y el cliente `pg`; consultas parametrizadas y migraciones SQL.
- Vitest para pruebas unitarias y de integración; Playwright para el flujo web.
- npm, un único repositorio y un único archivo de bloqueo de dependencias.
- Docker Compose para la base de datos local.

Las versiones exactas restantes se fijarán en el archivo de bloqueo al implementar.
Una aplicación backend sirve la API y los archivos frontend en producción;
en desarrollo incorpora Vite como middleware, usando un solo puerto y origen.

## Contrato y criterios de aceptación

1. `POST /api/links` recibe `{ "url": "https://example.com/path?q=1#section" }`
   y devuelve `201` con `code`, `shortUrl` y `destinationUrl` después de guardar
   el enlace. La URL corta se construye con `BASE_URL`, nunca con el Host enviado
   por el cliente.
2. Se aceptan URLs absolutas HTTP/HTTPS, de hasta 2048 caracteres, sin credenciales.
   Se rechazan entradas vacías, tipos incorrectos y protocolos como `javascript:`
   con `400` y un error comprensible. El servidor no descarga el destino.
3. `GET /r/:code` devuelve `302` con el destino guardado en `Location`, conservando
   ruta, query y fragmento según la serialización del parser URL. Un código
   inexistente devuelve `404` con una página comprensible.
4. Los códigos se generan con aleatoriedad criptográfica y tienen una restricción
   única en la base de datos. Una colisión provoca un reintento limitado; nunca
   se sobrescribe otro enlace. Agotar los reintentos devuelve un error controlado.
5. Los enlaces siguen funcionando tras reiniciar el backend.
6. El formulario funciona con teclado; anuncia errores y resultados. Copiar
   muestra confirmación únicamente si se completa y ofrece una alternativa si falla.
7. Los fallos de base de datos no producen resultados exitosos ni filtran consultas,
   credenciales o detalles internos. Se limita el tamaño del cuerpo JSON.
8. El recorrido crear → copiar/abrir → redirigir se verifica en navegador con
   un destino local controlado durante las pruebas.

## Estructura prevista

```text
src/server/       API, configuración y acceso a datos
src/client/       Interfaz React y estilos
db/migrations/    Esquema SQL versionado
tests/           Pruebas unitarias y de integración
e2e/             Pruebas de navegador
README.md        Instalación, decisiones, comprobaciones y limitaciones
.env.example     Configuración de ejemplo sin secretos
compose.yaml     PostgreSQL local
```

## Comandos previstos

T02 añade desarrollo, build, arranque y pruebas a T01. T03 añade Compose y
`npm run test:integration`. Copiar `.env.example` a `.env` antes de iniciar Compose.
T04 añade `npm run db:migrate` y el esquema de enlaces. T10 añade `npm run test:e2e`.

```sh
npm ci
docker compose up -d db
docker compose --profile test up -d --wait
npm run db:migrate
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

El README explicará cómo crear `.env`, configurar `DATABASE_URL`, `BASE_URL` y
una base independiente para integración, y ejecutar los comandos en orden.

## Estilo de código

Nombres de dominio explícitos, funciones pequeñas y validación en las fronteras.
Sin `any` implícito ni abstracciones sin un uso concreto. Ejemplo de estilo:

```ts
type ShortLink = {
  code: string;
  destinationUrl: string;
};

function buildShortUrl(baseUrl: string, code: string): string {
  return new URL(`/r/${code}`, baseUrl).href;
}
```

## Verificación

- Unitarias: protocolos, campos inválidos, límites y generación de URLs cortas.
- Integración con PostgreSQL real y aislado: guardar/resolver, restricción única,
  colisiones forzadas, inexistentes y errores de persistencia.
- Navegador: envío, feedback, apertura y redirección; revisión de teclado y móvil.
- Antes de cerrar la entrega: tipos, lint, pruebas y build deben pasar. Informar
  expresamente cualquier comprobación que no se haya podido ejecutar.

## Límites de trabajo

- Siempre: validar entradas, parametrizar SQL, mantener secretos fuera de Git,
  documentar decisiones y comprobar los comportamientos anteriores.
- Consultar: cambios de alcance, servicios de pago o publicación externa.
- Nunca: incorporar datos personales del CV al repositorio, afirmar resultados
  de rendimiento sin medirlos o ignorar fallos para dar la entrega por terminada.

## Entregas posteriores propuestas

Tras validar el núcleo, definir cuentas y gestión privada; después analítica y
despliegue público con controles de abuso. La posible función de IA deberá tener
un objetivo útil, un conjunto de evaluación y límites de coste y acceso a datos.
Su alcance todavía no está elegido.

## Referencias técnicas

- Node.js: https://nodejs.org/en/about/previous-releases
- Express: https://expressjs.com/en/5x/starter/installing/
- Vite: https://vite.dev/guide/
