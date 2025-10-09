import { Router, Request, Response } from 'express';
import { kycService } from '../services/kyc.service';
import { 
  CreateKYCRequest, 
  UpdateKYCRequest, 
  GetKYCResponse, 
  CreateKYCResponse, 
  UpdateKYCResponse,
  ApiResponse 
} from '../types';

const router = Router();

/**
 * GET /kyc/:userId
 * Get KYC data for a specific user
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      } as ApiResponse);
    }

    const kyc = await kycService.getKYCByUserId(userId);

    const response: GetKYCResponse = {
      kyc,
      success: true,
      message: kyc ? 'KYC data retrieved successfully' : 'No KYC data found for user'
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting KYC data:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

/**
 * POST /kyc
 * Create new KYC data for a user
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const kycData: CreateKYCRequest = req.body;

    // Validate required fields
    if (!kycData.user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      } as ApiResponse);
    }

    // Validate KYC data
    const validation = kycService.validateKYCData(kycData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: validation.errors.join(', ')
      } as ApiResponse);
    }

    // Check if KYC data already exists for this user
    const existingKYC = await kycService.getKYCByUserId(kycData.user_id);
    if (existingKYC) {
      return res.status(409).json({
        success: false,
        error: 'KYC data already exists for this user. Use PUT to update.'
      } as ApiResponse);
    }

    const kyc = await kycService.createKYC(kycData);

    const response: CreateKYCResponse = {
      kyc,
      success: true,
      message: 'KYC data created successfully'
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error creating KYC data:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

/**
 * PUT /kyc/:userId
 * Update KYC data for a specific user
 */
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updateData: UpdateKYCRequest = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      } as ApiResponse);
    }

    // Validate KYC data
    const validation = kycService.validateKYCData(updateData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: validation.errors.join(', ')
      } as ApiResponse);
    }

    // Check if KYC data exists for this user
    const existingKYC = await kycService.getKYCByUserId(userId);
    if (!existingKYC) {
      return res.status(404).json({
        success: false,
        error: 'KYC data not found for this user'
      } as ApiResponse);
    }

    const kyc = await kycService.updateKYC(userId, updateData);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update KYC data'
      } as ApiResponse);
    }

    const response: UpdateKYCResponse = {
      kyc,
      success: true,
      message: 'KYC data updated successfully'
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error updating KYC data:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

/**
 * POST /kyc/upsert
 * Create or update KYC data (upsert operation)
 */
router.post('/upsert', async (req: Request, res: Response) => {
  try {
    const kycData: CreateKYCRequest = req.body;

    // Validate required fields
    if (!kycData.user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      } as ApiResponse);
    }

    // Validate KYC data
    const validation = kycService.validateKYCData(kycData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: validation.errors.join(', ')
      } as ApiResponse);
    }

    const kyc = await kycService.upsertKYC(kycData);

    const response: CreateKYCResponse = {
      kyc,
      success: true,
      message: 'KYC data saved successfully'
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error upserting KYC data:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

/**
 * DELETE /kyc/:userId
 * Delete KYC data for a specific user
 */
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      } as ApiResponse);
    }

    // Check if KYC data exists for this user
    const existingKYC = await kycService.getKYCByUserId(userId);
    if (!existingKYC) {
      return res.status(404).json({
        success: false,
        error: 'KYC data not found for this user'
      } as ApiResponse);
    }

    const success = await kycService.deleteKYC(userId);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete KYC data'
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'KYC data deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting KYC data:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

export default router;
