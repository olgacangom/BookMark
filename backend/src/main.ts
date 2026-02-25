import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; 
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activa la validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Borra datos que no estén en el DTO (seguridad extra)
    forbidNonWhitelisted: true, // Lanza error si envían campos "inventados"
    transform: true, // Convierte los datos a los tipos de TypeScript automáticamente
  }));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap().catch((err: unknown) => {
  console.error(err);
});
