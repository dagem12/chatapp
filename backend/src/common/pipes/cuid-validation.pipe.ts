import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class CuidValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    // CUID format: starts with 'c', followed by 24 characters (base36)
    const cuidRegex = /^c[a-z0-9]{24}$/;
    
    if (!cuidRegex.test(value)) {
      throw new BadRequestException('Validation failed (cuid is expected)');
    }
    
    return value;
  }
}
