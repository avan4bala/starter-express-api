const http = require('http');
const fs = require('fs');
const portNumber = process.argv[2];
const express = require('express');   
const app = express();
const bodyParser = require("body-parser"); 
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })

process.stdin.setEncoding("utf8");
console.log(`Web server is running at http://localhost:${portNumber}`);
const prompt = "Type stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    let command = dataInput.trim();
    if (command === "stop") {
      console.log("Shutting down the server");
      process.exit(0)
    }
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: "FINAL_DB", collection:"librarymemmbers"};

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.3sh5ylr.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => { 
    response.render("index")
});

app.get("/checkout", (request, response) => { 
    response.render("checkoutform")
});

app.get("/qrcode", (request, response) => { 
    let number = Math.random() * 100;
    qrcode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${number}` 
    let variables = {
        code: qrcode
    }
    response.render("qrcode", variables);
});

app.use(bodyParser.urlencoded({extended:false}));

app.post("/checkout", (request, response) => { 
    let {name, email, bookname, author} = request.body;
    let variables = {
        name:name,
        email:email,
        bname:bookname,
        author: author
    }
    insertapplications(client, databaseAndCollection, variables);
    qrcode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${name}` 



    response.render("processcheckout", variables);
});

async function insertapplications(client, databaseAndCollection, newapplication) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newapplication);
}

app.get("/retrievebyBookname", (request, response) => { 
    response.render("retrieveinfo")
});

app.post("/retrievebyBookname", async (request, response) => { 
    var bookname = request.body.bookname;
    var name;
    var author;
    var email;

    const cursor = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({bname: bookname});
    const result = await cursor.toArray();
    let res = result[0]
    name = res.name;
    email = res.email;
    author = res.author;

    let variables = {
        name: name,
        email: email,
        author: author,
        bookname: bookname
    }

    response.render("filterbybookname", variables);


});


app.get("/removeall", (request, response) => { 
    response.render("removeall")
});

app.post("/removeall", async (request, response) => { 
    let filter = {};
    var variables;
    try {
        await client.connect();
        const res = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany(filter);
        const result = await res;
        let x = result.deletedCount;
        variables = {number: x};
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }

    response.render("afterallremoved", variables);
});


app.listen(portNumber);
