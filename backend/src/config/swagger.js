const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Enterprise Hostel Management System API',
            version: '1.0.0',
            description: 'Full-featured REST API for managing student lifecycle, rooms, attendance, notifications, complaints and more.',
            contact: {
                name: 'HMS Support',
                email: 'support@hostel.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
                description: 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
