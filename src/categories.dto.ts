import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { CATEGORIES_FR } from './categories.constant';

//TODO EN / ES must bee added !
export class CategoryQueryDto {
  @IsNotEmpty({ message: 'Category is required' })
  @IsString()
  @IsIn(CATEGORIES_FR, { 
    message: `Category must be one of: ${CATEGORIES_FR.join(', ')}` 
  })
  category: string;
}