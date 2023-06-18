const express = require("express");
const Database = require("./dbConnect")
const urlRoute = require("./routes/url.route")
require('dotenv').config();

const app = express()


const PORT = process.env.PORT || 5000

// connect to database
Database.connect();

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use("/", urlRoute);

// app.get('/', (req, res) => {
//   res.render('index')
// })

app.listen(PORT, () => {
  console.log("App Listening on PORT:", PORT);
})