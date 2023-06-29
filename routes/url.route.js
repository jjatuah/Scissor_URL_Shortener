const express = require("express");
const urlModel = require("../models/url.model");
const validUrl = require("valid-url");
const shortId = require("shortid")
const requestIP = require('request-ip');
var QRCode = require('qrcode')
const redis = require('redis');
require('dotenv').config();

const urlRoute = express.Router();

const redisClient = redis.createClient({ host: 'localhost', port: 6379 });

const DEFAULT_EXPIRATION = 3600;

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (error) => { 
  console.error('Redis connection error:', error);
});

// urlRoute.get('/', async (req, res) => {
//   const shortUrls = await urlModel.find()
//   res.render('index', { shortUrls: shortUrls})
// })
  

urlRoute.get('/', async (req, res) => { 
  try {
    redisClient.get("/", async (error, urlInfo) => { 
      if (error) {
        console.error(error);
      }
      if (urlInfo != null) {  
        console.log("cache Hit");
        return res.json(JSON.parse(urlInfo));
      } else {
        console.log('cache miss');    
        const url = await urlModel.find().sort({ _id: -1 }).limit(20);
        redisClient.setex("/", DEFAULT_EXPIRATION, JSON.stringify(url));
        res.status(200).json(url);
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err });
  }
});



urlRoute.get('/:urlCode', async (req, res) => {
  try {
    redisClient.get(req.params.urlCode, async (error, urlInfo) => {
      if (error) {
        console.error(error);
      }
      
      if (urlInfo != null) {
        console.log("cache Hit");
        return res.json(JSON.parse(urlInfo));
      } else {
        console.log('cache miss');
        const urlData = await urlModel.findOne({ urlCode: req.params.urlCode });
        const ipAddress = await requestIP.getClientIp(req);

        if (urlData) {
          urlData.clicks++;
          if (!urlData.ipAddress.includes(ipAddress)) {
            urlData.ipAddress.push(ipAddress);
          }
          urlData.save();
          redisClient.setex(req.params.urlCode, DEFAULT_EXPIRATION, JSON.stringify(urlData));
          res.status(200).json(urlData);
        } else {
          return res.status(404).json("No URL found");
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.status(404).json("No URL found");
  }
});



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
    // Delete the URL from the database
    const deletedUrl = await urlModel.findByIdAndDelete(urlId);

    // If the URL was successfully deleted from the database
    if (deletedUrl) {
      // Delete the corresponding Redis data
      redisClient.del(`/${urlId}`, (error, result) => {
        if (error) {
          console.error(error);
        }
        console.log(`Deleted Redis data for URL with id: ${urlId}`);

        // Invalidate the cache for the deleted URL
        redisClient.del("/", (error, result) => {
          if (error) {
            console.error(error);
          }
          console.log("Invalidated cache for URL list");
        });
      });

      res.status(200).json("URL successfully deleted...");
    } else {
      res.status(404).json("No URL found");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

  


module.exports = urlRoute; 