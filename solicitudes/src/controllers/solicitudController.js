const solicitudModel   = require("../models/solicitudModel");
const notificacionModel = require("../models/notificacionModel");

// URL interna del MS de amistades 
const AMISTADES_URL = process.env.AMISTADES_URL || "http://localhost:3002";

// ─── Llamada interna al MS de amistades ───────────────────────────────────────
async function llamarCrearAmistad(usuario_id, amigo_id) {
    const response = await fetch(`${AMISTADES_URL}/amistades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id, amigo_id })
    });
    return response.json();
}

// ─── Llamada interna: verificar si dos usuarios siguen siendo amigos ──────────
async function verificarSonAmigos(usuario_id, amigo_id) {
    try {
        const response = await fetch(`${AMISTADES_URL}/amistades/${usuario_id}`);
        const data = await response.json();
        if (!data.ok || !Array.isArray(data.data)) return false;
        return data.data.some(a => a.amigo_id === amigo_id);
    } catch {
        return false;
    }
}

// ─── POST /solicitudes ────────────────────────────────────────────────────────
async function enviarSolicitud(req, res) {
    try {
        const solicitante_id = req.usuario.id;
        const { receptor_id } = req.body;

        if (!receptor_id) {
            return res.status(400).json({ ok: false, mensaje: "Falta el receptor" });
        }

        if (solicitante_id === receptor_id) {
            return res.status(400).json({ ok: false, mensaje: "No puedes enviarte una solicitud a ti mismo" });
        }

        const existente = await solicitudModel.buscarSolicitudEntreDos(solicitante_id, receptor_id);
        if (existente) {
            if (existente.estado === "pendiente") {
                return res.status(409).json({ ok: false, mensaje: "Ya existe una solicitud pendiente entre estos usuarios" });
            }

            if (existente.estado === "aceptada") {
    const sigueAmistad = await verificarSonAmigos(solicitante_id, receptor_id);
    if (sigueAmistad) {
        return res.status(409).json({ ok: false, mensaje: "Ya son amigos" });
    }

    // En lugar de INSERT, reseteamos el registro existente
    await solicitudModel.resetearSolicitud(solicitante_id, receptor_id);
    const solicitudId = existente.id;
    await notificacionModel.crearNotificacion(receptor_id, "solicitud_amistad", solicitudId);
    return res.status(201).json({ ok: true, mensaje: "Solicitud enviada", solicitud_id: solicitudId });
}
        }

        const solicitud = await solicitudModel.crearSolicitud(solicitante_id, receptor_id);
        const solicitud_id = solicitud.insertId;

        await notificacionModel.crearNotificacion(receptor_id, "solicitud_amistad", solicitud_id);

        return res.status(201).json({ ok: true, mensaje: "Solicitud enviada", solicitud_id });
    } catch (error) {
        console.error("enviarSolicitud:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al enviar solicitud" });
    }
}
// ─── PUT /solicitudes/:id/aceptar ─────────────────────────────────────────────
async function aceptarSolicitud(req, res) {
    try {
        const { id } = req.params;

        const solicitud = await solicitudModel.obtenerSolicitudPorId(id);
        if (!solicitud) {
            return res.status(404).json({ ok: false, mensaje: "Solicitud no encontrada" });
        }
        if (solicitud.estado !== "pendiente") {
            return res.status(400).json({ ok: false, mensaje: `La solicitud ya fue ${solicitud.estado}` });
        }

        // Verificar que quien acepta es el receptor
        if (req.usuario.id !== solicitud.receptor_id) {
            return res.status(403).json({ ok: false, mensaje: "No tienes permiso para aceptar esta solicitud" });
        }

        await solicitudModel.actualizarEstado(id, "aceptada");
        await llamarCrearAmistad(solicitud.solicitante_id, solicitud.receptor_id);
        await notificacionModel.crearNotificacion(solicitud.solicitante_id, "solicitud_aceptada", solicitud.id);

        return res.json({ ok: true, mensaje: "Solicitud aceptada. ¡Ahora son amigos!" });
    } catch (error) {
        console.error("aceptarSolicitud:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al aceptar solicitud" });
    }
}

// ─── PUT /solicitudes/:id/rechazar ────────────────────────────────────────────
async function rechazarSolicitud(req, res) {
    try {
        const { id } = req.params;

        const solicitud = await solicitudModel.obtenerSolicitudPorId(id);
        if (!solicitud) {
            return res.status(404).json({ ok: false, mensaje: "Solicitud no encontrada" });
        }
        if (solicitud.estado !== "pendiente") {
            return res.status(400).json({ ok: false, mensaje: `La solicitud ya fue ${solicitud.estado}` });
        }

        // Verificar que quien rechaza es el receptor
        if (req.usuario.id !== solicitud.receptor_id) {
            return res.status(403).json({ ok: false, mensaje: "No tienes permiso para rechazar esta solicitud" });
        }

        await solicitudModel.actualizarEstado(id, "rechazada");

        await notificacionModel.crearNotificacion(solicitud.solicitante_id, "solicitud_rechazada", solicitud.id);

        return res.json({ ok: true, mensaje: "Solicitud rechazada" });
    } catch (error) {
        console.error("rechazarSolicitud:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al rechazar solicitud" });
    }
}

// ─── GET /solicitudes/enviadas/:usuario_id ────────────────────────────────────
async function verEnviadas(req, res) {
    try {
        const { usuario_id } = req.params;
        const data = await solicitudModel.solicitudesEnviadas(usuario_id);
        return res.json({ ok: true, data });
    } catch (error) {
        console.error("verEnviadas:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener solicitudes enviadas" });
    }
}

// ─── GET /solicitudes/recibidas/:usuario_id ───────────────────────────────────
async function verRecibidas(req, res) {
    try {
        const { usuario_id } = req.params;
        const data = await solicitudModel.solicitudesRecibidas(usuario_id);
        return res.json({ ok: true, data });
    } catch (error) {
        console.error("verRecibidas:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener solicitudes recibidas" });
    }
}

// ─── GET /solicitudes/historial/:usuario_id?estado=pendiente ─────────────────
async function verHistorial(req, res) {
    try {
        const { usuario_id } = req.params;
        const { estado }     = req.query; // opcional: pendiente | aceptada | rechazada

        let data;
        if (estado) {
            data = await solicitudModel.solicitudesPorEstado(usuario_id, estado);
        } else {
            // Sin filtro: devuelve enviadas + recibidas
            const enviadas  = await solicitudModel.solicitudesEnviadas(usuario_id);
            const recibidas = await solicitudModel.solicitudesRecibidas(usuario_id);
            data = { enviadas, recibidas };
        }

        return res.json({ ok: true, data });
    } catch (error) {
        console.error("verHistorial:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener historial" });
    }
}

// ─── GET /notificaciones/:usuario_id ─────────────────────────────────────────
async function verNotificaciones(req, res) {
    try {
        const { usuario_id } = req.params;
        const data = await notificacionModel.obtenerNotificaciones(usuario_id);
        return res.json({ ok: true, data });
    } catch (error) {
        console.error("verNotificaciones:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al obtener notificaciones" });
    }
}

// ─── PUT /notificaciones/:id/leer ────────────────────────────────────────────
async function marcarLeida(req, res) {
    try {
        const { id } = req.params;
        await notificacionModel.marcarLeida(id);
        return res.json({ ok: true, mensaje: "Notificación marcada como leída" });
    } catch (error) {
        console.error("marcarLeida:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al marcar notificación" });
    }
}

// ─── GET /notificaciones/:usuario_id/no-leidas ───────────────────────────────
async function contarNoLeidas(req, res) {
    try {
        const { usuario_id } = req.params;
        const data = await notificacionModel.contarNoLeidas(usuario_id);
        return res.json({ ok: true, data });
    } catch (error) {
        console.error("contarNoLeidas:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al contar notificaciones" });
    }
}

module.exports = {
    enviarSolicitud,
    aceptarSolicitud,
    rechazarSolicitud,
    verEnviadas,
    verRecibidas,
    verHistorial,
    verNotificaciones,
    marcarLeida,
    contarNoLeidas
};