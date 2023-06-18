const express = require("express");
const app = express()
const mongoose = require("mongoose");
const urlRoute = require("./routes/url.route")

const PORT = 5000

mongoose.connect("mongodb://localhost:27017/Scissor", {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use("/", urlRoute);

// app.get('/', (req, res) => {
//   res.render('index')
// })

app.listen(PORT)