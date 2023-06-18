const express = require("express");
const urlModel = require("../models/url.model");

const urlRoute = express.Router();


urlRoute.get('/', async (req, res) => {
  const shortUrls = await urlModel.find()
  res.render('index', { shortUrls: shortUrls})
})


urlRoute.get('/:shortUrl', async (req, res) => {
  const shortUrl = await urlModel.findOne({short_url: req.params.shortUrl})

  if(shortUrl == null) {
    return res.sendStatus(404)
  }

  shortUrl.clicks++

  shortUrl.save()

  res.redirect(shortUrl.full_url)
})



urlRoute.post('/', async (req, res) => {
  await urlModel.create({
    full_url: req.body.fullUrl
  })

  res.redirect('/')
})


module.exports = urlRoute;