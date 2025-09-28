import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import BNPLService from '../services/bnpl.service.js';

export class BNPLRoutes {
  private router: Router;
  private bnpl: BNPLService;

  constructor(bnplService?: BNPLService) {
    this.router = Router();
    this.bnpl = bnplService || new BNPLService();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Connect to contract (optional)
    this.router.post('/connect', async (req: Request, res: Response) => {
      const { address } = req.body;
      if (!address) return res.status(400).json({ success: false, error: 'address required' });
      try {
        this.bnpl.connectTo(address);
        return res.json({ success: true, address });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });

    this.router.post('/agreements', async (req: Request, res: Response) => {
      const { consumer, merchant, principalEther, interestRateBps, numInstallments } = req.body;
      if (!consumer || !merchant || !principalEther || !interestRateBps || !numInstallments) {
        return res.status(400).json({ success: false, error: 'missing fields' });
      }
      try {
  const principalWei = ethers.utils.parseEther(principalEther).toString();
  const receipt = await this.bnpl.createAgreement(consumer, merchant, principalWei, interestRateBps, numInstallments);
        return res.json({ success: true, receipt });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });

    this.router.get('/agreements/:id', async (req: Request, res: Response) => {
      const { id } = req.params;
      try {
        const ag = await this.bnpl.getAgreement(id);
        return res.json({ success: true, agreement: ag });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });

    this.router.post('/agreements/:id/pay', async (req: Request, res: Response) => {
      const { id } = req.params;
      const { amountEther } = req.body;
      if (!amountEther) return res.status(400).json({ success: false, error: 'amountEther required' });
      try {
  const valueWei = ethers.utils.parseEther(amountEther).toString();
  const receipt = await this.bnpl.payInstallment(id, valueWei);
        return res.json({ success: true, receipt });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default BNPLRoutes;
