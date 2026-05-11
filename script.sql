-- ══════════════════════════════════════════════════════════════════
-- SCRIPT SQL - CREACIÓN DE BASES DE DATOS E INSERCIÓN DE DATOS
-- XAMPP / MySQL
-- ══════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════
-- [1] BASE DE DATOS: usuariosdb
-- ══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS usuariosdb
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE usuariosdb;

-- ── Tabla: usuarios ────────────────────────────────────────────────
CREATE TABLE usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    usuario         VARCHAR(50)  UNIQUE NOT NULL,
    correo          VARCHAR(100) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    rol             ENUM('usuario', 'admin') DEFAULT 'usuario',
    fecha_bloqueado DATETIME NULL
);

-- ── Inserción de usuarios ──────────────────────────────────────────
-- NOTA: Las contraseñas ya están hasheadas y equivalen a "contraseña123456" para todos los usuarios.

INSERT INTO usuarios (nombre, usuario, correo, password, rol) VALUES
    ('Angelica Marcillo',  'angelica.marcillo',  'angelica.marcillo@correo.com',  '$2b$10$gacx4C6J1V6wCoGggh7BIu2keCQKcM9BLsUoXMq6JaD0ABtenUmZ.', 'usuario'),
    ('Melanny Salguero',   'melanny.salguero',   'melanny.salguero@correo.com',   '$2b$10$gacx4C6J1V6wCoGggh7BIu2keCQKcM9BLsUoXMq6JaD0ABtenUmZ.', 'usuario'),
    ('Juan Suarez',        'juan.suarez',        'juan.suarez@correo.com',        '$2b$10$gacx4C6J1V6wCoGggh7BIu2keCQKcM9BLsUoXMq6JaD0ABtenUmZ.', 'usuario'),
    ('Samuel Arredondo',   'samuel.arredondo',   'samuel.arredondo@correo.com',   '$2b$10$gacx4C6J1V6wCoGggh7BIu2keCQKcM9BLsUoXMq6JaD0ABtenUmZ.', 'usuario');


-- ══════════════════════════════════════════════════════════════════
-- [2] BASE DE DATOS: amistades_db
-- ══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS amistades_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE amistades_db;

-- ── Tabla: amistades ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amistades (
    id         INT      AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT      NOT NULL,
    amigo_id   INT      NOT NULL,
    creado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unica_amistad (usuario_id, amigo_id)
);

-- ── Índices ────────────────────────────────────────────────────────
CREATE INDEX idx_usuario_id ON amistades (usuario_id);
CREATE INDEX idx_amigo_id   ON amistades (amigo_id);


-- ══════════════════════════════════════════════════════════════════
-- [3] BASE DE DATOS: solicitudes_db
-- ══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS solicitudes_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE solicitudes_db;

-- ── Tabla: solicitudes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS solicitudes (
    id              INT(11)  NOT NULL AUTO_INCREMENT,
    solicitante_id  INT(11)  NOT NULL,
    receptor_id     INT(11)  NOT NULL,
    estado          ENUM('pendiente', 'aceptada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    creado_en       DATETIME NOT NULL DEFAULT current_timestamp(),
    actualizado_en  DATETIME NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla: notificaciones ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
    id           INT(11)    NOT NULL AUTO_INCREMENT,
    usuario_id   INT(11)    NOT NULL,
    tipo         ENUM('solicitud_amistad', 'solicitud_aceptada', 'solicitud_rechazada') NOT NULL,
    solicitud_id INT(11)    NULL DEFAULT NULL,
    leida        TINYINT(1) NOT NULL DEFAULT 0,
    creado_en    DATETIME   NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT
-- ══════════════════════════════════════════════════════════════════
