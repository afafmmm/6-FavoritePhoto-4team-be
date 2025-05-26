import express from "express";
import passport from "passport";
import tradeRequestService from "../services/TradeRequestService.js";

const tradeRequestController = express.Router();

tradeRequestController.post(
  "/cards/:listedCardId/exchange",
  passport.authenticate("access-token", { session: false }),
  async (req, res, next) => {
    try {
      const { listedCardId } = req.params;  
      const applicantId = req.user.id;     
      const { offeredUserCardIds, description } = req.body; 

      const result = await tradeRequestService.createTradeRequest({
        listedCardId: Number(listedCardId),
        applicantId,
        offeredUserCardIds,
        description,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default tradeRequestController;
