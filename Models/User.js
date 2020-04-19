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
 *      User:
 *        type: object
 *        required:
 *          - userId
 *          - eventDate
 *          - entryTime
 *          - punchType
 *          - notes
 *        properties:
 *          userId:
 *            type: integer
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
 *              type: string
 *              description: Notes for the day
 *
 *        example:
 *           "userId": 9161725
 *           "eventDate": "12/01/2104"
 *           "entryTime": "21:34"
 *           "punchType": "PTO"
 *           "notes": "I parked in the garage"
 */
