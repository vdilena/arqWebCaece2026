import express from "express"
import mongoose, { Schema } from "mongoose"
import dotenv from "dotenv"
import fs from "fs"
import { parse } from "csv-parse"
import { stringify } from 'csv-stringify'
import cors from 'cors'
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"


// Instancia de express y uso de json en express
const app = express()
app.use(express.json())
app.use(cors())

// Uso de variables de entorno
dotenv.config()

// Configuracion de constantes para tener variables de entorno
const PORT = process.env.PORT || 8080
const MONGOURL = process.env.MONGO_URL || "mongodb://localhost:27017/arq_web"
const JWT_SECRET = process.env.JWT_SECRET || "clave-super-secreta";

const camposValidos = (fila) => {

    let todasLasFilasValidas = true
    const elementosFila = Object.keys(fila)
    Object.keys(fila).forEach(key => {
        //console.log(key, fila[key]);
        const elementoEvaluado = fila[key]
        if (elementoEvaluado === "NA") {
            //console.log("Hay dato NA!")
            todasLasFilasValidas = false
            return false
        }
    })

    return todasLasFilasValidas
}

mongoose
    .connect(MONGOURL)
    .then(() => {
        console.log("Se extablecio la conexion con la base de datos")

        // Levantamos el server
        app.listen(PORT, async () => {
            console.log(`El servidor esta ejecutandose en el puerto ${PORT} y esta arriba`)
            const disponibilidadesCargadas = await hayDisponibilidadesCargadas()

            if(!disponibilidadesCargadas) {

                console.log("Comienzo a leer csv de disponibilidades")

                // Cargamos los datos
                const filas = []
                const filasNA = []
                const parser = fs
                    .createReadStream("disponibilidades_prepaga_caba.csv")
                    .pipe(
                        parse({
                            columns: true,
                            delimiter: ","
                        })
                    );
    
                for await (const fila of parser) {
                    filas.push(fila)
                }
    
                //1. Iterar el array de filas
                for (let index = 0; index < filas.length; index++) {
    
                    const fila = filas[index];
                    const nuevaDisponibilidad = {
                        fecha: fila["fecha"], // fecha
                        hora: fila.hora_inicio, // hora_inicio:
                        estado: fila.estado_disponibilidad, // estado_disponibilidad
                        especialista: {
                            especialista: fila.especialista,
                            matricula: fila.matricula
                        }, // (especialista, matricula)
                        especialidad: fila.especialidad,
                        planesAceptados: fila.plan, // plan
                        clinica: fila.clinica // clinica
                    }
    
                    //console.log(`Nueva disponibilidad: ${nuevaDisponibilidad}`)
    
    
                    //3. Validamos los datos antes de insertarlos
                    const sonValidosTodosLosCampos = camposValidos(fila)
                    if (!sonValidosTodosLosCampos) {
                        filasNA.push(fila)
                    } else {
                        //4. Guardar cada una de los documentos
                        await DisponibilidadModel.create(nuevaDisponibilidad);
                    }
    
                }
    
                console.log("Termino de cargar todos los documentos de disponibilidades!")
                //5. Ver como guardamos las filas no validas (primero guardamos en un array todas las filas y despues las guardamos todas en un archivo)
                // Cargamos filas con NA en otro archivo csv
                const stringifier = stringify(filasNA, {
                    header: true
                });
    
                stringifier.pipe(fs.createWriteStream("filas_con_na.csv"));
                console.log("Filas con NA agregadas correctamente")
            } else {
                console.log("Las disponibilidades ya fueron cargadas previamente. No se volveran a cargar!")
            }

        })
    })
    .catch((error) => console.log(error))

const hayDisponibilidadesCargadas = async () => {

    const hayDisponibilidades = await DisponibilidadModel.exists({});
    if (hayDisponibilidades != null) {
        return true
    }
    return false
}

// Creamos un esquema de alumnos
const alumnoSchema = mongoose.Schema({
    nombre: String,
    dni: Number,
    fechaNacimiento: Date,
    materias: Array
})

const AlumnoModel = mongoose.model("alumnos", alumnoSchema)

/*app.get("/:id", async (req, res) => {
    console.log(req.query)
    console.log(req.params)
    res.send("Estamos viendo la API del proyecto con parametros")
})


app.get("/", async (req, res) => {
    console.log(req.query)
    res.send("Estamos viendo la API del proyecto")
})*/


// Se obtienen los alumnos
app.get("/alumnos", authenticateToken, async (req, res) => {
    const alumnos = await AlumnoModel.find()
    res.json(alumnos)
})

// Creacion de un alumno
app.post("/alumnos", async (req, res) => {

    console.log(req.body)
    const nuevoAlumno = {
        nombre: req.body.nombre,
        dni: req.body.dni,
        fechaNacimiento: new Date(req.body.fechaNacimiento),
        materias: req.body.materias
    }
    const alumno = await AlumnoModel.create(nuevoAlumno);
    res.json(alumno)
})


// Se obtiene alumno por id
app.get("/alumnos/:id", async (req, res) => {

    console.log(req.query.apellido)
    const alumnoId = req.params.id
    const alumno = await AlumnoModel.findById(alumnoId)
    res.send(alumno)
})

/**
 * Esquemas
*/
//0. Crear esquemas y modelos en base a como definimos las colecciones
//2. Analizar en cada fila los datos que tengo
// Especialidades
const EspecialistaSchema = mongoose.Schema({
    especialista: String,
    matricula: String
})

const disponibilidadesSchema = mongoose.Schema({
    fecha: Date, // fecha
    hora: String, // hora_inicio:
    estado: String, // estado_disponibilidad
    especialista: EspecialistaSchema, // (especialista, matricula)
    especialidad: String,
    planesAceptados: String, // plan
    clinica: String // clinica
})

const DisponibilidadModel = mongoose.model("disponibilidades", disponibilidadesSchema)

// Buscar todas las disponibilidades
app.get("/disponibilidades", async (req, res) => {

    const disponibilidades = await DisponibilidadModel.find()
    res.json(disponibilidades)
})

// Buscar disponibilidades por id de especialista
app.get("/disponibilidades/especialista/:especialistaId", async (req, res) => {

    //console.log(req.params.especialistaId.toString())
    //console.log(req.query)
    const especialistaId = req.params.especialistaId.toString()
    if (!mongoose.isValidObjectId(especialistaId)) {
        return res.status(400).send({ message: 'Especialista invalido' });
    }
    const dispoPorEscialista = await DisponibilidadModel.find({ 'especialista._id': especialistaId })
    res.send(dispoPorEscialista)
})

// Buscar dispo por nombre de especialista y que devuelva los primeros 15 resultados que encuentre
app.get("/disponibilidades/especialista/nombre/:nombreEspecialista", async (req, res) => {

    const especialista = req.params.nombreEspecialista
    /*     if (!mongoose.isValidObjectId(especialistaId)) {
            return res.status(400).send({ message: 'Especialista invalido' });
        } */
    const dispoPorEspecialista = await DisponibilidadModel.find({ 'especialista.especialista': { $regex: especialista, $options: 'i' } }).limit(15)
    res.send(dispoPorEspecialista)
})

// Usuarios
// Creamos un esquema de alumnos
const usuarioSchema = mongoose.Schema({
    username: String,
    password: String,
    role: String
})

const UsuarioModel = mongoose.model("usuarios", usuarioSchema)

app.post("/usuarios", async (req, res) => {

    console.log(req.body)
    const nuevoUsuario = {
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 10),//bcrypt.hashSync("123456", 10),
        role: "admin"
    }
    const usuario = await UsuarioModel.create(nuevoUsuario);
    res.json(usuario)
})

// Mock de usuarios
const users = [
  {
    id: 1,
    username: "admin",
    // contraseña real: 123456
    password: bcrypt.hashSync("123456", 10),
    role: "admin"
  }
];

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      message: "No se envió el token en el header Authorization"
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      message: "Formato inválido. Debe ser: Bearer <token>"
    });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Token inválido o vencido"
    });
  }
}

// Endpoint de login
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username y password son obligatorios"
    });
  }

  //const user = users.find(u => u.username === username);
  let user = await UsuarioModel.findOne({ 'username': username })

  if (!user) {
    console.log("No encontro user")
    return res.status(401).json({
      message: "Credenciales inválidas"
    });
  }

  console.log(`usuarios: ${user}, ${user.username}`)

  const passwordOk = await bcrypt.compare(password, user.password);

  if (!passwordOk) {
    return res.status(401).json({
      message: "Credenciales inválidas"
    });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );

  return res.json({
    message: "Login correcto",
    token
  });
});

app.get("/", (req, res) => {
  res.send("Aplicacion Node Arq Web levantada")
});


app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/ready", (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;

  if (!mongoConnected) {
    return res.status(503).json({
      ok: false,
      mongo: "disconnected"
    });
  }

  res.status(200).json({
    ok: true,
    mongo: "connected"
  });
});