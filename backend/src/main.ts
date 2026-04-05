import { NestFactory, Reflector } from '@nestjs/core'; // 1. Importa Reflector
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'; // 2. Importa ClassSerializerInterceptor
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap().catch((err: unknown) => {
  console.error(err);
});
