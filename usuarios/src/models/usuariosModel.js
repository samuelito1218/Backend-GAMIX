const mysql = require("mysql2/promise");


const connection = mysql.createPool({ // crate pool es una funcion de mysql
    // se hace un objeto con las configuraciones
    host: "localhost",
    user: "root",
    password: "",
    database: "usuariosdb"
})


// un usuario en especifico
async function UnUsuario(id) {
    const result = await connection.query("SELECT * FROM usuarios WHERE id = ?", id);
    return result[0];
}

//crear usuario
async function crearUsuario(nombre, usuario, correo, password) {
    const result = await connection.query("INSERT INTO usuarios(nombre, usuario, correo, password) VALUES (?,?,?,?)", [
        nombre, usuario, correo, password]);

    return result;

}


// bloquear usuario
async function bloquearUsuario(id, fecha_bloqueado) {
    const result = await connection.query("UPDATE usuarios SET fecha_bloqueado=? WHERE id =?", [fecha_bloqueado, id]);
    return result;
}

//eliminar usuario
async function eliminarUsuario(id) {
    const result = await connection.query("DELETE FROM usuarios WHERE id = ?", id)
    return result;

}

//AWQUI VAN LAS FUNCIONES REFERETNE AL LOGIN

// REGISTRO
// Esta funcino me busca si existe un correo o un usuario ya registrado con esos valores, lo que hace que no se pueda usar
async function buscarUsuarioOCorreo(usuario, correo) {
    const result = await connection.query("SELECT * FROM usuarios WHERE usuario = ? OR correo = ?", [usuario, correo]);
    return result[0];
}


// LOGIN
// esta funcino me busca el usuario para poder inisicar sesion
async function buscarUsuarioLogin(usuario) {
    const result = await connection.query("SELECT * FROM usuarios WHERE usuario = ?", usuario);
    return result[0];
}



// esta operacione es extra para buscar a un usirio ya sea por usuario, nombre o correo, es la funcion que tiene el adminsitrador
async function buscarUsuarios(termino) {
    const result = await connection.query(
        "SELECT * FROM usuarios WHERE rol = 'usuario' AND (nombre LIKE ? OR usuario LIKE ? OR correo LIKE ?)",
        [`%${termino}%`, `%${termino}%`, `%${termino}%`] // el procentaje es una funcion de sql que me permite encontrar similares ya sea po incio o final
    );
    return result[0];
}

// Contar los totales y teniedno en cuenta los activos y bloqueados
async function contarUsuarios() {
    const result = await connection.query(`SELECT COUNT(*) AS total,
            SUM(CASE WHEN fecha_bloqueado IS NULL OR fecha_bloqueado <= NOW() THEN 1 ELSE 0 END) AS activos,
            SUM(CASE WHEN fecha_bloqueado > NOW() THEN 1 ELSE 0 END) AS bloqueados FROM usuarios WHERE rol = 'usuario' `);
    return result[0][0];
}

// Agregar campo calculado 'estado' directo desde la BD, para saber si es activo o bloqueado
async function todosUsuarios() {
    const result = await connection.query(`SELECT *, CASE WHEN fecha_bloqueado > NOW() THEN 'bloqueado' ELSE 'activo' END AS estado FROM usuarios WHERE rol = 'usuario'`);
    return result[0];
}

// exportar funciones

module.exports = {

    todosUsuarios, UnUsuario, crearUsuario, bloquearUsuario, eliminarUsuario, buscarUsuarioOCorreo, buscarUsuarioLogin,
    buscarUsuarios,contarUsuarios

}
