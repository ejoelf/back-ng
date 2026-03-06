import { ok } from "../../utils/apiResponse.js";
import {
  getBusiness,
  updateBusiness,
} from "./business.service.js";

export async function getBusinessController(req, res, next) {
  try {
    const business = await getBusiness();

    return ok(res, { business });
  } catch (error) {
    return next(error);
  }
}

export async function updateBusinessController(req, res, next) {
  try {
    const business = await updateBusiness(req.body);

    return ok(res, {
      message: "Negocio actualizado correctamente.",
      business,
    });
  } catch (error) {
    return next(error);
  }
}