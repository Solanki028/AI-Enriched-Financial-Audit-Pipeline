export class AsyncController {
  static wrap(handler) {
    return (request, response, next) => {
      Promise.resolve(handler(request, response, next)).catch(next);
    };
  }
}
