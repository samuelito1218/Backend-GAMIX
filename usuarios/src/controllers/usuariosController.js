// esa me permite crear lo que e s edpoints
const { Router } = require("express"); // se importa una herramienta de express llamada router
// estas son dependencias para lo que es el autenticado para el inicio de sesion
const bcrypt = require("bcrypt"); // me permite encriptar lo que es la contraseña
const jwt = require("jsonwebtoken"); // me permite crear tokens para el inicio de la sesion
const proteccion = require("../middleware/authMiddleware"); // es para proteger y tener privacidad

const router = Router(); // aqui se crea el objeto router
const usuariosModel = require("../models/usuariosModel");

// router mira que cunado se haga x peticion
// funciones asincronicas significan que toman algo e tiempo, la consulta se demora por eso se usa eso

// req = infomraicon que manda el usuario
// res = respuesta que envia el serviro
// => : esto es una funcion flecha
router.get("/usuarios", async (req, res) => {
    var result;
    result = await usuariosModel.todosUsuarios();

    res.json(result); //responde al usario en formato json
});

//USUARIOS ESPECIFICO
router.get("/usuarios/:id", proteccion.validarToken, proteccion.validarAdmin, async (req, res) => {
    const id = req.params.id; // el request params, sive para leer el parametro que se envia en la url
    var result;
    result = await usuariosModel.UnUsuario(id);

    // validar si encontró usuario
    if (result.length == 0) {
        res.send("el usuario no existe");
        return;
    }
    res.json(result); //responde al usario en formato json

});

// CREAR
router.post("/crearusuario", async (req, res) => {

    try {
        const nombre = req.body.nombre; // bodu es para leer datos enviados en el cuerpo de la peticion
        const usuario = req.body.usuario;
        const correo = req.body.correo;
        const password = req.body.password;

        var result = await usuariosModel.crearUsuario(nombre, usuario, correo, password);
        res.send("Usuario fue creado con exito")

    } catch (error) {
        res.send("el usuario o correo ya existe");
    }

});


//BLOQUEAR
router.put("/bloquearusuario/:id", proteccion.validarToken, proteccion.validarAdmin, async (req, res) => {
    const id = req.params.id;
    const fecha_bloqueado = req.body.fecha_bloqueado;

    var result = await usuariosModel.bloquearUsuario(id, fecha_bloqueado);

    // verificar si bloqueo algo
    if (result[0].affectedRows == 0) {

        res.send("el usuario no existe");

        return;
    }

    res.send("el usuario fue bloqueado por el tiempo establecido")

});

//ELIMNAR
router.delete("/eliminarusuario/:id", proteccion.validarToken, proteccion.validarAdmin, async (req, res) => {
    const id = req.params.id;

    var result = await usuariosModel.eliminarUsuario(id);

    // verificar si eliminó algo
    if (result[0].affectedRows == 0) {

        res.send("el usuario no existe");

        return;
    }

    res.send("el usuario fue eliminado correctamente");
})




// -------------------------AQUI EMPIEZA LA LOGICA PARA INICIAR SESION Y REGISTRO


//eliminar usuario
router.post("/registro", async (req, res) => {

    const nombre = req.body.nombre;
    const usuario = req.body.usuario;
    const correo = req.body.correo;
    const password = req.body.password;


    // VALIDAR para que los cAMPOS no sean vacios
    if (!nombre || !usuario || !correo || !password) {
        res.send("todos los campos son obligatorios");
        return;
    }

    // PASSWORD MINIMO 8
    if (password.length < 8) {
        res.send("la contraseña debe tener minimo 8 caracteres");
        return;
    }

    // se valida que el suuario o correo no exista, buscandolo en el model

    const existeUsuario = await usuariosModel.buscarUsuarioOCorreo(usuario, correo);
    if (existeUsuario.length > 0) {
        res.send("el usuario o correo ya existen");
        return;
    }


    // ENCRIPTAR PASSWORD
    const passwordEncriptado = await bcrypt.hash(password, 10); // se usa la dependencia que se importó y se encripta
    // CREAR USUARIO
    await usuariosModel.crearUsuario(
        nombre, usuario, correo, passwordEncriptado
    );
    res.send("usuario registrado correctamente");

});


//iniciar sesion
router.post("/login", async (req, res) => {

    const usuario = req.body.usuario;
    const password = req.body.password;

    // VALIDAR CAMPOS
    if (!usuario || !password) {
        res.send("Tienes que llenar todos los campos");
        return;
    }

    // Buscar el usuario para poder inciar sesión
    const result = await usuariosModel.buscarUsuarioLogin(usuario);
    // VALIDAR EXISTE
    if (result.length == 0) {
        res.send("usuario no encontrado");
        return;
    }
    // USUARIO ENCONTRADO
    const usuarioBD = result[0];

    // Validacion para saber si esta bloqueado o no
    if (usuarioBD.fecha_bloqueado) {
        const fechaActual = new Date();
        const fechaBloqueo = new Date(usuarioBD.fecha_bloqueado);

        if (fechaBloqueo > fechaActual) {
            res.send("usuario bloqueado");
            return;
        }
    }

    // COMPARAR PASSWORD
    const coincide = await bcrypt.compare(password, usuarioBD.password);
    if (!coincide) {
        res.send("contraseña incorrecta");
        return;
    }

    // GENERAR TOKEN, el cual se va divir con puntos, cada punto divide lo que es paa el id, para el usuario y rol,
    const token = jwt.sign(
        { id: usuarioBD.id, usuario: usuarioBD.usuario, rol: usuarioBD.rol },
        process.env.SECRET_KEY,
        { expiresIn: "2h" }
    );

    res.json({ mensaje: "login exitoso", token: token });

});

// Buscar usuarios para el panel de admisntraror ya sea correo, usuario o nombre
router.get("/buscarusuarios", proteccion.validarToken, proteccion.validarAdmin, async (req, res) => {
    const termino = req.query.q; 
    const result = await usuariosModel.buscarUsuarios(termino);
    res.json(result);
});

// contar  usuarios, si esta activo, bloqueado, etc
router.get("/contarUsuarios", proteccion.validarToken, proteccion.validarAdmin, async (req, res) => {
    const result = await usuariosModel.contarUsuarios();
    res.json(result);
});

module.exports = router; // se exporta el router para que el index lo pueda usar