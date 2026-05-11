# GAMIX — Backend: Guía de Instalación y Ejecución

---

## 1. Requisitos previos

### Instalar XAMPP

1. Descarga XAMPP desde [https://www.apachefriends.org](https://www.apachefriends.org) según tu sistema operativo.
2. Ejecuta el instalador y sigue los pasos. Deja las opciones por defecto.
3. Al finalizar, abre el **Panel de Control de XAMPP**.
4. Inicia los módulos **Apache** y **MySQL** haciendo clic en **Start** en cada uno. Ambos deben quedar en verde.

### Instalar Node.js

1. Descarga Node.js desde [https://nodejs.org](https://nodejs.org) (versión LTS recomendada).
2. Instala con las opciones por defecto.
3. Verifica la instalación abriendo una terminal y ejecutando:

```bash
node -v
npm -v
```

---

## 2. Crear las bases de datos

### Abrir la consola de MySQL en XAMPP

1. En el Panel de Control de XAMPP, haz clic en **Shell** (esquina inferior izquierda).
2. En la consola que se abre, escribe:

```bash
mysql -u root -p
```

3. Cuando pida contraseña, presiona **Enter** directamente (por defecto no hay contraseña en XAMPP).

### Ejecutar el script SQL

Una vez dentro de MySQL, ejecuta el archivo `scriptsSQL.sql` que contiene toda la estructura de las bases de datos y los datos iniciales:

```sql
source C:/xampp/htdocs/scriptsSQL.sql
```

> **Nota:** Ajusta la ruta según donde tengas guardado el archivo. Si lo tienes en el escritorio sería algo como `C:/Users/TuUsuario/Desktop/scriptsSQL.sql`.

Esto creará automáticamente las tres bases de datos con sus tablas e insertará los usuarios de prueba:

- `usuariosdb` — usuarios, credenciales y roles
- `amistades_db` — relaciones de amistad entre usuarios
- `solicitudes_db` — solicitudes de amistad y notificaciones

---

## 3. Estructura del proyecto

El backend está dividido en **3 microservicios independientes**, cada uno en su propia carpeta:

```
/backend
  /ms-usuarios        → Puerto 3003
  /ms-amistades       → Puerto 3002
  /ms-solicitudes     → Puerto 3004
```

Cada microservicio tiene su propio `package.json` y sus propias dependencias. Se instalan y ejecutan por separado.

---

## 4. Instalar dependencias de cada microservicio

Abre una terminal en la carpeta raíz de cada microservicio y ejecuta:

```bash
npm install
```

Repite esto en las tres carpetas: `ms-usuarios`, `ms-amistades` y `ms-solicitudes`.

---

## 5. Configurar variables de entorno

Cada microservicio tiene un archivo `.env`. Asegúrate de que los valores estén correctos:

### ms-usuarios (.env)
```env
PORT=3003
SECRET_KEY=tu_clave_secreta
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
```

### ms-amistades (.env)
```env
PORT=3002
SECRET_KEY=tu_clave_secreta
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
AMISTADES_URL=http://localhost:3002
```

### ms-solicitudes (.env)
```env
PORT=3004
SECRET_KEY=tu_clave_secreta
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
AMISTADES_URL=http://localhost:3002
```

> **Importante:** La `SECRET_KEY` debe ser exactamente la misma en los tres microservicios, ya que todos firman y verifican el mismo JWT.

---

## 6. Ejecutar los microservicios

Abre **tres terminales separadas**, una por microservicio, y ejecuta en cada una:

### Terminal 1 — MS Usuarios
```bash
cd ms-usuarios
node src/index.js
```
Deberías ver: `MS Usuarios corriendo en http://localhost:3003`

### Terminal 2 — MS Amistades
```bash
cd ms-amistades
node src/index.js
```
Deberías ver: `MS Amistades corriendo en http://localhost:3002`

### Terminal 3 — MS Solicitudes
```bash
cd ms-solicitudes
node src/index.js
```
Deberías ver: `MS Solicitudes corriendo en http://localhost:3004`

> Los tres deben estar corriendo al mismo tiempo para que el sistema funcione correctamente.

---

## 7. Cómo funcionan los microservicios

### ¿Qué es un microservicio?

En lugar de tener un solo servidor que maneje todo, el sistema está dividido en partes pequeñas e independientes. Cada una tiene su propia responsabilidad, su propia base de datos y su propio puerto. Se comunican entre sí a través de peticiones HTTP internas.

---

### MS Usuarios — Puerto 3003

Es el punto de entrada del sistema. Se encarga de todo lo relacionado con los usuarios.

**Rutas públicas (no requieren token):**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios` | Lista todos los usuarios (sin contraseñas) |
| POST | `/registro` | Registra un nuevo usuario |
| POST | `/login` | Inicia sesión y devuelve un JWT |

**Rutas protegidas (requieren token de administrador):**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios/:id` | Obtiene un usuario específico |
| PUT | `/bloquearusuario/:id` | Bloquea un usuario |
| DELETE | `/eliminarusuario/:id` | Elimina un usuario |
| GET | `/buscarusuarios?q=término` | Busca usuarios por nombre, usuario o correo |
| GET | `/contarUsuarios` | Devuelve totales y estados de usuarios |

**Flujo de login:**
1. El usuario envía `usuario` y `password`.
2. El servidor busca el usuario en la base de datos y compara la contraseña con `bcrypt`.
3. Si coincide, genera un **JWT** firmado con `SECRET_KEY` que contiene `{ id, usuario, rol }`.
4. El frontend guarda ese token en `localStorage` y lo envía en cada petición posterior en el header `Authorization: Bearer <token>`.

---

### MS Amistades — Puerto 3002

Gestiona las relaciones de amistad entre usuarios. Trabaja con la base de datos `amistades_db`.

**Rutas:**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/amistades/:usuario_id` | Token | Lista los amigos de un usuario |
| POST | `/amistades` | Ninguna | Crea una amistad (llamada interna) |
| DELETE | `/amistades/:usuario_id/amigo/:amigo_id` | Token | Elimina una amistad |

**Detalle importante:** Cuando se crea una amistad, se insertan **dos filas** en la tabla `amistades` dentro de una transacción: una en dirección A→B y otra en B→A. Esto garantiza que ambos usuarios se vean como amigos mutuamente. Si alguna de las dos inserciones falla, se hace `rollback` y no queda ninguna.

De igual forma, al eliminar se borran las dos filas en una sola operación.

**Llamada interna:** El endpoint `POST /amistades` no requiere token porque solo lo llama el MS Solicitudes desde el servidor, nunca desde el frontend.

---

### MS Solicitudes — Puerto 3004

Es el más complejo. Gestiona el ciclo completo de las solicitudes de amistad y las notificaciones. Trabaja con la base de datos `solicitudes_db`.

**Rutas de solicitudes:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/solicitudes` | Envía una solicitud de amistad |
| PUT | `/solicitudes/:id/aceptar` | Acepta una solicitud |
| PUT | `/solicitudes/:id/rechazar` | Rechaza una solicitud |
| GET | `/solicitudes/enviadas/:usuario_id` | Lista solicitudes enviadas |
| GET | `/solicitudes/recibidas/:usuario_id` | Lista solicitudes recibidas |
| GET | `/solicitudes/historial/:usuario_id` | Historial completo |

**Rutas de notificaciones:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/notificaciones/:usuario_id` | Lista notificaciones del usuario |
| GET | `/notificaciones/:usuario_id/no-leidas` | Cuenta notificaciones no leídas |
| PUT | `/notificaciones/:id/leer` | Marca una notificación como leída |

**Flujo completo de una solicitud de amistad:**

```
Usuario A envía solicitud
        │
        ▼
POST /solicitudes
  → Verifica que no exista solicitud previa entre ambos
  → Crea registro en tabla "solicitudes" con estado "pendiente"
  → Crea notificación para Usuario B con tipo "solicitud_amistad"
        │
        ▼
Usuario B ve la notificación (polling cada 30 segundos desde el frontend)
        │
        ▼
Usuario B acepta → PUT /solicitudes/:id/aceptar
  → Verifica que la solicitud exista y esté "pendiente"
  → Verifica que quien acepta sea el receptor
  → Cambia estado a "aceptada"
  → Llama internamente a POST /amistades en MS Amistades
  → Crea notificación para Usuario A con tipo "solicitud_aceptada"
        │
        ▼
Ambos usuarios aparecen en sus listas de amigos
```

Si Usuario B rechaza en lugar de aceptar, el estado pasa a "rechazada" y se notifica a Usuario A, pero no se crea ninguna amistad.

---

## 8. Seguridad — Cómo funciona el JWT

Todos los microservicios comparten el mismo middleware de autenticación. Cuando el frontend hace una petición a una ruta protegida:

1. Envía el header: `Authorization: Bearer eyJhbGci...`
2. El middleware extrae el token, lo verifica con `SECRET_KEY` usando `jsonwebtoken`.
3. Si es válido, agrega los datos del usuario a `req.usuario` y deja pasar la petición.
4. Si no hay token o es inválido, rechaza la petición.

Para rutas de administrador, hay una segunda validación que comprueba que `req.usuario.rol === "admin"`.

---

## 9. Probar los endpoints con Postman

El proyecto incluye un archivo de colección de Postman con todas las consultas listas para usar. Esto permite probar cada endpoint de los tres microservicios sin necesidad de construir las peticiones manualmente.

### Cómo importar la colección

1. Abre **Postman**.
2. Haz clic en **Import** (esquina superior izquierda).
3. Selecciona el archivo `.json` de la colección incluido en el proyecto.
4. Una vez importada, encontrarás todas las rutas organizadas por microservicio: **MS Usuarios**, **MS Amistades** y **MS Solicitudes**.

### Antes de empezar

- Asegúrate de que los tres microservicios estén corriendo (ver sección 6).
- Para los endpoints protegidos, primero ejecuta el request de **login** (`POST /login`) y copia el token JWT que devuelve. Luego agrégalo en el header `Authorization: Bearer <token>` de las demás peticiones.

> Las credenciales de los usuarios de prueba están descritas en el script SQL. La contraseña de todos es `contraseña123456`.

---

## 10. Resumen de puertos

| Microservicio | Puerto | Base de datos |
|---------------|--------|---------------|
| MS Usuarios | 3003 | usuariosdb |
| MS Amistades | 3002 | amistades_db |
| MS Solicitudes | 3004 | solicitudes_db |
| XAMPP MySQL | 3306 | — |
| XAMPP Apache | 80 | — |