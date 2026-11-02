import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

export type IdentifiedRequest = Request & { requestId: string };

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<IdentifiedRequest>();
    const response = context.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Não foi possível processar a solicitação.';
    let details: Record<string, unknown> = {};

    if (exception instanceof HttpException && status < 500) {
      const body = exception.getResponse();
      code = status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : `HTTP_${status}`;
      if (typeof body === 'object' && body !== null && 'message' in body) {
        if (Array.isArray(body.message)) {
          message = 'Confira os dados enviados.';
          details = { messages: body.message };
        } else if (typeof body.message === 'string') {
          message = status === 404 ? 'Recurso não encontrado.' : body.message;
        }
      }
    } else if (status === HttpStatus.SERVICE_UNAVAILABLE) {
      code = 'SERVICE_UNAVAILABLE';
      message = 'Serviço temporariamente indisponível. Tente novamente.';
    }

    if (status >= 500) {
      // Não registrar a exceção bruta: drivers podem incluir credenciais e dados.
      this.logger.error({ message: 'Falha ao atender solicitação.', requestId: request.requestId, status });
    }

    response.status(status).json({ error: { code, message, details, requestId: request.requestId } });
  }
}
