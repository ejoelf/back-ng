import { ok } from "../../utils/apiResponse.js";
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from "./clients.service.js";

export async function getClientsController(req, res, next) {
  try {
    const clients = await listClients();
    return ok(res, { clients });
  } catch (error) {
    return next(error);
  }
}

export async function createClientController(req, res, next) {
  try {
    const client = await createClient(req.body);
    return ok(res, {
      message: "Cliente creado correctamente.",
      client,
    }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateClientController(req, res, next) {
  try {
    const client = await updateClient(req.params.clientId, req.body);
    return ok(res, {
      message: "Cliente actualizado correctamente.",
      client,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteClientController(req, res, next) {
  try {
    await deleteClient(req.params.clientId);
    return ok(res, {
      message: "Cliente eliminado correctamente.",
    });
  } catch (error) {
    return next(error);
  }
}