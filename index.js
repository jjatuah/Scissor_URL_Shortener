const express = require("express");
const Database = require("./dbConnect")
const urlRoute = require("./routes/url.route")
const cors = require("cors");
require('dotenv').config();

const app = express()


const PORT = process.env.PORT || 5000


const corsOrigin ={
  origin:'*', //or whatever port your frontend is using
  credentials:true,            
  optionSuccessStatus:200
}
app.use(cors(corsOrigin));



 
// connect to database
Database.connect();

app.use(express.json());
app.use(express.urlencoded());
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false})) 
app.use("/", urlRoute);

// app.get('/', (req, res) => {
//   res.render('index') 
// })

app.listen(PORT, () => {
  console.log("App Listening on PORT:", PORT);
})