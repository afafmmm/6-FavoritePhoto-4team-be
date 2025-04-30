import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import route1 from "./routes/route1.js";
import route2 from "./routes/route2.js";
import common from "./middleware/common.js";
import error from "./middleware/error.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use(common);

app.use("/route1", route1);
app.use("/route2", route2);

app.use(error);

// 서버 실행
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
