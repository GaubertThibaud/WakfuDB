import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.JobCreateInput) {
    try {
      return await this.prisma.job.create({
        data,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('A job with this name already exists');
      }
      throw error;
    }
  }
  
  async findAll() {
    return this.prisma.job.findMany({
      include: {
        recipes: true,
      },
    });
  }
  
  async findOne(id: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        recipes: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async findByName(name: string) {
    return this.prisma.job.findUnique({
      where: { name },
      include: {
        recipes: true,
      },
    });
  }

  async update(id: number, data: Prisma.JobUpdateInput) {
    try {
      return await this.prisma.job.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Job with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('A job with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.job.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Job with ID ${id} not found`);
      }
      throw error;
    }
  }
}