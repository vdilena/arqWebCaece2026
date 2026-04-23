import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import fs from "fs"
import { parse } from "csv-parse"

// Instancia de express y uso de json en express
const app = express()
app.use(express.json())

// Uso de variables de entorno
dotenv.config()

// Configuracion de constantes para tener variables de entorno
const PORT = process.env.PORT || 8080
const MONGOURL = process.env.MONGO_URL

mongoose
    .connect(MONGOURL)
    .then(() => {
        console.log("Se extablecio la conexion con la base de datos")

        // Levantamos el server
        app.listen(PORT, async () => {
            console.log(`El servidor esta ejecutandose en el puerto ${PORT} y esta arriba`)

            // Cargamos los datos
            const filas = []
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

            //0. Crear esquemas y modelos en base a como definimos las colecciones
            //1. Iterar el array de filas
            //2. Analizar en cada fila los datos que tengo
            //3. Validamos los datos antes de insertarlos
            //4. Guardar cada una de los documentos
            //5. Ver como guardamos las filas no validas (primero guardamos en un array todas las filas y despues las guardamos todas en un archivo)

            console.log(filas[0])
            console.log(filas[1])
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



