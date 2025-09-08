import type { SDKMessage, SDKUserMessage } from "@anthropic-ai/claude-code";

export type OnMessage = (message: SDKMessage) => void | Promise<void>;

// 画像/テキストを含むユーザー入力（フロント/APIと整合）
export type UserMessageInput =
  | string
  | {
      text?: string;
      images?: {
        data: string;
        mimeType: "image/png" | "image/jpeg" | "image/webp";
      }[];
    };

export type MessageGenerator = () => AsyncGenerator<
  SDKUserMessage,
  void,
  unknown
>;

const createPromise = <T>() => {
  let promiseResolve: ((value: T) => void) | undefined;
  let promiseReject: ((reason?: unknown) => void) | undefined;

  const promise = new Promise<T>((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });

  if (!promiseResolve || !promiseReject) {
    throw new Error("Illegal state: Promise not created");
  }

  return {
    promise,
    resolve: promiseResolve,
    reject: promiseReject,
  } as const;
};

export const createMessageGenerator = (
  firstMessage: UserMessageInput,
): {
  generateMessages: MessageGenerator;
  setNextMessage: (message: UserMessageInput) => void;
  setFirstMessagePromise: () => void;
  resolveFirstMessage: () => void;
  awaitFirstMessage: () => Promise<void>;
} => {
  let sendMessagePromise = createPromise<UserMessageInput>();
  let receivedFirstMessagePromise = createPromise<undefined>();

  const toSdkMessages = (input: UserMessageInput): SDKUserMessage[] => {
    if (typeof input === "string") {
      return [
        {
          type: "user",
          message: { role: "user", content: input },
        } as SDKUserMessage,
      ];
    }

    const blocks: unknown[] = [];
    for (const img of input.images ?? []) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mimeType,
          data: img.data,
        },
      });
    }
    if (input.text && input.text.trim() !== "") {
      blocks.push({ type: "text", text: input.text });
    }

    if (blocks.length === 0) {
      return [];
    }

    type TextBlock = { type: "text"; text: string };
    type ImageBlock = {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };
    return [
      {
        type: "user",
        message: {
          role: "user",
          content: blocks as Array<TextBlock | ImageBlock>,
        },
      } as SDKUserMessage,
    ];
  };

  async function* generateMessages(): ReturnType<MessageGenerator> {
    const queue: SDKUserMessage[] = [...toSdkMessages(firstMessage)];

    while (true) {
      if (queue.length === 0) {
        const input = await sendMessagePromise.promise;
        sendMessagePromise = createPromise<UserMessageInput>();
        queue.push(...toSdkMessages(input));
      }
      const next = queue.shift();
      if (next) {
        yield next;
      }
    }
  }

  const setNextMessage = (message: UserMessageInput) => {
    sendMessagePromise.resolve(message);
  };

  const setFirstMessagePromise = () => {
    receivedFirstMessagePromise = createPromise<undefined>();
  };

  const resolveFirstMessage = () => {
    receivedFirstMessagePromise.resolve(undefined);
  };

  const awaitFirstMessage = async () => {
    await receivedFirstMessagePromise.promise;
  };

  return {
    generateMessages,
    setNextMessage,
    setFirstMessagePromise,
    resolveFirstMessage,
    awaitFirstMessage,
  };
};
