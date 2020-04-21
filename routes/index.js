"use strict";
// Node Modules
const express = require("express");
const router = express.Router();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const _ = require('underscore');

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
 *      summary: Clock Employee In.
 *      tags: [Endpoints]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Employee'
 *      responses:
 *        "200":
 *          description: A user schema
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Employee'
 *        "404":
 *          description: Employee cannot be found.
 *        "403":
 *          description: Employee cannot clock in, Already clocked in.
 *          content:
 *           application/json:
 *            schema:
 *              type: object
 *              properties:
 *                userId:
 *                 type: string="Current User"
 *                 description: Employee User UUID
 *                eventDate:
 *                  type: string
 *                  description: Scheduled shift date
 *                entryTime:
 *                 type: string
 *                 description: Time user clocked in
 *                punchType:
 *                 type: string
 *                 description: Type of clock in performed
 *                  WORK, PTO, UPTO, ADMIN
 *                notes:
 *                 type: string
 *                 description: Notes for the day
 *
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
  *                $ref: '#/components/schemas/Employee'
  *        "404":
  *          description: Employee cannot be found.
  *        "403":
  *          description: Employee cannot clock in, Already clocked in.
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
   *                $ref: '#/components/schemas/Employee'
   *        "404":
   *          description: Employee cannot be found.
   *        "403":
   *          description: Employee cannot clock in, Already clocked in.
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
 *                  example: "f0496731-8bfd-48ce-a765-2818cda5a25b"
 *                eventDate:
 *                  type: string
 *                  description: Date of the event
 *                  example: "2020-04-16"
 *                entryTime:
 *                  type: string
 *                  description: Time break started
 *                  example: "08:21 AM"
 *                punchType:
 *                  type: string
 *                  description: Type of punch, ADMIN. PTO. UPTO. WORK.
 *                  example: "f0496731-8bfd-48ce-a765-2818cda5a25b"
 *                notes:
 *                  type: string
 *                  description: notes for the day
 *                  example: "Take cat out of the fridge. When I'm done with mah break."
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
 *          description: Employee cannot be found.
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
  *              $ref: '#/components/schemas/Employee'
  *      responses:
  *        "200":
  *          description: A user schema
  *          content:
  *            application/json:
  *              schema:
  *                $ref: '#/components/schemas/Employee'
  *        "403":
  *          description: Employee cannot clock out, Already clocked in.
  *          content:
  *           application/json:
  *            schema:
  *              type: object
  *              properties:
  *                userId:
  *                 type: String
  *                 description: already clocked in!
  *                 example: "53924"
  *
  *        "404":
  *          description: Employee cannot be found.
  *        "500":
  *          description: An Error has occured E100
  *
  */

 /**
  * @swagger
  * path:
  *  /report/all:
  *    post:
  *      summary: Get a report that includes all users.
  *
  *      tags: [Endpoints]
  *      requestBody:
  *        required: true
  *        content:
  *          application/json:
  *            schema:
  *              type: object
  *              properties:
  *                userId:
  *                 type: string
  *                 description: Employees identification number
  *
  *      responses:
  *        "200":
  *          description: A user schema
  *          content:
  *            application/json:
  *            schema:
  *              type: object
  *              properties:
  *                 description: An array of users if multiple are sent else just
  *                   the requesting user.
  *                 example: "53924"
  *        "400":
  *          description: Body Must Contain startDate in the following format (YYYY-MM-DD)
  *          content:
  *           application/json:
  *            schema:
  *              type: object
  *              properties:
  *                startDate:
  *                 type: string
  *                 description: Employees identification number
  *
  */

 /**
  * @swagger
  * path:
  *  /user:
  *    post:
  *      summary: Create a user.
  *
  *      tags: [Endpoints]
  *      requestBody:
  *        required: true
  *        content:
  *          application/json:
  *            schema:
  *             $ref: '#/components/schemas/User'
  *
  *      responses:
  *        "200":
  *          description: User successfully created!
  *          content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 Success: True
  *
  *
  *
  *
  *
  */

 /**
  * @swagger
  * path:
  *  /report:
  *    post:
  *      summary: Get A Summary Report For A User Over A Given Date Range.
  *      tags: [Endpoints]
  *      requestBody:
  *        required: true
  *        content:
  *          application/json:
  *              schema:
  *                $ref: '#/components/schemas/ReportSingle'
  *
  *      responses:
  *        "200":
  *          description: A user schema
  *          content:
  *           application/json:
  *              schema:
  *              type: object
  *              properties:
  *                period_start:
  *                  type: string
  *                  description: period start timestamp
  *                  example: "09:02 AM"
  *                period_end:
  *                  type: string
  *                  description: period end timestamp
  *                  example: "2020-04-16"
  *                reports:
  *                  type: object
  *                  properties:
  *                     date:
  *                       type: string
  *                       description: detail item date
  *                     type:
  *                       type: string
  *                       description: WORK / PTO / UPTO / ADMIN
  *
  *
  *        "400":
  *          description: Body Must Contain startDate in the following format (YYYY-MM-DD)
  *          content:
  *           application/json:
  *            schema:
  *              type: object
  *              properties:
  *                startDate:
  *                 type: string
  *                 description: Employees identification number
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
 // *                $ref: '#/components/schemas/Employee'
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

router.post("/user", (req, res, next) => {
  const { userId, eventDate, entryTime, punchType } = req.body;
  const user = new User(userId, eventDate, entryTime, punchType );



  res.json({
  "firstName": "John",
  "lastName": "Smith",
  "email": "Johnsmith@gmail.com",
  "password": "123456",
  "notes": "Get the dog"
});
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


router.get("/report/{user}", (req, res, next) => {

  var report_response_format = {
      period_start: 'period start timestamp',
      period_end: 'period end timestamp',
      reports:[ // 0 or more
          {
              meta: {
                  userID: 'id',
                  fullName: 'full_name',
                  totals: {
                      work: 1,
                      pto: 1,
                      upto: 1,
                      admin: 1
                  }
              },
              detail: [ // 0 or more
                  {
                      date: 'detail item date',
                      type: 'WORK / PTO / UPTO / ADMIN',
                      clockIn: 'clock in time',
                      clockOut: 'clock out time',
                      billableMins: '# of billable minutes',
                      breakTotalMins: '# of break minutes',
                      breaks: [ // 0 or more
                          {
                              breakStart: 'break start time',
                              breakEnd: 'break end time',
                              breakMins: 'length of break in minutes'
                          }
                      ]

                  }
              ]
          }

      ]
  }



  res.json({"NO":"NO!!!!!!!!!!!!!"});
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
        url: "http://api.crabrr.com/"
      }
    ],

    components:{
      securitySchemes:{
        basicAuth:{ type:{} ,scheme:{}

    }}

  }},
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
