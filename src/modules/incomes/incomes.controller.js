import { ok } from "../../utils/apiResponse.js";
import {
  getIncomeByAppointmentId,
  listIncomesByDate,
  markIncomePaid,
  setIncomeStatus,
  createManualIncome,
  listIncomesByRange,
} from "./incomes.service.js";

export async function getIncomeByAppointmentIdController(req, res, next) {
  try {
    const { appointmentId } = req.params;

    const income = await getIncomeByAppointmentId({ appointmentId });

    return ok(res, { income });
  } catch (error) {
    return next(error);
  }
}

export async function listIncomesByDateController(req, res, next) {
  try {
    const { dateStr } = req.query;

    const incomes = await listIncomesByDate({ dateStr });

    return ok(res, { incomes });
  } catch (error) {
    return next(error);
  }
}

export async function markIncomePaidController(req, res, next) {
  try {
    const { incomeId, paymentMethod, amountFinal, paidDateStr } = req.body;

    const income = await markIncomePaid({
      incomeId,
      paymentMethod,
      amountFinal,
      paidDateStr,
    });

    return ok(res, {
      message: "Cobro registrado correctamente.",
      income,
    });
  } catch (error) {
    return next(error);
  }
}

export async function setIncomeStatusController(req, res, next) {
  try {
    const { id } = req.params;
    const { paidStatus } = req.body;

    const income = await setIncomeStatus({
      incomeId: id,
      paidStatus,
    });

    return ok(res, {
      message: "Estado de cobro actualizado correctamente.",
      income,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createManualIncomeController(req, res, next) {
  try {
    const { concept, amountFinal, paymentMethod, paidDateStr } = req.body;

    const income = await createManualIncome({
      concept,
      amountFinal,
      paymentMethod,
      paidDateStr,
    });

    return ok(
      res,
      {
        message: "Ingreso manual creado correctamente.",
        income,
      },
      201
    );
  } catch (error) {
    return next(error);
  }
}

export async function listIncomesByRangeController(req, res, next) {
  try {
    const { from, to } = req.query;

    const incomes = await listIncomesByRange({ from, to });

    return ok(res, { incomes });
  } catch (error) {
    return next(error);
  }
}