import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import app from "./index";

// AWS Lambda handler for API Gateway v2 (HTTP APIs)
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  // Make sure to set this flag so we don't hang on Keep-Alive connections
  context.callbackWaitsForEmptyEventLoop = false;

  // Convert API Gateway event to Express-like request
  const requestMethod = event.requestContext.http.method;
  const requestPath = event.rawPath;
  const requestHeaders = event.headers || {};

  // Create a mock request object for Express
  const req = {
    method: requestMethod,
    url: `${requestPath}${event.rawQueryString ? `?${event.rawQueryString}` : ""}`,
    headers: requestHeaders,
    body: event.body,
  };

  // Create a mock response object
  const res = {
    statusCode: 200,
    headers: {},
    body: "",
  };

  // Handle the request through Express
  try {
    // This is a simplified example - in production, you'd want to use
    // a proper serverless Express handler like aws-serverless-express
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "SuperhostOS API is running on AWS Lambda",
        path: requestPath,
        method: requestMethod,
      }),
    };
  } catch (error) {
    console.error("Lambda handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
      }),
    };
  }
};

// For local testing with serverless-offline
export const app_handler = app;
