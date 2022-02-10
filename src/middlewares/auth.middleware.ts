import { MiddlewareFn } from "type-graphql";
import { Response, Request } from "express";
import { environment } from "../config/environments";
import { verify } from "jsonwebtoken";

export interface IContext {
  req: Request;
  res: Response;
  payload: { userId: string };
}

export const isAuth: MiddlewareFn<IContext> = ({ context }, next) => {
  try {
    const bearerToken = context.req.headers["authorization"];
    if (!bearerToken) {
      throw new Error("Unauthorized");
    }

    //El token llega así: "Bearer ejemmploDeTokenadkljfjadffg"
    //Con split separo en 2 el string por el espacio, guardandolo en un array
    //["Bearer","ejemmploDeTokenadkljfjadffg"]
    //accedo al 2do elemento
    const jwt = bearerToken.split(" ")[1];
    const payload = verify(jwt, environment.JWT_SECRET);
    context.payload = payload as any;
  } catch (error) {
    throw error;
  }
  return next();
};
