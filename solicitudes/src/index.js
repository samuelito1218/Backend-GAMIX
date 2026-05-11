require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

const { validarToken, validarAdmin }        = require("./middleware/authMiddleware");
const solicitudController     = require("./controllers/solicitudController");

const app  = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Solicitudes
app.post("/solicitudes",                              validarToken, solicitudController.enviarSolicitud);
app.put("/solicitudes/:id/aceptar",                  validarToken, solicitudController.aceptarSolicitud);
app.put("/solicitudes/:id/rechazar",                 validarToken, solicitudController.rechazarSolicitud);
app.get("/solicitudes/enviadas/:usuario_id",         validarToken, solicitudController.verEnviadas);
app.get("/solicitudes/recibidas/:usuario_id",        validarToken, solicitudController.verRecibidas);
app.get("/solicitudes/historial/:usuario_id",        validarToken, solicitudController.verHistorial);

// Notificaciones
app.get("/notificaciones/:usuario_id",               validarToken, solicitudController.verNotificaciones);
app.get("/notificaciones/:usuario_id/no-leidas",     validarToken, solicitudController.contarNoLeidas);
app.put("/notificaciones/:id/leer",                  validarToken, solicitudController.marcarLeida);

app.listen(PORT, () => {
    console.log(`MS Solicitudes corriendo en http://localhost:${PORT}`);
});