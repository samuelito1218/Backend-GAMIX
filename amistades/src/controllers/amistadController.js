const amistadModel = require("../models/amistadModel");

// GET /amistades/:usuario_id
async function listarAmigos(req, res) {
    try {
        const { usuario_id } = req.params;
        const amigos = await amistadModel.listarAmigos(usuario_id);
        return res.json({ ok: true, data: amigos });
    } catch (error) {
        console.error("listarAmigos:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener amigos" });
    }
}

// POST /amistades  — lo llama internamente el MS de solicitudes al aceptar
async function crearAmistad(req, res) {
    try {
        const { usuario_id, amigo_id } = req.body;

        if (!usuario_id || !amigo_id) {
            return res.status(400).json({ ok: false, mensaje: "Faltan campos requeridos" });
        }

        if (usuario_id === amigo_id) {
            return res.status(400).json({ ok: false, mensaje: "Un usuario no puede ser amigo de sí mismo" });
        }

        const yaExiste = await amistadModel.sonAmigos(usuario_id, amigo_id);
        if (yaExiste) {
            return res.status(409).json({ ok: false, mensaje: "Ya son amigos" });
        }

        await amistadModel.crearAmistad(usuario_id, amigo_id);
        return res.status(201).json({ ok: true, mensaje: "Amistad creada correctamente" });
    } catch (error) {
        console.error("crearAmistad:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al crear amistad" });
    }
}

// DELETE /amistades/:usuario_id/amigo/:amigo_id
async function eliminarAmistad(req, res) {
    try {
        const { usuario_id, amigo_id } = req.params;

        const sonAmigos = await amistadModel.sonAmigos(usuario_id, amigo_id);
        if (!sonAmigos) {
            return res.status(404).json({ ok: false, mensaje: "No existe esa amistad" });
        }

        await amistadModel.eliminarAmistad(usuario_id, amigo_id);
        return res.json({ ok: true, mensaje: "Amistad eliminada correctamente" });
    } catch (error) {
        console.error("eliminarAmistad:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al eliminar amistad" });
    }
}

module.exports = { listarAmigos, crearAmistad, eliminarAmistad };