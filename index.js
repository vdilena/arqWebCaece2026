import express from "express"
import mongoose, { Schema } from "mongoose"
import dotenv from "dotenv"
import fs from "fs"
import { parse } from "csv-parse"
import { stringify } from 'csv-stringify'


// Instancia de express y uso de json en express
const app = express()
app.use(express.json())

// Uso de variables de entorno
dotenv.config()

// Configuracion de constantes para tener variables de entorno
const PORT = process.env.PORT || 8080
const MONGOURL = process.env.MONGO_URL

const camposValidos = (fila) => {

    let todasLasFilasValidas = true
    const elementosFila = Object.keys(fila)
    Object.keys(fila).forEach(key => {
        //console.log(key, fila[key]);
        const elementoEvaluado = fila[key]
        if(elementoEvaluado === "NA") {
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
        })
    })
    .catch((error) => console.log(error))

// Creamos un esquema de alumnos
const alumnoSchema = mongoose.Schema({
    nombre: String,
    dni: Number,
    fechaNacimiento: Date,
    materias: Array
})

const AlumnoModel = mongoose.model("alumnos", alumnoSchema)

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


app.get("/:id", async (req, res) => {
    console.log(req.query)
    console.log(req.params)
    res.send("Estamos viendo la API del proyecto con parametros")
})


app.get("/", async (req, res) => {
    console.log(req.query)
    res.send("Estamos viendo la API del proyecto")
})


// Se obtienen los alumnos
app.get("/alumnos", async (req, res) => {
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



