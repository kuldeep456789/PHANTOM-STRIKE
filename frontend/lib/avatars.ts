// ============================================================
// Avatar utility — maps avatarId to metadata + image path
// ============================================================
import { AvatarMeta, AVATARS } from '@/lib/types';

export function getAvatar(avatarId: number): AvatarMeta {
  return AVATARS[avatarId] ?? AVATARS[0];
}

export function getAvatarImagePath(avatarId: number): string {
  return `/avatars/avatar-${avatarId}.png`;
}
