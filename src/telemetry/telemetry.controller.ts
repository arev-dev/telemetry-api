import { Body, Controller, Post, Put ,Param, Get, NotFoundException, BadGatewayException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
export class TelemetryController {
    constructor(
    private readonly telemetryService: TelemetryService,
  ) {}

  @Get('get-sessions-active')
  getActiveSessions() {
    return this.telemetryService.getActiveSessions();
  }

  @Post('session-start')
  createSession(@Body() dto: any) {
    return this.telemetryService.create({
      eventType: 'session_start',
      ...dto,
    });
  }

  @Put('session-end/:id')
  async endSession(@Param('id') id: string) {
    if(id.length === 0 || id === undefined){
      throw new BadRequestException('Session ID is required');
    }
    return this.telemetryService.endSession(id);
}

  @Post('error')
  reportError(@Body() dto: any) {
    return this.telemetryService.create({
      eventType: 'error',
      ...dto,
    });
  }
}

