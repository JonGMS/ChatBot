const stateMap: Map<string, string> = new Map();

export class ConversationStateRepository {
  static set(userId: string, step: string) {
    stateMap.set(userId, step);
  }

  static get(userId: string): string | undefined {
    return stateMap.get(userId);
  }

  static clear(userId: string) {
    stateMap.delete(userId);
  }
}