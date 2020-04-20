"use strict";
// Node Modules
const express = require("express");
const bodyParser = require("body-parser");

// App Modules
const routes = require("./Routes");

// Set up app
const app = express();

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// include routes
app.use("/", routes);

app.listen(5433, () => console.log(`Listening on port 5433:`));
