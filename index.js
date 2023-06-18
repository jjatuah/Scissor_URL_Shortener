const express = require("express");
const app = express()
const mongoose = require("mongoose");

const PORT = 5000

mongoose.connect("mongodb://localhost:27017/Scissor", {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('index')
})

app.listen(PORT)