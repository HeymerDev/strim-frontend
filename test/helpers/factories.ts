// Fábricas de datos con los tipos de la API (src/lib/types.ts).
import type { AuthSession, ChatMessage, Me, Profile, PublicChannel, StreamDashboard } from '../../src/lib/types';

type MeOverrides = Partial<Omit<Me, 'profile' | 'channel'>> & {
  profile?: Partial<Profile>;
  channel?: Partial<Me['channel']>;
};

export function makeMe(overrides: MeOverrides = {}): Me {
  const { profile, channel, ...rest } = overrides;
  return {
    id: 'u-1',
    email: 'ana@mail.com',
    ...rest,
    profile: { username: 'ana', displayName: 'Ana Torres', bio: '', avatarUrl: null, ...profile },
    channel: { status: 'offline', title: '', liveStartedAt: null, ...channel },
  };
}

/** Sesión válida durante una hora (lo que devuelven login y verify-email). */
export function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: makeMe(),
    ...overrides,
  };
}

export function makeChannel(overrides: Partial<PublicChannel> = {}): PublicChannel {
  return {
    username: 'ana',
    displayName: 'Ana Torres',
    bio: 'Juego y converso.',
    avatarUrl: null,
    title: 'Speedrun de domingo',
    isLive: true,
    liveStartedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    viewers: 12,
    playbackUrl: 'http://media.test/ana/index.m3u8',
    ...overrides,
  };
}

let messageId = 0;

type MessageOverrides = Partial<Omit<ChatMessage, 'author'>> & { author?: Partial<ChatMessage['author']> };

export function makeMessage(overrides: MessageOverrides = {}): ChatMessage {
  messageId += 1;
  const { author, ...rest } = overrides;
  return {
    id: `m-${messageId}`,
    content: `Mensaje ${messageId}`,
    createdAt: '2026-01-01T21:07:00.000Z',
    ...rest,
    author: { username: 'luis', displayName: 'Luis', avatarUrl: null, ...author },
  };
}

export function makeDashboard(overrides: Partial<StreamDashboard> = {}): StreamDashboard {
  return {
    status: 'offline',
    title: '',
    liveStartedAt: null,
    obs: { server: 'rtmp://media.test:1935', streamKey: 'ana?key=clave-secreta' },
    ...overrides,
  };
}
