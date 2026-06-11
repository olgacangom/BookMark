import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { ClubsModule } from './club/club.module';
import { BookstoreModule } from './bookstore/bookstore.module';
import { ChatModule } from './chat/chat.module';
import { AIModule } from './ai/ai.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ClubsModule,
    BookstoreModule,
    ChatModule,
    AuthModule,
    UsersModule,
    BooksModule,
    AIModule,

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      extra: {
        statement_timeout: 60000,
        query_timeout: 60000,
        connection_timeout_millis: 60000,
      },
      poolSize: 10,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
