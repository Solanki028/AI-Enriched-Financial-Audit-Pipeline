import { randomUUID } from 'node:crypto';

export class RequestIdMiddleware {
  constructor({ headerName = 'x-request-id', maximumLength = 128 } = {}) {
    this.headerName = headerName;
    this.maximumLength = maximumLength;
    this.handle = this.handle.bind(this);
  }

  handle(request, response, next) {
    const incomingRequestId = request.get(this.headerName);
    const requestId = this.#isValid(incomingRequestId) ? incomingRequestId : randomUUID();

    request.requestId = requestId;
    response.setHeader(this.headerName, requestId);
    next();
  }

  #isValid(value) {
    return (
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= this.maximumLength &&
      /^[a-zA-Z0-9._:-]+$/.test(value)
    );
  }
}
