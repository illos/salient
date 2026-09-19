// SPDX-License-Identifier: GPL-3.0-only
/** Public immutable search only. A route unmount must not discard the loaded index. */
export function workerSearch<Input, Result>(create: () => Worker) {
  let worker: Worker | undefined;
  let sequence = 0;
  const pending = new Map<
    number,
    { resolve: (value: Result) => void; reject: (error: Error) => void }
  >();
  return async (input: Input): Promise<Result> => {
    if (!worker) {
      worker = create();
      worker.onmessage = ({
        data,
      }: MessageEvent<{ sequence: number; results: Result; error?: string }>) => {
        const request = pending.get(data.sequence);
        pending.delete(data.sequence);
        if (data.error) request?.reject(new Error(data.error));
        else request?.resolve(data.results);
      };
      worker.onerror = worker.onmessageerror = () => {
        worker?.terminate();
        worker = undefined;
        for (const request of pending.values())
          request.reject(new Error('Search could not load. Please try again.'));
        pending.clear();
      };
    }
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      try {
        worker!.postMessage({ ...input, sequence: id });
      } catch (error) {
        pending.delete(id);
        reject(error);
      }
    });
  };
}
