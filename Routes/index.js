"use strict";
// Node Modules
const express = require("express");
const router = express.Router();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// App Modules
const User = require("../Models/User");

/**
 * @swagger
 * tags:
 *   name: Endpoints
 *   description: Explore the API Endpoints
 */

/**
 * @swagger
 * path:
 *  /clock/in/:
 *    post:
 *      summary: Logs a user in.
 *      tags: [Users]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      responses:
 *        "200":
 *          description: A user schema
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/User'
 *        "404":
 *          description: User cannot be found.
 *        "403":
 *          description: User cannot clock in, Already clocked in.
 *          content:
 *           application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  userId: "53924"
 *        "500":
 *          description: An Error has occured E100
 *
 */


 /**
  * @swagger
  * path:
  *  /clock/status/:
  *    post:
  *      summary: Checks the clock status
  *      tags: [Users]
  *      requestBody:
  *        required: true
  *        content:
  *          application/json:
  *            schema:
  *              type: object
  *              properties:
  *                userId:
  *                  type: integer
  *                  description: Identification number of the user
  *                  example: 312458
  *
  *
  *      responses:
  *        "200":
  *          description: A user schema
  *          content:
  *            application/json:
  *              schema:
  *                $ref: '#/components/schemas/User'
  *        "404":
  *          description: User cannot be found.
  *        "403":
  *          description: User cannot clock in, Already clocked in.
  *          content:
  *           application/json:
  *            schema:
  *              type: object
  *              properties:
  *                  userId: "53924"
  *        "500":
  *          description: An Error has occured E100
  *
  */

  /**
   * @swagger
   * path:
   *  /break/end/:
   *    post:
   *      summary: Logs a user out of break mode.
   *      tags: [Users]
   *      requestBody:
   *        required: true
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                userId:
   *                  type: integer
   *                  description: Identification number of the user
   *                  example: 312458
   *      responses:
   *        "200":
   *          description: A user schema
   *          content:
   *            application/json:
   *              schema:
   *                $ref: '#/components/schemas/User'
   *        "404":
   *          description: User cannot be found.
   *        "403":
   *          description: User cannot clock in, Already clocked in.
   *          content:
   *           application/json:
   *            schema:
   *              type: object
   *              properties:
   *                  userId: "53924"
   *        "500":
   *          description: An Error has occured E100
   *
   */

/**
 * @swagger
 * path:
 *  /break/start/:
 *    post:
 *      summary: Logs a user into break mode.
 *      tags: [Users]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                userId:
 *                  type: integer
 *                  description: Identification number of the user
 *                  example: 312458
 *
 *
 *      responses:
 *        "200":
 *          description: A user schema
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/User'
 *        "404":
 *          description: User cannot be found.
 *        "403":
 *          description: User cannot clock in, Already clocked in.
 *          content:
 *           application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  userId: "53924"
 *        "500":
 *          description: An Error has occured E100
 *
 */

 /**
  * @swagger
  * path:
  *  /clock/out/:
  *    post:
  *      summary: Logs a user out.
  *      tags: [Users]
  *      requestBody:
  *        required: true
  *        content:
  *          application/json:
  *            schema:
  *              $ref: '#/components/schemas/User'
  *      responses:
  *        "200":
  *          description: A user schema
  *          content:
  *            application/json:
  *              schema:
  *                $ref: '#/components/schemas/User'
  *        "403":
  *          description: User cannot clock out, Already clocked in.
  *          content:
  *           application/json:
  *            schema:
  *              type: object
  *              properties:
  *                  userId: "53924"
  *        "404":
  *          description: User cannot be found.
  *        "500":
  *          description: An Error has occured E100
  *
  */

 // /**
 // * @swagger
 // * path:
 // *  /users/{userId}:
 // *    get:
 // *      summary: Get a user by id
 // *      tags: [Users]
 // *      parameters:
 // *        - in: path
 // *          name: userId
 // *          schema:
 // *            type: string
 // *          required: true
 // *          description: Id of the user
 // *      responses:
 // *        "200":
 // *          description: An users object
 // *          content:
 // *            application/json:
 // *              schema:
 // *                $ref: '#/components/schemas/User'
 // */

 // /**
 // * @swagger
 // * path:
 // *  /users/:
 // *    get:
 // *      summary: Get all users
 // *      tags: [Users]
 // *      parameters:
 // *        - in: query
 // *          name: name
 // *          schema:
 // *            type: string
 // *          description: Name you want users to match
 // *      responses:
 // *        "200":
 // *          description: An array of users
 // *          content:
 // *            application/json:
 // *              schema:
 // *                $ref: '#/components/schemas/User'
 // */



router.post("/clock/in/", (req, res, next) => {
  const { userId, eventDate, entryTime, punchType } = req.body;
  const user = new User(userId, eventDate, entryTime, punchType );
  res.json(user);
});

router.post("/clock/out/", (req, res, next) => {
  const { userId, eventDate, entryTime, punchType } = req.body;
  const user = new User(userId, eventDate, entryTime, punchType );
  res.json(user);
});

router.post("/break/start/", (req, res, next) => {
  const { userId, eventDate, entryTime, punchType } = req.body;
  const user = new User(userId, eventDate, entryTime, punchType );
  res.json(req.body.userId);
});

router.post("/break/end/", (req, res, next) => {
  const { userId, eventDate, entryTime, punchType } = req.body;
  const user = new User(userId, eventDate, entryTime, punchType );
  res.json(req.body.userId);
});

router.post("/clock/status/", (req, res, next) => {
  const { userId, eventDate, entryTime, punchType } = req.body;
  const user = new User(userId, eventDate, entryTime, punchType );
  res.json(req.body.userId);
});




// /**
//  * @swagger
//  * path:
//  *  /users/:
//  *    get:
//  *      summary: Get all users
//  *      tags: [Users]
//  *      responses:
//  *        "200":
//  *          description: An array of users
//   *          content:
//   *            application/json:
//   *              schema:
//   *                $ref: '#/components/schemas/User'
//  */

// router.get("/users", (req, res, next) => {
//   const userOne = new User("Alexander", "fake@gmail.com");
//   const userTwo = new User("Ryan", "fakeagain@gmail.com");
//   res.json({ userOne, userTwo });
// });

// router.get("/users/:userId", (req, res, next) => {
//   const userOne = new User("Alexander", "fake@gmail.com");
//   res.json({ userOne });
// });


// Swagger set up
const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "B-On-Time API Documentation",
      version: "1.0.0",
      description:
        "This is the Swagger API Documentation for B-On-Time."

    },
    servers: [
      {
        url: "http://localhost:3000/api/v1"
      }
    ]
  },
  apis: ["./Models/User.js", "./Routes/index.js"]
};
const specs = swaggerJsdoc(options);
router.use("/docs", swaggerUi.serve);
router.get("/docs", swaggerUi.setup(specs, { explorer: true }));

// catch 404 and forward to error handler
router.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error Handler
router.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

module.exports = router;
