import { Router } from "express";
import {test} from "../controller/test.js"

const router = Router();

router.get("/", test);

export default router;