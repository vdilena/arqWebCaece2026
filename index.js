import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"

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
        app.listen(PORT, () => {
            console.log(`El servidor esta ejecutandose en el puerto ${PORT}`)
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



