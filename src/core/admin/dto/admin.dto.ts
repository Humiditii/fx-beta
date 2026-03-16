import { IsUUID, IsEnum, IsNumber } from "class-validator";
import { Currency } from "src/common/interface/main.interface";

export class AdminFundUserDto {
    @IsUUID()
    userId: string;
    @IsEnum(Currency)
    currency: Currency;
    @IsNumber()
    amount: number;
}