const mysql = require("mysql2/promise");

const connection = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: "solicitudes_db"
});

// ─── Crear notificación ───────────────────────────────────────────────────────
async function crearNotificacion(usuario_id, tipo, solicitud_id) {
    const result = await connection.query(
        "INSERT INTO notificaciones (usuario_id, tipo, solicitud_id) VALUES (?, ?, ?)",
        [usuario_id, tipo, solicitud_id]
    );
    return result[0];
}

// ─── Obtener notificaciones de un usuario ─────────────────────────────────────
async function obtenerNotificaciones(usuario_id) {
    const result = await connection.query(
        `SELECT n.*, s.solicitante_id, s.receptor_id
         FROM notificaciones n
         LEFT JOIN solicitudes s ON s.id = n.solicitud_id
         WHERE n.usuario_id = ?
         ORDER BY n.creado_en DESC`,
        [usuario_id]
    );
    return result[0];
}

// ─── Marcar notificación como leída ──────────────────────────────────────────
async function marcarLeida(id) {
    const result = await connection.query(
        "UPDATE notificaciones SET leida = 1 WHERE id = ?",
        [id]
    );
    return result[0];
}

// ─── Contar notificaciones no leídas ─────────────────────────────────────────
async function contarNoLeidas(usuario_id) {
    const result = await connection.query(
        "SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = ? AND leida = 0",
        [usuario_id]
    );
    return result[0][0];
}

module.exports = {
    crearNotificacion,
    obtenerNotificaciones,
    marcarLeida,
    contarNoLeidas
};