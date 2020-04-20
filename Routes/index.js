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
 *      tags: [Endpoints]
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
  *      tags: [Endpoints]
  *      requestBody:
  *        required: true
  *        content:
  *          application/json:
  *            schema:
  *              type: object
  *              properties:
  *                userId:
  *                  type: string
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
   *      tags: [Endpoints]
   *      requestBody:
   *        required: true
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                userId:
   *                  type: string
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
 *      tags: [Endpoints]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                userId:
 *                  type: string
 *                  description: Identification number of the user
 *                  example: "312458"

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
 *                  type: string
 *                  description: Identification number of the user
 *                  example: "87457"
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
  *      tags: [Endpoints]
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
 *      summary: Get timesheets of all users
 *      tags: [Endpoints]
 *      responses:
 *        "200":
 *          description: Timesheet of all users
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                parameters:
 *                 type:[]
 *
 */
 /**
 * @swagger
 * path:
 *  /timesheets/{user}:
 *    get:
 *      summary: Get timesheet of a user
 *      tags: [Endpoints]
 *      parameters:
 *         - in: path
 *           name: user
 *           description: Get timesheet of user
 *           schema:
 *             type: string
 *             example: "0928234"
 *             description: enter id number of user
 *      responses:
 *        "200":
 *          description: Timesheet of a particular user
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/User'
 *        "400":
 *           description: Request Requires Parameter id to be filled
 *        "500":
 *           description: Internal Server Error
 *        "404":
 *           description: User does not exist!
 *
 *
 *
 */

 // /**
 // * @swagger
 // * path:
 // *  /users/:
 // *    get:
 // *      summary: Get all users
 // *      tags: [Endpoints]
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


  // other users already in the system.. Test data
  const john = new User("564782", "01/03/2020", "07:48", "WORK" );
  const paul = new User("107589", "01/04/2020", "17:28", "WORK" );
  const tim = new User("078924", "01/05/2020", "12:48", "PTO" );
  const donna = new User("335470", "02/15/2020", "00:05", "ADMIN" );
  const peter = new User("464535", "02/15/2020", "00:29", "ADMIN" );
  const sarah = new User("346230", "02/06/2020", "00:52", "WORK" );


  return res.json( {john,paul,tim,donna,peter,sarah} );
});


router.get("/timesheets/:user", (req, res, next) => {

  // test data
  const user1 = new User("12345", "01/03/2020", "07:48", "WORK" );



  res.json(user1);
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
        url: "http://localhost:5433/"
      }
    ]
  },
  apis: ["./Models/User.js", "./Routes/index.js"]
};
const specs = swaggerJsdoc(options);
router.use("/documentation", swaggerUi.serve);
router.get("/documentation", swaggerUi.setup(specs, { explorer: true }));

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
