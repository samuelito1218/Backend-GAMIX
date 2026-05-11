const mysql = require("mysql2/promise");

const connection = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: "amistades_db"
});

// ─── Listar todos los amigos de un usuario ───────────────────────────────────
async function listarAmigos(usuario_id) {
    const result = await connection.query(
        `SELECT amigo_id, creado_en AS amigos_desde
         FROM amistades
         WHERE usuario_id = ?
         ORDER BY creado_en DESC`,
        [usuario_id]
    );
    return result[0];
}

// ─── Verificar si dos usuarios ya son amigos ─────────────────────────────────
async function sonAmigos(usuario_id, amigo_id) {
    const result = await connection.query(
        "SELECT id FROM amistades WHERE usuario_id = ? AND amigo_id = ?",
        [usuario_id, amigo_id]
    );
    return result[0].length > 0;
}

// ─── Crear amistad bilateral (A→B y B→A) ─────────────────────────────────────
// Este método lo llama el MS de solicitudes cuando acepta una solicitud
async function crearAmistad(usuario_id, amigo_id) {
    // Insertar ambas direcciones en una sola transacción
    const conn = await connection.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(
            "INSERT INTO amistades (usuario_id, amigo_id) VALUES (?, ?)",
            [usuario_id, amigo_id]
        );
        await conn.query(
            "INSERT INTO amistades (usuario_id, amigo_id) VALUES (?, ?)",
            [amigo_id, usuario_id]
        );
        await conn.commit();
        return { ok: true };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

// ─── Eliminar amistad bilateral ───────────────────────────────────────────────
async function eliminarAmistad(usuario_id, amigo_id) {
    const conn = await connection.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(
            "DELETE FROM amistades WHERE (usuario_id = ? AND amigo_id = ?) OR (usuario_id = ? AND amigo_id = ?)",
            [usuario_id, amigo_id, amigo_id, usuario_id]
        );
        await conn.commit();
        return { ok: true };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = {
    listarAmigos,
    sonAmigos,
    crearAmistad,
    eliminarAmistad
};