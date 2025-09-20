import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hedera Express Backend API',
      version: '1.0.0',
      description: 'Express backend with Hedera SDK integration for user management and Hedera account operations',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
              example: 1
            },
            balance: {
              type: 'number',
              description: 'User balance',
              example: 100.50
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'Supabase Auth user ID',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        HederaAccount: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Account ID',
              example: 1
            },
            account_id: {
              type: 'string',
              description: 'Hedera account ID',
              example: '0.0.123456'
            },
            private_key: {
              type: 'string',
              description: 'Account private key (actual Hedera private key)',
              example: '302e020100300506032b657004220420...'
            },
            public_key: {
              type: 'string',
              description: 'Account public key',
              example: '302a300506032b6570032100...'
            },
            alias: {
              type: 'string',
              description: 'Account alias',
              example: 'My Account'
            },
            balance: {
              type: 'number',
              description: 'Account balance in HBAR',
              example: 100.50
            },
            is_active: {
              type: 'boolean',
              description: 'Account status',
              example: true
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated Supabase Auth user ID',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        TransferRequest: {
          type: 'object',
          required: ['fromAccountId', 'toAccountId', 'amount'],
          properties: {
            fromAccountId: {
              type: 'string',
              description: 'Source account ID',
              example: '0.0.123456'
            },
            toAccountId: {
              type: 'string',
              description: 'Destination account ID',
              example: '0.0.789012'
            },
            amount: {
              type: 'number',
              description: 'Amount to transfer in HBAR',
              example: 10.5,
              minimum: 0.01
            }
          }
        },
        PaymentRequest: {
          type: 'object',
          required: ['fromAccountId', 'toAccountId', 'amount'],
          properties: {
            fromAccountId: {
              type: 'string',
              description: 'Source account ID',
              example: '0.0.123456'
            },
            toAccountId: {
              type: 'string',
              description: 'Destination account ID',
              example: '0.0.789012'
            },
            amount: {
              type: 'number',
              description: 'Amount to transfer in HBAR',
              example: 10.5,
              minimum: 0.01
            },
            memo: {
              type: 'string',
              description: 'Payment memo',
              example: 'Payment for services'
            }
          }
        },
        CreateUserRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password (minimum 6 characters)',
              example: 'password123'
            }
          }
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            balance: {
              type: 'number',
              description: 'New user balance',
              example: 100.50,
              minimum: 0
            }
          }
        },
        CreateHederaAccountRequest: {
          type: 'object',
          required: ['user_id'],
          properties: {
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'UUID of the existing user (required)',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            alias: {
              type: 'string',
              description: 'Optional alias for the Hedera account',
              example: 'My Hedera Account'
            },
            initial_balance: {
              type: 'number',
              description: 'Initial account balance in HBAR (defaults to 0)',
              example: 100,
              minimum: 0
            }
          }
        },
        UpdateHederaAccountRequest: {
          type: 'object',
          properties: {
            alias: {
              type: 'string',
              description: 'Account alias',
              example: 'Updated Account Name'
            },
            isActive: {
              type: 'boolean',
              description: 'Account status',
              example: true
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        AuthSignupRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'securePassword123',
              minLength: 6
            }
          }
        },
        AuthSigninRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'securePassword123'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Authentication success status'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                      description: 'Supabase Auth user ID',
                      example: '123e4567-e89b-12d3-a456-426614174000'
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                      description: 'User email',
                      example: 'user@example.com'
                    },
                    created_at: {
                      type: 'string',
                      format: 'date-time',
                      description: 'User creation timestamp'
                    }
                  }
                },
                session: {
                  type: 'object',
                  properties: {
                    access_token: {
                      type: 'string',
                      description: 'JWT access token'
                    },
                    refresh_token: {
                      type: 'string',
                      description: 'Refresh token'
                    },
                    expires_in: {
                      type: 'integer',
                      description: 'Token expiration time in seconds'
                    },
                    token_type: {
                      type: 'string',
                      description: 'Token type',
                      example: 'bearer'
                    }
                  }
                }
              }
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and signup operations'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Hedera',
        description: 'Hedera blockchain operations'
      },
      {
        name: 'Hedera Accounts',
        description: 'Hedera account management operations for existing users'
      },
      {
        name: 'Diagnostics',
        description: 'System diagnostics and troubleshooting tools'
      }
    ]
  },
  apis: ['./src/routes/*.ts'] // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
