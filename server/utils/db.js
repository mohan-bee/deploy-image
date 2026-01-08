const mongoose = require("mongoose")

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGOURI)
        console.log("Database connected successfully")
    } catch (error) {
        console.log("Error connecting database", error)
    }
}


module.exports = dbConnection