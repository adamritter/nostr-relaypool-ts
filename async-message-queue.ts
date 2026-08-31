export class AsyncMessageQueue {
  private queue: any[] = [];
  private isProcessing = false;
  private processNext: () => void;

  constructor(processCallback: (message: any) => Promise<void>) {
    this.processNext = async () => {
      if (this.queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.isProcessing = true;
      const message = this.queue.shift();
      try {
        await processCallback(message);
      } catch (err) {
        console.error("Error processing message:", err);
      } finally {
        // Using Promise.resolve().then() to avoid deep call stacks for large queues
        Promise.resolve().then(this.processNext);
      }
    };
  }

  public push(message: any) {
    this.queue.push(message);
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  public get length() {
    return this.queue.length;
  }
}