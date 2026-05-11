require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

const { validarToken }      = require("./middleware/authMiddleware");
const amistadController     = require("./controllers/amistadController");

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Listar amigos de un usuario
app.get("/amistades/:usuario_id",                    validarToken, amistadController.listarAmigos);

// Crear amistad — llamado interno desde MS de solicitudes
app.post("/amistades",                                             amistadController.crearAmistad);

// Eliminar amistad
app.delete("/amistades/:usuario_id/amigo/:amigo_id", validarToken, amistadController.eliminarAmistad);

app.listen(PORT, () => {
    console.log(`MS Amistades corriendo en http://localhost:${PORT}`);
});