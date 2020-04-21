"use strict";

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");


class User {
  constructor(userId, eventDate, entryTime, punchType) {
    this.userId = userId;
    this.eventDate = eventDate;
    this.entryTime = entryTime;
    this.punchType = punchType;
  }
}


/**
 * @swagger
 * tags:
 *   name: Endpoints
 *   description: Explore the API Endpoints
 */


/**
 * @swagger
 *  components:
 *    schemas:
 *      Employee:
 *        type: object
 *        properties:
 *          userId:
 *            type: string
 *            description: Users identification number
 *          eventDate:
 *            type: string
 *            description: Scheduled shift date
 *          entryTime:
 *            type: string
 *            description: Time user clocked in
 *          punchType:
 *            type: string
 *            description: Type of clock in performed
 *                WORK, PTO, UPTO, ADMIN
 *          notes:
 *             type: string
 *             description: Notes for the day
 *
 *        example:
 *           "userId": "09771"
 *           "eventDate": "01/12/2021"
 *           "entryTime": "00:00"
 *           "punchType": "ADMIN"
 *           "notes": "Mary had a little lamb"

 *      User:
 *        type: object
 *        required:
 *          - firstName
 *          - lastName
 *          - email
 *          - password
 *        properties:
 *          firstName:
 *            type: string
 *            description: Users first name
 *          lastName:
 *            type: string
 *            description: Users last name
 *          email:
 *            type: string
 *            description: Users e-mail address
 *          password:
 *            type: string
 *            description: Password of user
 *          notes:
 *             type: string
 *             description: Notes for the day
 *
 *        example:
 *           "firstName": "Peter"
 *           "lastName": "Pan"
 *           "email": "peterpan@thepanning.com"
 *           "password": "12buck"
 *           "notes": "Yes, no, maybe"
 *
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
  *                 type: string
  *                 description: Employees identification number
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
   *  /report/{user}:
   *    post:
   *      summary: Get a report that includes a specific user.
   *      tags: [Endpoints]
   *      requestBody:
   *        required: true
   *        content:
   *          application/json:
   *              schema:
   *                $ref: '#/components/schemas/Employee'
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
  *             example: "12345"
  *             description: enter id number of user
  *      responses:
  *        "200":
  *          description: Timesheet of a particular user
  *          content:
  *            application/json:
  *              schema:
  *                $ref: '#/components/schemas/Employee'
  *        "400":
  *           description: Request Requires Parameter id to be filled
  *        "500":
  *           description: Internal Server Error
  *        "404":
  *           description: Employee does not exist!
  */

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
