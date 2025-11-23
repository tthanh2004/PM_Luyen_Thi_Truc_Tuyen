import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // BẬT CORS CHO FRONTEND
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // bỏ field thừa
      forbidNonWhitelisted: true, // báo lỗi nếu có field thừa
      transform: true, // tự convert string sang number
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API running at http://localhost:${port}`);
}
void bootstrap();
