import { ok } from "../../utils/apiResponse.js";
import {
  exportAppointments,
  exportIncomes,
} from "./exports.service.js";

export async function exportAppointmentsController(req, res, next) {
  try {
    const { from, to } = req.query;

    const appointments = await exportAppointments({ from, to });

    return ok(res, { appointments });
  } catch (error) {
    return next(error);
  }
}

export async function exportIncomesController(req, res, next) {
  try {
    const { from, to } = req.query;

    const incomes = await exportIncomes({ from, to });

    return ok(res, { incomes });
  } catch (error) {
    return next(error);
  }
}