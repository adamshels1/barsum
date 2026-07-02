import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  list(@Request() req: any) {
    return this.sessionsService.findEnrollmentsByChild(req.user.sub);
  }

  @Get('parent')
  listForParent(@Request() req: any) {
    return this.sessionsService.findEnrollmentsByParent(req.user.sub);
  }

  @Get('students')
  listStudents(@Request() req: any) {
    return this.sessionsService.findStudentsByExpert(req.user.sub);
  }

  @Get('students/:childId')
  getStudent(@Request() req: any, @Param('childId') childId: string) {
    return this.sessionsService.findStudentDetail(req.user.sub, childId);
  }
}
