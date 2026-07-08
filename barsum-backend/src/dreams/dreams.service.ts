import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dream } from './entities/dream.entity';
import { DreamStatus } from '../common/enums';
import { Child } from '../children/entities/child.entity';
import { FilesService, parseStoredFileUrl, imageMimeFromUrl } from '../files/files.service';

@Injectable()
export class DreamsService {
  constructor(
    @InjectRepository(Dream)
    private dreamRepo: Repository<Dream>,
    @InjectRepository(Child)
    private childRepo: Repository<Child>,
    private filesService: FilesService,
  ) {}

  async create(childId: string, dto: { name: string; photoUrl?: string }): Promise<Dream> {
    const child = await this.childRepo.findOne({ where: { id: childId } });
    if (!child) throw new NotFoundException('Child not found');

    const dream = this.dreamRepo.create({
      name: dto.name,
      photoUrl: dto.photoUrl,
      childId,
      parentId: child.parentId,
      targetCoins: 0,
      savedCoins: 0,
      status: DreamStatus.PENDING_APPROVAL,
    });
    return this.dreamRepo.save(dream);
  }

  async findMy(childId: string): Promise<Dream | null> {
    return this.dreamRepo.findOne({
      where: [
        { childId, status: DreamStatus.ACTIVE },
        { childId, status: DreamStatus.PENDING_APPROVAL },
      ],
    });
  }

  async findPendingForParent(parentId: string): Promise<Dream[]> {
    return this.dreamRepo.find({
      where: { parentId, status: DreamStatus.PENDING_APPROVAL },
      relations: ['child'],
      order: { createdAt: 'DESC' },
    });
  }

  async approve(id: string, parentId: string, targetCoins: number): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id } });
    if (!dream) throw new NotFoundException('Dream not found');
    if (dream.parentId !== parentId) throw new ForbiddenException('Not your child dream');
    if (dream.status !== DreamStatus.PENDING_APPROVAL) throw new BadRequestException('Dream is not pending approval');
    dream.targetCoins = targetCoins;
    dream.status = DreamStatus.ACTIVE;
    return this.dreamRepo.save(dream);
  }

  async reject(id: string, parentId: string, reason: string): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id } });
    if (!dream) throw new NotFoundException('Dream not found');
    if (dream.parentId !== parentId) throw new ForbiddenException('Not your child dream');
    if (dream.status !== DreamStatus.PENDING_APPROVAL) throw new BadRequestException('Dream is not pending approval');
    dream.rejectedReason = reason;
    dream.status = DreamStatus.REJECTED;
    return this.dreamRepo.save(dream);
  }

  async sendCoins(childId: string, amount: number, currentBalance: number): Promise<Dream> {
    if (currentBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }
    const dream = await this.dreamRepo.findOne({
      where: { childId, status: DreamStatus.ACTIVE },
    });
    if (!dream) throw new NotFoundException('No active dream');

    dream.savedCoins += amount;
    if (dream.savedCoins >= dream.targetCoins) {
      dream.status = DreamStatus.COMPLETED;
    }
    return this.dreamRepo.save(dream);
  }

  async update(
    id: string,
    childId: string,
    dto: { name?: string; targetCoins?: number },
  ): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id, childId } });
    if (!dream) throw new NotFoundException('Dream not found');
    Object.assign(dream, dto);
    return this.dreamRepo.save(dream);
  }

  async updatePhoto(id: string, childId: string, photoUrl: string): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id, childId } });
    if (!dream) throw new NotFoundException('Dream not found');
    dream.photoUrl = photoUrl;
    return this.dreamRepo.save(dream);
  }

  // Отдаём фото мечты через backend (тот же https-origin, что и API),
  // чтобы не упираться в mixed-content блокировку прямых http-ссылок MinIO на проде.
  async getPhoto(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const dream = await this.dreamRepo.findOne({ where: { id } });
    if (!dream?.photoUrl) throw new NotFoundException('Photo not found');
    const parsed = parseStoredFileUrl(dream.photoUrl);
    if (!parsed) throw new NotFoundException('Photo not found');
    const buffer = await this.filesService.getBuffer(parsed.key, parsed.bucket);
    return { buffer, contentType: imageMimeFromUrl(dream.photoUrl) };
  }
}
