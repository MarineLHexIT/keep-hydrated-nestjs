import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  NODE_ENV: string;
  JWT_EXPIRATION: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Create Nest.js app with Fastify (lighter than Express)
    const app = await NestFactory.create(
      AppModule,
      new FastifyAdapter({
        logger: env.NODE_ENV === 'development',
      }),
    );

    // Enable CORS
    app.enableCors();

    // Make environment variables available to the app
    app.setGlobalPrefix('api');

    // Initialize the app
    await app.init();

    // Handle the request
    const fastifyInstance = app.getHttpAdapter().getInstance();

    // Convert the request to Fastify format
    const url = new URL(request.url);
    const fastifyRequest = {
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers),
      body: request.body,
    };

    try {
      const response = await fastifyInstance.inject(fastifyRequest);

      return new Response(response.payload, {
        status: response.statusCode,
        headers: response.headers as HeadersInit,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          statusCode: 500,
          message: 'Internal server error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
