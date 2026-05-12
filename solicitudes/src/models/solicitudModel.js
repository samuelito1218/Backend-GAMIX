const mysql = require("mysql2/promise");

const connection = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: "solicitudes_db"
});
// Resetea una solicitud existente a "pendiente" (para reenvíos tras eliminar amistad)
async function resetearSolicitud(solicitante_id, receptor_id) {
    const [result] = await connection.query(
        `UPDATE solicitudes 
         SET estado        = 'pendiente',
             solicitante_id = ?,      
             receptor_id    = ?,      
             creado_en      = NOW(), 
             actualizado_en = NOW()
         WHERE (solicitante_id = ? AND receptor_id = ?)
            OR (solicitante_id = ? AND receptor_id = ?)`,
        [
            solicitante_id, receptor_id,           // SET los nuevos roles
            solicitante_id, receptor_id,            // WHERE dirección A→B
            receptor_id,    solicitante_id          // WHERE dirección B→A
        ]
    );
    return result;
}

// ─── Enviar solicitud ─────────────────────────────────────────────────────────
async function crearSolicitud(solicitante_id, receptor_id) {
    const result = await connection.query(
        "INSERT INTO solicitudes (solicitante_id, receptor_id) VALUES (?, ?)",
        [solicitante_id, receptor_id]
    );
    return result[0];
}

// ─── Buscar solicitud entre dos usuarios (cualquier dirección) ────────────────
async function buscarSolicitudEntreDos(solicitante_id, receptor_id) {
    const result = await connection.query(
        `SELECT * FROM solicitudes
         WHERE (solicitante_id = ? AND receptor_id = ?)
            OR (solicitante_id = ? AND receptor_id = ?)`,
        [solicitante_id, receptor_id, receptor_id, solicitante_id]
    );
    return result[0][0]; // puede ser undefined si no existe
}

// ─── Obtener solicitud por ID ─────────────────────────────────────────────────
async function obtenerSolicitudPorId(id) {
    const result = await connection.query(
        "SELECT * FROM solicitudes WHERE id = ?",
        [id]
    );
    return result[0][0];
}

// ─── Cambiar estado de una solicitud ─────────────────────────────────────────
async function actualizarEstado(id, estado) {
    const result = await connection.query(
        "UPDATE solicitudes SET estado = ? WHERE id = ?",
        [estado, id]
    );
    return result[0];
}

// ─── Historial: solicitudes enviadas por un usuario ──────────────────────────
async function solicitudesEnviadas(usuario_id) {
    const result = await connection.query(
        `SELECT * FROM solicitudes
         WHERE solicitante_id = ?
         ORDER BY creado_en DESC`,
        [usuario_id]
    );
    return result[0];
}

// ─── Historial: solicitudes recibidas por un usuario ─────────────────────────
async function solicitudesRecibidas(usuario_id) {
    const result = await connection.query(
        `SELECT * FROM solicitudes
         WHERE receptor_id = ?
         ORDER BY creado_en DESC`,
        [usuario_id]
    );
    return result[0];
}

// ─── Filtrar por estado ───────────────────────────────────────────────────────
async function solicitudesPorEstado(usuario_id, estado) {
    const result = await connection.query(
        `SELECT * FROM solicitudes
         WHERE (solicitante_id = ? OR receptor_id = ?)
           AND estado = ?
         ORDER BY actualizado_en DESC`,
        [usuario_id, usuario_id, estado]
    );
    return result[0];
}

module.exports = {
    crearSolicitud,
    buscarSolicitudEntreDos,
    obtenerSolicitudPorId,
    actualizarEstado,
    solicitudesEnviadas,
    solicitudesRecibidas,
    solicitudesPorEstado,
    resetearSolicitud
};