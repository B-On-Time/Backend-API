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
 *              type: string
 *              description: Notes for the day
 *
 *        example:
 *           "userId": "000000"
 *           "eventDate": "00/00/0000"
 *           "entryTime": "00:00"
 *           "punchType": "ADMIN"
 *           "notes": "NOTES TO REMEMBER"
 */
