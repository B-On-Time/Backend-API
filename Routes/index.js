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
 *
 *components:
 *   securitySchemes:
 *     BasicAuth:
 *       type: http
 *       scheme: basic
 *
 *
 *
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
 *          description: The user who clocked in
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
  *        "500":
  *          description: An Error has occured E100
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
 *      responses:
 *        "200":
 *          description: A user schema
 *          content:
 *            application/json:
 *              schema:
 *              type: object
 *              properties:
 *                userId:
 *                  type: integer
 *                  description: Identification number of the user
 *                  example: 87457
 *        "404":
 *          description: User cannot be found.
 *        "403":
 *          description: make sure you're clocked in and not on break
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

 /**
 * @swagger
 * path:
 *  /timesheets:
 *    get:
 *      summary: Get timesheets of users
 *      tags: [Users]
 *      responses:
 *        "200":
 *          description: An array of users timesheets
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                parameters:
 *
 */

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

router.get("/timesheets", (req, res, next) => {
  const { userId, eventDate, entryTime, punchType } = req.body;


  // other users already in the system.. Test data
  const user1 = new User(req.body.userId, req.body.eventDate, req.body.entryTime, req.body.punchType);
  const user2 = new User("564782", "01/03/2020", "07:48", "WORK" );
  const user3 = new User("107589", "01/04/2020", "17:28", "WORK" );
  const user4 = new User("078924", "01/05/2020", "12:48", "PTO" );
  const user5 = new User("335470", "02/05/2020", "00:05", "ADMIN" );
  const user6 = new User("335470", "02/05/2020", "00:05", "ADMIN" );
  const user7 = new User("335470", "02/05/2020", "00:05", "ADMIN" );



  res.json(text);
});



router.post("/timesheets/:id", (req, res, next) => {
  const { userId, eventDate, entryTime, punchType } = req.body;
  const user = new User(userId, eventDate, entryTime, punchType );
  res.json(req.body.userId);
});


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
