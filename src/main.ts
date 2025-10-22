import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'blog-website-ashy-kappa.vercel.app',
    ],
    // according to the doc, this origin, will allow only the requests that comes from the defined route
    credentials: true, // we set this to true to 'enable' CORS so that, the request only work with the defined route. if set to false, that means we 'disable' CORS.
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
