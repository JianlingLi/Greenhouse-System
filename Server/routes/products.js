const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ProductModel = require("../models/productModel");
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/', async function (req, res) {
    const data = await ProductModel.find(); //get the data from database
    res.status(200).json(data);
})

router.post("/", async function (req, res, next) {
  //console.log("monitors");
  try {
      const productInstance = new ProductModel({
      Temperature: req.body.Temperature,
      Humidity: req.body.Humidity,
      Visible_IR: req.body.Visible_IR,
      Infrared: req.body.Infrared,
      Illuminance: req.body.Illuminance,
      Weather: req.body.Weather,
      Out_Temp: req.body.Out_Temp,
      Out_Humi: req.body.Out_Humi,
      Out_Visible: req.body.Out_Visible,
      Out_WindSpeed: req.body.Out_WindSpeed,
      Location:req.body.Location,
      modifiedDate: new Date(),
      //categories: [req.body.categories],
    })
    const saveResult = await productInstance.save();
    res.status(201)
  } catch (error) {
    res.status(500).json(error);
  }
});

/*
router.get('/latest/:max', async function (req, res) {
  try {
      const products = await ProductModel.find()
          .limit(req.params.max)
          .sort({ modifiedDate : "desc"});
      res.status(200).json(products);
  } catch(error) {
      res.status(404).json(error);
  }
})

router.get('/last24Hours', async function (req, res) {
  try {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    //const data = await ProductModel.find({ modifiedDate: { $gte: last24Hours } });
    const data = await ProductModel.find({
      modifiedDate: {
        $gte: last24Hours,
        $lte: new Date(),
      },
    });

    console.log("Data received from database:", data)
    console.log("24h ",data);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
  }
});*/

router.get("/latest/:max", async function (req, res) {
  try {
    //const { location } = req.params;
    const { location } = req.query;
    const products = await ProductModel.find({ location: location })
      .limit(req.params.max)
      .sort({ modifiedDate : "desc"});
    res.status(200).json(products);
  } catch(error) {
    res.status(404).json(error);
  }
})

router.get("/last24Hours/:location", async function (req, res) {
  try {
    const { location } = req.params;
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const data = await ProductModel.find({
      location: location,
      modifiedDate: {
        $gte: last24Hours,
        $lte: new Date(),
      },
    });

    console.log("Data received from database:", data)
    console.log("24h ",data);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.put('/:id', function (req, res) {
  const singleProduct = products.find(p => p.id === parseInt(req.params.id));
  if(!singleProduct) return res.status(404).send("{}");
  singleProduct.name = req.query.name;
  res.status(200).json(singleProduct);
})   

router.delete("/:id", async function (req, res) {
  try {
    const product = await ProductModel.deleteOne({ _id: req.params.id });
    res.status(200).json(product);
  } catch (error) {
    return res.status(404).json("{}");
  }
});

module.exports = router;
