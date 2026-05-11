const bcrypt = require("bcrypt");

async function generarPassword(){

    const password = "admin123";

    const hash = await bcrypt.hash(password,10);

    console.log(hash);

}

generarPassword();

// este codigo es temporal, es para saber la contraseña de mi admin y poder crearlo directamente en el xamp,
// ya que pues no se especifico en los requerimeintos que se puedieran crear mas administradores
// ademas se hace porque la contraseña es ecriptada, y pues no se planteo una funcion para eso
// ademas no es bueno poner que cualquier poersona pueda asignar su rol, porque en crear usuario no deberia poner que yo pueda sigarneme mi rol
// eso no es seguro