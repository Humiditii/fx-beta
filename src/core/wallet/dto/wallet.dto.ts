import { IsEnum, IsNumber } from "class-validator";
import { Currency } from "src/common/interface/main.interface";

export class FundWalletDto {
    @IsEnum(Currency)
    currency: Currency;
    @IsNumber()
    amount: number;
}

export class ConvertCurrencyDto {
    @IsEnum(Currency)
    fromCurrency: Currency;
    @IsEnum(Currency)
    toCurrency: Currency;
    @IsNumber()
    fromAmount: number;
}