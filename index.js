const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//! middleWire
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dzik2b9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const productCollection = client.db("productDB").collection("products");

    const cartCollection = client.db("cartDB").collection("cart");

    //! Products
    app.get("/products", async (req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    app.get("/productsByBrand/:brandname", async (req, res) => {
      const brandname = req.params.brandname;

      const result = await productCollection
        .find({ brand: brandname })
        .toArray();
      res.json(result);
    });

    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      console.log(newProduct);
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = req.body;
      const product = {
        $set: {
          image: updatedProduct.image,
          name: updatedProduct.name,
          brand: updatedProduct.brand,
          type: updatedProduct.type,
          price: updatedProduct.price,
          shortDescription: updatedProduct.shortDescription,
          rating: updatedProduct.rating,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        product,
        options
      );
      res.send(result);
    });

    //! Cart
    app.post("/cart", async (req, res) => {
      const cartProduct = req.body;
      console.log(cartProduct);
      const existingItem = await cartCollection.findOne({
        name: cartProduct.name
      });

      if (existingItem) {
        
        const existingItemWithEmail = await cartCollection.findOne({
          name: cartProduct.name, email: cartProduct.email
        });

        if (existingItemWithEmail) {
          const message = "Item already added";
          res.send(message);
          return;
        }
         else {
          const result = await cartCollection.insertOne(cartProduct);
          res.send(result);
          
        }
      } else {
        const result = await cartCollection.insertOne(cartProduct);
        res.send(result);
       
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Brand Shop is Running");
});

app.listen(port, (req, res) => {
  console.log(`Brand Shop is running on ${port}`);
});
