import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tendersRouter from "./tenders";
import contractorsRouter from "./contractors";
import rtisRouter from "./rtis";
import dashboardRouter from "./dashboard";
import searchRouter from "./search";
import scanRouter from "./scan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tendersRouter);
router.use(contractorsRouter);
router.use(rtisRouter);
router.use(dashboardRouter);
router.use(searchRouter);
router.use(scanRouter);

export default router;
