import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://blog-website-ashy-kappa.vercel.app', // Add https://
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // ← ADD '0.0.0.0' HERE
  console.log(`Server is running on port ${port}`);
}
bootstrap();
