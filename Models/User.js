"use strict";

class User {
  constructor(userId, eventDate, entryTime, punchType) {
    this.userId = userId;
    this.eventDate = eventDate;
    this.entryTime = entryTime;
    this.punchType = punchType;
  }
}

module.exports = User;

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
 * 
 *      ReportSingle:
 *        type: object
 *        required:
 *          - startDate
 *          - endDate
 *        properties:
 *          startDate:
 *            type: string
 *            description: A String representation of the date to start reporting on. Formatted YYYY-MM-DD
 *          endDate:
 *            type: string
 *            description: A String representation of the date to start reporting on. Formatted YYYY-MM-DD
 *          userID:
 *            type: uuid="Defaults To User Making Request"
 *            description: User To Report Over The Time Period Requested
 *
 *        example:
 *           "startDate": "2020-04-16"
 *           "endDate": "2020-04-20"
 *           "userID": "70c505eb-6671-47e6-a8a7-9d7d7fccf2b6"
 *       
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
