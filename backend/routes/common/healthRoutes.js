/**
 * Health Check Routes
 * Handles health check endpoints for system monitoring and status verification
 */
const express = require('express');
const router = express.Router();
const healthController = require('@controllers/healthController');

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: System health check
 *     description: Check the overall health and status of the application
 *     operationId: healthCheck
 *     security: []
 *     responses:
 *       200:
 *         description: System is healthy and operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Application is operational
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-08-03T15:30:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   enum: [development, staging, production]
 *                   example: development
 *                 uptime:
 *                   type: number
 *                   description: System uptime in seconds
 *                   example: 3600
 *                 status:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                           example: true
 *                         responseTime:
 *                           type: number
 *                           description: Database response time in milliseconds
 *                           example: 15
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                           description: Used memory in bytes
 *                           example: 67108864
 *                         total:
 *                           type: number
 *                           description: Total memory in bytes
 *                           example: 134217728
 *                         percentage:
 *                           type: number
 *                           description: Memory usage percentage
 *                           example: 50.0
 *                     cpu:
 *                       type: object
 *                       properties:
 *                         usage:
 *                           type: number
 *                           description: CPU usage percentage
 *                           example: 25.5
 *       503:
 *         description: System is experiencing issues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: System is experiencing issues
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-08-03T15:30:00.000Z"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       component:
 *                         type: string
 *                         example: database
 *                       status:
 *                         type: string
 *                         example: disconnected
 *                       message:
 *                         type: string
 *                         example: Unable to connect to MongoDB
 */
router.get('/', healthController.check);

module.exports = router;