import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMonsterDto {
  @IsOptional()
  @IsInt()
  wakfuId?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  iconPath?: string;

  @IsOptional()
  @IsInt()
  levelMin?: number;

  @IsOptional()
  @IsInt()
  levelMax?: number;

  @IsOptional()
  @IsBoolean()
  capturable?: boolean;

  @IsOptional()
  @IsInt()
  familyId?: number;
}
