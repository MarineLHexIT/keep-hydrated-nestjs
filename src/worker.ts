import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { D1Database } from '@cloudflare/workers-types';
import type { ExecutionContext } from '@cloudflare/workers-types';
import type { FastifyReply, FastifyRequest } from 'fastify';

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
    _ctx: ExecutionContext,
  ): Promise<Response> {
    try {
      // Create Nest.js app with Fastify
      const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
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
        body: await request.json().catch(() => null),
      } as unknown as FastifyRequest;

      // Handle the request
      const response = (await fastifyInstance.inject(
        fastifyRequest,
      )) as FastifyReply;

      return new Response(response.payload as string, {
        status: response.statusCode,
        headers: response.headers as HeadersInit,
      });
    } catch (err) {
      console.error('Error handling request:', err);
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
