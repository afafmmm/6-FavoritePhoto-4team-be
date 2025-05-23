import express from "express";
import passport from "passport";
import SalesService from "../services/SalesService.js";

const salesController = express.Router();

salesController.post(
  "/cards",
  passport.authenticate("access-token", { session: false }),
  async (req, res, next) => {
    try {
      const sellerId = req.user.id;
      const saleData = req.body;

      const result = await SalesService.createSale({ sellerId, ...saleData });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default salesController;
