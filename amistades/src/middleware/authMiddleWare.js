

 // este el sistema de seguridad del backend
 //vrificar si el usuario inició sesión
//verificar si el token es válido
//verificar si el usuario es admin
// proteger rutas privadas

const jwt = require("jsonwebtoken"); // crear y verificar tokens
// primera validacion es que este el token

function validarToken(req,res,next){

    // authorazaion es donde normalmente viaja el token.
    const authHeader = req.headers.authorization;  

    // solo es una validación de que el token exista
    if(!authHeader){
        res.send("token requerido");
        return;
    }

    // SEPARAR BEARER DEL TOKEN
    const token = authHeader.split(" ")[1];


    try{
        // VERIFICAR TOKEN sea creado con el verfy y con la cavle secreta que se puso en el archivo de env
        const decoded = jwt.verify(
            token,
            process.env.SECRET_KEY
        );

        // GUARDAR INFO USUARIO
        req.usuario = decoded;
        next();
    }

    catch(error){
        res.send("token invalido");
    }

}



// validacion de que sea administrador

function validarAdmin(req,res,next){

    
    if(req.usuario.rol != "admin"){
        res.send("acceso denegado");
        return;
    }
    next();

}


module.exports = {
    validarToken,
    validarAdmin
}