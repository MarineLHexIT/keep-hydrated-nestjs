import { Module } from '@nestjs/common';
import { D1Service } from './d1.service';

@Module({
  providers: [
    {
      provide: 'DB',
      useValue: (globalThis as any).DB,
    },
    D1Service,
  ],
  exports: [D1Service],
})
export class D1Module {}
