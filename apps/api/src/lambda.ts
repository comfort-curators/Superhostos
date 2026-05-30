import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (event) => ({
  statusCode: 200,
  body: JSON.stringify({
    message: "SuperhostOS API Lambda placeholder",
    path: event.rawPath,
    method: event.requestContext.http.method,
  }),
});
