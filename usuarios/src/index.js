const express = require("express"); // express auida a crear servidores web facilmente
const UsuariosController = require("./controllers/usuariosController");
const morgan = require("morgan");
const cors = require ("cors");

const dotenv = require("dotenv");// (Utilizada para manejar información sensible, como contraseñas y gestionar variables de entorno
dotenv.config();



const app = express(); // aqui estoy diciendo que mi app será ese servidor web

// app.use = usar algo dentro del servidor,, Un middleware es función que procesa peticionesa
// en este caso los middlewareson son morgan, cors, y express json

app.use(morgan("dev"));
app.use(cors());

app.use(express.json()); //Convierte JSON en objetos JS para poder usar lo que es req.body y todas esas funciones propias 

app.use(UsuariosController);

app.listen( 3003, () => {
    console.log("MIcroservico de usuarios ejecutandose en el puerto 3003")
}

)