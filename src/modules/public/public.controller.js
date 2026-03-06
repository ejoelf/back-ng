import { ok } from "../../utils/apiResponse.js";
import {
  getPublicBusiness,
  getPublicServices,
  getPublicStaff,
} from "./public.service.js";

export async function getPublicBusinessController(req, res, next) {
  try {
    const business = await getPublicBusiness();

    return ok(res, { business }, 200);
  } catch (error) {
    return next(error);
  }
}

export async function getPublicServicesController(req, res, next) {
  try {
    const services = await getPublicServices();

    return ok(res, { services }, 200);
  } catch (error) {
    return next(error);
  }
}

export async function getPublicStaffController(req, res, next) {
  try {
    const staff = await getPublicStaff();

    return ok(res, { staff }, 200);
  } catch (error) {
    return next(error);
  }
}