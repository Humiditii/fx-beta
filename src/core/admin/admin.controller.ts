import { Controller, Get, Patch, Param, Query, Post, Body } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import {
  SwaggerGetUsers,
  SwaggerToggleUserStatus,
  SwaggerAdminFundUser,
  SwaggerGetAllTransactions,
} from './admin.swagger';
import { ApiBody } from '@nestjs/swagger';
import { Roles } from 'src/common/guard/decorator/roles.decorator';
import { Role } from 'src/common/interface/main.interface';
import { AppResponse } from 'src/common/appRespose.parser';
import { AdminFundUserDto } from './dto/admin.dto';


@Roles(Role.Admin)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly walletService: WalletService,
  ) { }

  @SwaggerGetUsers()
  @Get('users')
  async getUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    const [users, total] = await this.dataSource.getRepository(User).findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return AppResponse.success('Users retrieved', 200, { users, total });
  }

  @SwaggerToggleUserStatus()
  @Patch('users/:id/toggle-status')
  async toggleUserStatus(@Param('id') id: string) {
    const repo = this.dataSource.getRepository(User);
    const user = await repo.findOneBy({ id });
    if (!user) return AppResponse.error({ message: 'User not found', status: 404 });

    user.isActive = !user.isActive;
    await repo.save(user);
    return AppResponse.success(`User ${user.isActive ? 'activated' : 'deactivated'}`, 200);
  }

  @SwaggerAdminFundUser()
  @Post('fund-user')
  @ApiBody({ type: AdminFundUserDto })
  async fundUser(@Body() dto: AdminFundUserDto) {
    const data = await this.walletService.fundWallet(dto.userId, dto.currency, dto.amount);
    return AppResponse.success('User wallet funded successfully', 200, data);
  }

  @SwaggerGetAllTransactions()
  @Get('transactions')
  async getAllTransactions(@Query('page') page = 1, @Query('limit') limit = 10) {
    const [transactions, total] = await this.dataSource.getRepository(Transaction).findAndCount({
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return AppResponse.success('Transactions retrieved', 200, { transactions, total });
  }
}
