const express = require("express");
const urlModel = require("../models/url.model");
const validUrl = require("valid-url");
const shortId = require("shortid")
const requestIP = require('request-ip');
var QRCode = require('qrcode')
const Redis = require("redis")
require('dotenv').config();

const urlRoute = express.Router();

const redisClient = Redis.createClient()

const DEFAULT_EXPIRATION = 3600;


// urlRoute.get('/', async (req, res) => {
//   const shortUrls = await urlModel.find()
//   res.render('index', { shortUrls: shortUrls})
// })



urlRoute.get('/:urlCode', async (req, res) => {
  try {
    const urlData = await urlModel.findOne({urlCode: req.params.urlCode})

    const ipAddress = await requestIP.getClientIp(req);
    
    if (urlData) {
      urlData.clicks++
      urlData.ipAddress.includes(ipAddress) 
      if (!urlData.ipAddress.includes(ipAddress)) {
        urlData.ipAddress.push(ipAddress)
      } 
      urlData.save() 
      res.status(200).json(urlData)
      // return res.redirect(urlData.longUrl)
    } else {
      return res.status(404).json("No url found")
    }
  } catch (error) {
    console.log(error);
    res.status(404).json("No url found")
  } 

})


// urlRoute.get('/:shortUrl', async (req, res) => {
//   const shortUrl = await urlModel.findOne({short_url: req.params.shortUrl})

//   if(shortUrl == null) {
//     return res.status(404).json('Invalid URL')
//   }

//   shortUrl.clicks++

//   shortUrl.save()

//   res.redirect(shortUrl.full_url)
// })



urlRoute.post('/', async (req, res) => {

  let { longUrl, urlCode } = req.body;

  const baseUrl = process.env.BASE_URL;

  //verify that base url is valid
  if(!validUrl.isUri(baseUrl)) {
    return res.status(401).json("Invalid base URL");
  }

  //Generate short URL code if there is none
  if (!urlCode) {
    urlCode = shortId.generate() 
  }

  //Verify Long URL
  if(validUrl.isUri(longUrl)) {
    try {
      //check if long url is already in the database and return its details if its there already. Else create new short Uurl details for it
      let url = await urlModel.findOne({ longUrl })
      if (url) {
        res.json(url)
      } else {
        let codeCheck = await urlModel.findOne({ urlCode })
        if (codeCheck) {
          res.send("URL Code exists Already")
        } else {
          const shortUrl = baseUrl + "/" + urlCode

          const qrCode = await QRCode.toDataURL(longUrl)

          url = await urlModel.create({
            longUrl,
            shortUrl,
            urlCode,
            qrCode,
            date: new Date()
          });


          res.json(url)
        }
        
      }
    } catch (error) {
        console.log(error);
        res.status(500).json("Server Error")
    }
  } else {
    res.status(401).json("invalid long url")
  }

  // await urlModel.create({
  //   full_url: req.body.fullUrl
  // })

  // res.redirect('/')
})



urlRoute.delete('/:id', async (req, res) => {

  const urlId = req.params.id;

  try {
    await urlModel.findByIdAndDelete(urlId)
    res.status(200).json("URL successfully deleted..."); 
  } catch (err) {
    res.status(500).json(err);
  }
})



module.exports = urlRoute;