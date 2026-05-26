import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tendersRouter from "./tenders";
import contractorsRouter from "./contractors";
import rtisRouter from "./rtis";
import dashboardRouter from "./dashboard";
import searchRouter from "./search";
import scanRouter from "./scan";
import sandboxRouter from "./sandbox";
import voiceRouter from "./voice";
import whistleblowerRouter from "./whistleblower";
import officialsRouter from "./officials";
import networkRouter from "./network";
import marchRushRouter from "./march-rush";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tendersRouter);
router.use(contractorsRouter);
router.use(rtisRouter);
router.use(dashboardRouter);
router.use(searchRouter);
router.use(scanRouter);
router.use(sandboxRouter);
router.use(voiceRouter);
router.use(whistleblowerRouter);
router.use(officialsRouter);
router.use(networkRouter);
router.use(marchRushRouter);

export default router;
