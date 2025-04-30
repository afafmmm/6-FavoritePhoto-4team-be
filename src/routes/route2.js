import express from "express";
import auth from "../middleware/auth.js";

const route2 = express.Router();

route2.use(auth);

export default route2;
